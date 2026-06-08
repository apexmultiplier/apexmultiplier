import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cetwzfuzcmuigbmtokah.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNldHd6ZnV6Y211aWdibXRva2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTc4NzYsImV4cCI6MjA5NDE3Mzg3Nn0.HQeevcm3vxepQKjuYw_2eJdZS__huh8fytej78N1dik'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  try {
    console.log('Selecting a single row with select(*)')
    const { data, error } = await supabase.from('investment_plans').select('*').limit(1)
    console.log('error:', error)
    console.log('data:', data)
    if (data && data.length > 0) {
      console.log('Columns present on returned row:')
      console.log(Object.keys(data[0]))
    } else {
      console.log('No rows returned (table empty) but select(*) succeeded; cannot inspect column values.')
    }
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

run()
