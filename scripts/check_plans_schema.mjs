import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cetwzfuzcmuigbmtokah.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNldHd6ZnV6Y211aWdibXRva2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTc4NzYsImV4cCI6MjA5NDE3Mzg3Nn0.HQeevcm3vxepQKjuYw_2eJdZS__huh8fytej78N1dik'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  try {
    console.log('Checking for table investment_plans and its columns...')

    const { data: cols, error } = await supabase
      .from('information_schema.columns')
      .select('column_name,data_type,ordinal_position')
      .eq('table_name', 'investment_plans')
      .order('ordinal_position', { ascending: true })

    console.log('Raw result error:', error)
    console.log('Raw result data:', cols)

    if (error) {
      console.error('Error fetching information_schema.columns:', error)
      process.exit(1)
    }

    if (!cols || cols.length === 0) {
      console.log('No columns returned — table may not exist or permissions blocked.')
      process.exit(0)
    }

    console.log('Columns for investment_plans:')
    for (const c of cols) {
      console.log(`- ${c.ordinal_position}: ${c.column_name} (${c.data_type})`)
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    process.exit(1)
  }
}

run()
