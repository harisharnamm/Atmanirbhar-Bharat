import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

async function createMissingFirebaseAnalytics() {
  console.log('📊 Creating missing Firebase analytics entries...\n')

  try {
    const app = initializeApp(firebaseConfig)
    const db = getFirestore(app)

    // Get all tracking links from Firebase
    const trackingLinksSnapshot = await getDocs(collection(db, 'tracking_links'))
    const trackingLinks = trackingLinksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    console.log(`Found ${trackingLinks.length} tracking links in Firebase`)

    // Get all existing analytics entries
    const analyticsSnapshot = await getDocs(collection(db, 'tracking_analytics'))
    const existingAnalytics = analyticsSnapshot.docs.map(doc => doc.data().tracking_id)

    console.log(`Found ${existingAnalytics.length} existing analytics entries`)

    let created = 0
    let skipped = 0

    for (const link of trackingLinks) {
      if (existingAnalytics.includes(link.tracking_id)) {
        console.log(`  ⏭️  Skipping ${link.tracking_id} - analytics already exists`)
        skipped++
        continue
      }

      // Create analytics entry for this tracking link
      const analyticsData = {
        tracking_id: link.tracking_id,
        pledge_id: link.pledge_id,
        original_pledge_id: link.original_pledge_id,
        link_created_at: link.created_at,
        total_clicks: 0,
        unique_visitors: 0,
        conversions: 0,
        conversion_rate: 0,
        clicks_from_india: 0,
        clicks_from_other: 0,
        mobile_clicks: 0,
        desktop_clicks: 0,
        tablet_clicks: 0,
        first_click: null,
        last_click: null,
        metadata: link.metadata || {},
        updated_at: Timestamp.now()
      }

      const analyticsRef = doc(db, 'tracking_analytics', link.tracking_id)
      await setDoc(analyticsRef, analyticsData, { merge: true })
      console.log(`  ✅ Created analytics for ${link.tracking_id}`)
      created++
    }

    console.log('\n🎉 Firebase analytics creation completed!')
    console.log('\n📊 Summary:')
    console.log(`   • Tracking links processed: ${trackingLinks.length}`)
    console.log(`   • New analytics created: ${created}`)
    console.log(`   • Already existing: ${skipped}`)

  } catch (error) {
    console.error('❌ Error creating Firebase analytics:', error.message)
    process.exit(1)
  }
}

createMissingFirebaseAnalytics().catch(console.error)
