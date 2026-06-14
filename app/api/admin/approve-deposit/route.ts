import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cetwzfuzcmuigbmtokah.supabase.co'
const SUPABASE_URL = String(rawSupabaseUrl).replace(/\/rest\/v1\/?$/i, '')

// Prefer the explicit *_KEY env var used in .env.local, then fallbacks.
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_KEY || ''
const SERVICE_ROLE_KEY_NAME = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SUPABASE_SERVICE_ROLE_KEY' : process.env.SUPABASE_SERVICE_ROLE ? 'SUPABASE_SERVICE_ROLE' : process.env.SUPABASE_SERVICE_KEY ? 'SUPABASE_SERVICE_KEY' : null

export async function POST(req: Request) {
  if (!SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Service role key not configured on server' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const { id, status, admin_note } = body
    if (!id || !status) return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })

    // log which env var provided the service key (helps debugging deployment envs)
    if (SERVICE_ROLE_KEY_NAME) console.debug('Using service role key from env:', SERVICE_ROLE_KEY_NAME)

    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Update deposit status
    const { error: updErr } = await adminSupabase.from('deposits').update({ status, admin_note: admin_note || null }).eq('id', id)
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

    if (status === 'approved') {
      // fetch deposit record
      const { data: depData, error: depErr } = await adminSupabase.from('deposits').select('*').eq('id', id).single()
      if (depErr) return NextResponse.json({ error: depErr.message }, { status: 500 })

      const deposit = depData as any
      console.log('Approved deposit')
      console.log('Deposit user_id', deposit.user_id)
      console.log('Deposit Amount', deposit.amount)

      // ensure user exists by user_id and update balance
      const userId = deposit.user_id || null
      let existingUser: any = null
      if (userId) {
        const { data } = await adminSupabase.from('users').select('*').eq('id', userId).single()
        existingUser = data
      }

      if (existingUser) {
        const newBalance = Number(existingUser.balance || 0) + Number(deposit.amount || 0)
        await adminSupabase.from('users').update({ balance: newBalance }).eq('id', userId)
      } else {
        console.warn('User not found for deposit.user_id', userId)
      }

      // determine plan by matching investment_plans table using deposit.amount within min/max range
      const amt = Number(deposit.amount || 0)
      let matchedPlan: any = null
      try {
        const { data: byRange } = await adminSupabase
          .from('investment_plans')
          .select('*')
          .lte('min_amount', amt) // min_amount <= amt
          .gte('max_amount', amt) // max_amount >= amt
          .eq('is_active', true)
          .limit(1)

        if (byRange && byRange.length > 0) matchedPlan = byRange[0]
      } catch (e) {
        console.warn('Failed to query investment_plans by range', e)
      }

      // fallback: try simple mapped names if no exact range match
      if (!matchedPlan) {
        let mappedName = ''
        if (amt === 500) mappedName = 'Starter'
        else if (amt === 1000) mappedName = 'Silver'
        else if (amt === 2500) mappedName = 'Premium'
        else if (amt === 5000) mappedName = 'Gold'
        else if (amt === 10000) mappedName = 'Elite Infinity'

        if (mappedName) {
          try {
            const { data: byName } = await adminSupabase.from('investment_plans').select('*').ilike('name', `%${mappedName}%`).eq('is_active', true).limit(1)
            if (byName && byName.length > 0) matchedPlan = byName[0]
          } catch (e) {
            console.warn('Failed to query investment_plans by name', e)
          }
        }
      }

      if (!matchedPlan) {
        console.warn('No matching investment_plan found for amount', amt)
        return NextResponse.json({ error: 'No matching investment_plan found for amount' }, { status: 500 })
      }

      const planId = matchedPlan.id
      const roiPercent = Number(matchedPlan.roi_percent ?? 0)
      const planDuration = Number(matchedPlan.duration_days ?? 30)
      const totalProfit = (amt * roiPercent) / 100
      const dailyProfit = totalProfit / 30
      console.log('Matched Plan', matchedPlan.name || matchedPlan.title || planId)
      console.log('ROI', roiPercent)
      console.log('Daily Profit', dailyProfit)

      // create or update user plan (active) with required fields
      const now = new Date()
      const duration = deposit.duration || 30
      const startDate = now.toISOString()
      const endDate = new Date(now.getTime() + (duration || 30) * 24 * 60 * 60 * 1000).toISOString()

      // Deactivate any existing active plans for this user (only one active plan allowed)
      try {
        const userEmail = deposit.email || existingUser?.email || null
        await adminSupabase.from('user_plans').update({ status: 'inactive' }).eq('user_email', userEmail).eq('status', 'active')
      } catch (e) {
        console.warn('Failed to deactivate existing user_plans', e)
      }

      // Insert or update user_plans with required fields
      try {
        const userEmail = deposit.email || existingUser?.email || null
        const { data: existingPlanRows } = await adminSupabase.from('user_plans').select('*').eq('user_email', userEmail).limit(1)
        const planPayload = {
          user_email: userEmail,
          plan_name: matchedPlan.name || matchedPlan.title || null,
          investment: amt,
          amount: amt,
          roi_percent: roiPercent,
          duration: planDuration,
          daily_profit: dailyProfit,
          total_profit: totalProfit,
          start_date: startDate,
          end_date: endDate,
          status: 'active'
        }

        console.log('user_plans payload', planPayload)

        if (existingPlanRows && existingPlanRows.length > 0) {
          const existing = existingPlanRows[0]
          const { error: updErr2 } = await adminSupabase.from('user_plans').update(planPayload).eq('id', existing.id)
          if (updErr2) console.warn('Failed to update user_plans', updErr2)
          else console.log('Updated user_plans record')
        } else {
          const { data: inserted, error: insertErr } = await adminSupabase.from('user_plans').insert([planPayload])
          if (insertErr) console.warn('Failed to insert user_plans', insertErr)
          else console.log('Inserted user_plans record', inserted)
        }
      } catch (e) {
        console.warn('Error handling user_plans insert/update', e)
      }

      // Create or update user_investments record (use foreign keys)
      try {
        const invPayload: any = {
          user_email: deposit.email || existingUser?.email || null,
          plan_name: matchedPlan.name || matchedPlan.title || null,
          investment: amt,
          amount: amt,
          roi_percent: roiPercent,
          monthly_roi: roiPercent,
          total_profit: totalProfit,
          start_date: startDate,
          end_date: endDate,
          status: 'active',
          duration: planDuration,
        }

        console.log('user_investments payload', invPayload)

        // try to update an existing investment for this user & plan using email+plan_name
        const { data: existingInv } = await adminSupabase.from('user_investments').select('*').eq('user_email', invPayload.user_email).eq('plan_name', invPayload.plan_name).limit(1)
        if (existingInv && existingInv.length > 0) {
          const { error: updInvErr } = await adminSupabase.from('user_investments').update(invPayload).eq('id', existingInv[0].id)
          if (updInvErr) console.warn('Failed to update user_investments', updInvErr)
          else console.log('Updated Investment')
        } else {
          const { data: insInv, error: invErr } = await adminSupabase.from('user_investments').insert([invPayload])
          if (invErr) console.warn('user_investments insert warning:', invErr)
          else console.log('Inserted Investment', insInv)
        }
      } catch (e) {
        console.warn('Failed to create/update user_investments', e)
      }

      // create transaction
      await adminSupabase.from('transactions').insert([{
        user_id: existingUser?.id || null,
        amount: amt,
        type: 'Deposit',
        status: 'Completed',
        network: deposit.network || null,
      }])

      // notification
      await adminSupabase.from('notifications').insert([{
        user_id: existingUser?.id || null,
        title: 'Deposit Approved',
        message: `Your deposit of $${amt.toFixed(2)} has been approved.`,
        read: false,
      }])
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('approve-deposit error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
