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

      // ensure user exists and update balance
      const { data: existingUser } = await adminSupabase.from('users').select('*').eq('email', deposit.email).single()
      if (existingUser) {
        const newBalance = Number(existingUser.balance || 0) + Number(deposit.amount || 0)
        await adminSupabase.from('users').update({ balance: newBalance }).eq('email', deposit.email)
      } else {
        await adminSupabase.from('users').insert([{ email: deposit.email, balance: Number(deposit.amount || 0) }])
      }

      // determine plan and roi based on amount or deposit.plan_name
      const amt = Number(deposit.amount || 0)
      let roi = 8
      if (amt >= 10000) roi = 14
      else if (amt >= 5000) roi = 12
      else if (amt >= 2500) roi = 10
      else if (amt >= 1000) roi = 9
      else roi = 8
      const monthlyProfit = (amt * roi) / 100
      const dailyProfit = monthlyProfit / 30
      let planName = deposit.plan_name || 'STARTER'
      if (!planName) {
        if (amt >= 10000) planName = 'ELITE INFINITY'
        else if (amt >= 5000) planName = 'GOLD'
        else if (amt >= 2500) planName = 'PREMIUM'
        else if (amt >= 1000) planName = 'SILVER'
      }

      // create user plan (active) with full fields
      const now = new Date()
      const duration = deposit.duration || 30
      const startDate = now.toISOString()
      const endDate = new Date(now.getTime() + (duration || 30) * 24 * 60 * 60 * 1000).toISOString()
      const { error: planError } = await adminSupabase.from('user_plans').insert([{
        user_id: existingUser?.id || deposit.user_id || null,
        user_email: deposit.email,
        plan_name: planName,
        amount: amt,
        roi,
        duration: duration,
        daily_profit: dailyProfit,
        total_profit: monthlyProfit,
        start_date: startDate,
        end_date: endDate,
        status: 'active',
      }])
      if (planError) console.warn('Server plan insert warning:', planError)

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
