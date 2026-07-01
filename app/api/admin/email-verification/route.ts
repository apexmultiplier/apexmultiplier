import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

function normalizeStatus(value: string) {
  const status = String(value || '').toLowerCase()
  if (status === 'approved') return 'approved'
  if (status === 'rejected') return 'rejected'
  return 'pending'
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { id, requestId: rid, status, adminEmail } = body
    const requestId = rid || id
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json({ error: 'Supabase service role key not configured' }, { status: 500 })
    }

    if (!requestId) {
      return NextResponse.json({ error: 'Missing requestId' }, { status: 400 })
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY)
    const nextStatus = normalizeStatus(status)
    const updatedAt = new Date().toISOString()

    const updates: Record<string, any> = {
      status: nextStatus,
    }

    if (nextStatus === 'approved') {
      updates.verified_at = updatedAt
      if (adminEmail) updates.verified_by = adminEmail
    }

    const { data, error } = await admin
      .from('email_verification_requests')
      .update(updates)
      .eq('id', requestId)
      .select('*')

    if (error) {
      console.error('email verification update error', error)
      return NextResponse.json({ error: error?.message || String(error) }, { status: 500 })
    }

    const requestRow = Array.isArray(data) ? data[0] : data
    if (requestRow?.user_id || requestRow?.email) {
      const userPayload: Record<string, any> = {
        email_verification_status: nextStatus,
        email_verified_at: nextStatus === 'approved' ? updatedAt : null,
        email_verified_by: adminEmail || null,
      }

      if (nextStatus === 'approved') {
        userPayload.kyc_status = 'approved'
      } else if (nextStatus === 'rejected') {
        userPayload.kyc_status = 'rejected'
      }

      try {
        const userQuery = admin.from('users').update(userPayload)
        const { error: userError } = requestRow.user_id
          ? await userQuery.eq('id', requestRow.user_id)
          : await userQuery.eq('email', requestRow.email)

        if (userError) {
          console.warn('email verification user sync warning', userError)
        }
      } catch (userSyncError) {
        console.warn('email verification user sync failed', userSyncError)
      }
    }

    try {
      revalidatePath('/admin/email-verifications')
      revalidatePath('/admin')
      revalidatePath('/admin/kyc')
    } catch (revalidateError) {
      console.warn('revalidatePath unavailable or failed', revalidateError)
    }

    return NextResponse.json({ success: true, status: nextStatus, request: requestRow })
  } catch (e: any) {
    console.error('Admin email-verification API error:', e)
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 })
  }
}
