import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cetwzfuzcmuigbmtokah.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNldHd6ZnV6Y211aWdibXRva2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTc4NzYsImV4cCI6MjA5NDE3Mzg3Nn0.HQeevcm3vxepQKjuYw_2eJdZS__huh8fytej78N1dik'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const colsToCheck = [
  'id',
  'plan_name',
  'amount',
  'daily_profit',
  'monthly_profit',
  'roi_percentage',
  'duration_days',
  'description',
  'features',
  'status',
  'display_order',
  'created_at',
]

async function checkColumn(col) {
  try {
    const { data, error } = await supabase
      .from('investment_plans')
      .select(col)
      .limit(1)

    console.log(`\nSelect column: ${col}`)
    console.log('  data:', data)
    console.log('  error:', error)
    if (error) {
      console.log('  error.message:', error.message)
      console.log('  error.details:', error.details)
      console.log('  error.hint:', error.hint)
      console.log('  error.code:', error.code)
    }
  } catch (err) {
    console.error('Unexpected exception for', col, err)
  }
}

async function run() {
  console.log('Checking investment_plans columns (one-by-one)')
  for (const c of colsToCheck) {
    // eslint-disable-next-line no-await-in-loop
    await checkColumn(c)
  }
}

run()
