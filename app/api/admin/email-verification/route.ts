import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('Admin email-verification API body:', body)
    const { id, requestId: rid, status, adminEmail } = body
    const requestId = rid || id
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json({ error: 'Supabase service role key not configured' }, { status: 500 })
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY)

    // Build updates object explicitly and validate
    const updates: any = {}
    if (String(status).toLowerCase() === 'approved') {
      updates.status = 'approved'
      updates.verified_at = new Date().toISOString()
      if (adminEmail) updates.verified_by = adminEmail
    } else {
      updates.status = 'rejected'
    }

    // Verify requestId and log inputs
    console.log('requestId', requestId)
    console.log('updates', updates)

    if (!requestId) {
      console.error('Missing requestId')
      return NextResponse.json({ error: 'Missing requestId' }, { status: 400 })
    }

    // Execute update and verify result
    const { data, error } = await admin
      .from('email_verification_requests')
      .update(updates)
      .eq('id', requestId)
      .select()

    console.log('Update Data:', data)
    console.log('Update Error:', error)

    if (error) {
      console.error(error)
      return NextResponse.json({ error: error?.message || String(error) }, { status: 500 })
    }

    if (!data || (Array.isArray(data) && data.length === 0)) {
      const msg = `No rows updated for requestId ${requestId}`
      console.error(msg)
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    // No additional user updates here; only modify email_verification_requests

    // Attempt to revalidate admin page so UI reflects changes (best-effort)
    try {
      revalidatePath('/admin/email-verifications')
    } catch (e) {
      console.warn('revalidatePath unavailable or failed', e)
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Admin email-verification API error:', e)
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 })
  }
}
