import { NextResponse } from 'next/server'
import { admin } from '../../../../lib/supabase-admin'

export async function POST(req: Request) {
  try {
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
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // Upsert role in users table
    const userId = userData.user?.id
    if (!userId) return NextResponse.json({ error: 'no user id returned' }, { status: 500 })

    const { data, error: upsertError } = await admin
      .from('users')
      .upsert({ id: userId, email, role: 'admin', admin_created_at: new Date().toISOString() })
      .select()

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: data?.[0] || null })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || String(e) }, { status: 500 })
  }
}
