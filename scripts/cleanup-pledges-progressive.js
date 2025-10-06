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

async function cleanupPledgesProgressive() {
  console.log('🧹 Starting progressive pledge cleanup (increasing by 5 every minute)...\n')

  let batchSize = 5
  let totalProcessed = 0
  let minuteCount = 0

  while (true) {
    minuteCount++
    console.log(`\n⏰ Minute ${minuteCount}: Processing batch of ${batchSize} pledges`)

    try {
      // Get pledges that have been "deleted" (marked for cleanup)
      // You can modify this query based on your criteria
      const { data: pledgesToDelete, error } = await supabase
        .from('pledges')
        .select('pledge_id, selfie_status, certificate_status')
        .or('selfie_status.eq.deleted,certificate_status.eq.deleted')
        .limit(batchSize)

      if (error) {
        console.error('❌ Error fetching pledges to delete:', error.message)
        break
      }

      if (!pledgesToDelete || pledgesToDelete.length === 0) {
        console.log('✅ No more pledges to cleanup. All done!')
        break
      }

      console.log(`📋 Found ${pledgesToDelete.length} pledges to delete:`)
      pledgesToDelete.forEach(p => {
        console.log(`   - ${p.pledge_id}: selfie=${p.selfie_status}, cert=${p.certificate_status}`)
      })

      // Delete pledges (this will trigger the Firebase cleanup via the trigger)
      for (const pledge of pledgesToDelete) {
        console.log(`🗑️ Deleting pledge: ${pledge.pledge_id}`)

        const { error: deleteError } = await supabase
          .from('pledges')
          .delete()
          .eq('pledge_id', pledge.pledge_id)

        if (deleteError) {
          console.error(`❌ Failed to delete pledge ${pledge.pledge_id}:`, deleteError.message)
        } else {
          console.log(`✅ Successfully deleted pledge: ${pledge.pledge_id}`)
          totalProcessed++
        }

        // Small delay between deletes to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      console.log(`📊 Minute ${minuteCount} complete: ${pledgesToDelete.length} pledges processed`)

      // Increase batch size by 5 for next minute
      batchSize += 5
      console.log(`🔄 Next batch size will be: ${batchSize}`)

      // Wait for next minute (if there are more pledges)
      const { data: remainingCheck } = await supabase
        .from('pledges')
        .select('pledge_id')
        .or('selfie_status.eq.deleted,certificate_status.eq.deleted')
        .limit(1)

      if (remainingCheck && remainingCheck.length > 0) {
        console.log('⏳ Waiting 60 seconds for next batch...')
        await new Promise(resolve => setTimeout(resolve, 60000)) // 60 seconds
      }

    } catch (error) {
      console.error('❌ Unexpected error:', error)
      break
    }
  }

  console.log(`\n🎉 Cleanup completed! Total pledges processed: ${totalProcessed}`)
  console.log(`📈 Final batch size reached: ${batchSize - 5}`) // Subtract 5 since we added it but didn't use it
}

cleanupPledgesProgressive().catch(console.error)
