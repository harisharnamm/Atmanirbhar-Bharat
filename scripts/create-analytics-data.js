#!/usr/bin/env node

/**
 * Create Analytics Data Script
 * Creates tracking_analytics collection with computed analytics data
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, setDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

async function createAnalyticsData() {
  console.log('📊 Creating tracking_analytics collection...\n')
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig)
    const db = getFirestore(app)
    
    // Get all tracking links
    const trackingLinksSnapshot = await getDocs(collection(db, 'tracking_links'))
    console.log(`Found ${trackingLinksSnapshot.docs.length} tracking links`)
    
    for (const trackingLinkDoc of trackingLinksSnapshot.docs) {
      const trackingLinkData = trackingLinkDoc.data()
      const trackingLinkId = trackingLinkDoc.id
      
      console.log(`Processing tracking link: ${trackingLinkData.tracking_id}`)
      
      // Get click data for this tracking link
      const clicksQuery = query(
        collection(db, 'link_clicks'),
        where('tracking_link_id', '==', trackingLinkId)
      )
      const clicksSnapshot = await getDocs(clicksQuery)
      const clicks = clicksSnapshot.docs.map(doc => doc.data())
      
      console.log(`  Found ${clicks.length} clicks`)
      
      // Calculate analytics (mirrors Supabase view logic)
      const totalClicks = clicks.length
      const uniqueVisitors = new Set(clicks.map(c => c.ip_address)).size
      const conversions = clicks.filter(c => c.converted_to_pledge).length
      const clicksFromIndia = clicks.filter(c => c.country === 'India').length
      const clicksFromOther = totalClicks - clicksFromIndia
      const mobileClicks = clicks.filter(c => c.device_type === 'mobile').length
      const desktopClicks = clicks.filter(c => c.device_type === 'desktop').length
      const tabletClicks = clicks.filter(c => c.device_type === 'tablet').length
      
      const firstClick = clicks.length > 0 ? 
        Math.min(...clicks.map(c => c.clicked_at?.toDate?.() || new Date())) : null
      const lastClick = clicks.length > 0 ? 
        Math.max(...clicks.map(c => c.clicked_at?.toDate?.() || new Date())) : null
      
      const conversionRate = totalClicks > 0 ? Math.round((conversions / totalClicks) * 100 * 100) / 100 : 0
      
      // Create analytics document
      const analyticsData = {
        tracking_id: trackingLinkData.tracking_id,
        pledge_id: trackingLinkData.pledge_id,
        original_pledge_id: trackingLinkData.original_pledge_id,
        link_created_at: trackingLinkData.created_at,
        metadata: trackingLinkData.metadata,
        
        // Click statistics
        total_clicks: totalClicks,
        unique_visitors: uniqueVisitors,
        conversions: conversions,
        
        // Geographic distribution
        clicks_from_india: clicksFromIndia,
        clicks_from_other: clicksFromOther,
        
        // Device distribution
        mobile_clicks: mobileClicks,
        desktop_clicks: desktopClicks,
        tablet_clicks: tabletClicks,
        
        // Time-based analytics
        first_click: firstClick,
        last_click: lastClick,
        
        // Conversion rate
        conversion_rate: conversionRate,
        
        // Timestamps
        updated_at: serverTimestamp()
      }
      
      // Store in tracking_analytics collection
      await setDoc(doc(db, 'tracking_analytics', trackingLinkId), analyticsData)
      console.log(`  ✅ Created analytics for ${trackingLinkData.tracking_id}`)
    }
    
    console.log('\n🎉 tracking_analytics collection created successfully!')
    
    // Verify the collection was created
    const analyticsSnapshot = await getDocs(collection(db, 'tracking_analytics'))
    console.log(`\n📊 Analytics collection now has ${analyticsSnapshot.docs.length} documents`)
    
  } catch (error) {
    console.error('❌ Error creating analytics data:')
    console.error('   Error:', error.message)
    process.exit(1)
  }
}

// Run the script
createAnalyticsData().catch(console.error)
