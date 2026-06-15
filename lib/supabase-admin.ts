import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

let admin: any = null

if (supabaseUrl && supabaseServiceRole) {
	admin = createClient(supabaseUrl, supabaseServiceRole)
} else {
	// Fallback stub to avoid build-time crashes when env vars are not provided.
	admin = {
		auth: { admin: { createUser: async () => ({ data: null, error: new Error('SUPABASE_SERVICE_ROLE_KEY not set') }) } },
		from: () => ({ upsert: async () => ({ data: null, error: new Error('SUPABASE_SERVICE_ROLE_KEY not set') }) })
	}
}

export { admin }
export default admin
