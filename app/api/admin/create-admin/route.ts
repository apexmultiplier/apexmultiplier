import { NextResponse } from 'next/server'
import { admin } from '../../../../lib/supabase-admin'

export async function POST(req: Request) {
  try {
    // Debug: print exact env values being loaded (for local debug)
    console.log('SUPABASE_URL =', process.env.SUPABASE_URL)
    console.log('NEXT_PUBLIC_SUPABASE_URL =', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('SERVICE_ROLE_KEY EXISTS =', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log('SUPABASE_SERVICE_ROLE_KEY =', process.env.SUPABASE_SERVICE_ROLE_KEY)

    // Prefer server-side SUPABASE_URL, fallback to NEXT_PUBLIC_SUPABASE_URL if set
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('Using SUPABASE_URL value from:', process.env.SUPABASE_URL ? 'SUPABASE_URL' : (process.env.NEXT_PUBLIC_SUPABASE_URL ? 'NEXT_PUBLIC_SUPABASE_URL' : 'none'))
    console.log('Resolved SUPABASE_URL =', SUPABASE_URL)
    console.log('Resolved SERVICE_ROLE_KEY exists =', !!SERVICE_ROLE_KEY)

    // Ensure server-side required env vars are set before proceeding
    const missing: string[] = []
    if (!SUPABASE_URL) missing.push('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
    if (!SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY')
    if (missing.length > 0) {
      const msg = `Missing required env vars: ${missing.join(', ')}`
      console.error(msg)
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    const body = await req.json()
    const { email, password } = body
    if (!email || !password) return NextResponse.json({ error: 'email and password required' }, { status: 400 })

    // Create via Supabase Admin Auth
    const { data: userData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError) {
      console.error('Supabase createUser error:', createError)
      // If the admin client was a fallback stub it returns an Error with message mentioning the missing key
      const message = createError.message || String(createError)
      if (message.toLowerCase().includes('supabase_service_role_key') || message.toLowerCase().includes('not set')) {
        return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not set on server. Check .env.local and hosting env.' }, { status: 500 })
      }
      return NextResponse.json({ error: message }, { status: 500 })
    }

    // Insert role in users table (do NOT write to public.users.id)
    const userId = userData.user?.id
    if (!userId) return NextResponse.json({ error: 'no user id returned' }, { status: 500 })

    const payload = {
      email,
      role: 'admin',
      user_id: userId,
      admin_created_at: new Date().toISOString(),
      admin_created_by: null,
    }

    console.log('Insert payload for public.users:', payload)

    const { data, error: insertError } = await admin
      .from('users')
      .insert(payload)
      .select()

    if (insertError) {
      console.error('Error inserting admin user record:', insertError)
      return NextResponse.json({ error: insertError.message || String(insertError) }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: data?.[0] || null })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || String(e) }, { status: 500 })
  }
}
