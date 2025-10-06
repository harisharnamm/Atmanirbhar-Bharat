import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPledgeStatus() {
  console.log('📊 Checking pledge status distribution...\n')

  try {
    const { data: statusCounts, error } = await supabase
      .rpc('execute_sql', {
        sql: `SELECT certificate_status, selfie_status, COUNT(*) as count FROM pledges GROUP BY certificate_status, selfie_status ORDER BY count DESC`
      })

    if (error) {
      console.error('❌ Error checking status:', error.message)
      return
    }

    console.log('📋 Pledge status distribution:')
    statusCounts.forEach(row => {
      console.log(`   ${row.certificate_status || 'NULL'} / ${row.selfie_status || 'NULL'}: ${row.count} pledges`)
    })

    // Check for any "deleted" status
    const hasDeleted = statusCounts.some(row =>
      row.certificate_status === 'deleted' || row.selfie_status === 'deleted'
    )

    if (!hasDeleted) {
      console.log('\n⚠️ No pledges with "deleted" status found.')
      console.log('💡 The progressive cleanup script looks for pledges with deleted status.')
      console.log('💡 You might need to update the query criteria or mark pledges for deletion first.')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkPledgeStatus().catch(console.error)
