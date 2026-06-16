import { createClient } from "@supabase/supabase-js"

const envSupabaseUrl = process.env.SUPABASE_URL
const envPublicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

// Prefer server-side SUPABASE_URL, fallback to NEXT_PUBLIC_SUPABASE_URL
const resolvedSupabaseUrl = envSupabaseUrl || envPublicSupabaseUrl

let admin: any = null

if (resolvedSupabaseUrl && supabaseServiceRole) {
	console.log('supabase-admin: using SUPABASE_URL from', envSupabaseUrl ? 'SUPABASE_URL' : 'NEXT_PUBLIC_SUPABASE_URL')
	console.log('supabase-admin: resolved SUPABASE_URL =', resolvedSupabaseUrl)
	console.log('supabase-admin: SUPABASE_SERVICE_ROLE_KEY present =', !!supabaseServiceRole)
	admin = createClient(resolvedSupabaseUrl, supabaseServiceRole)
} else {
	// Fallback stub to avoid build-time crashes when env vars are not provided.
	console.warn('supabase-admin: missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY — using fallback stub')
	admin = {
		auth: { admin: { createUser: async () => ({ data: null, error: new Error('SUPABASE_SERVICE_ROLE_KEY not set') }) } },
		from: () => ({ upsert: async () => ({ data: null, error: new Error('SUPABASE_SERVICE_ROLE_KEY not set') }) })
	}
}

export { admin }
export default admin
