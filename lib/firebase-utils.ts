import { db } from './firebase'
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  addDoc
} from 'firebase/firestore'

// Helper function to create tracking analytics data (mirrors Supabase view)
export async function createTrackingAnalytics(trackingLinkId: string) {
  try {
    // Get tracking link data
    const trackingLinkDoc = await getDoc(doc(db, 'tracking_links', trackingLinkId))
    if (!trackingLinkDoc.exists()) {
      throw new Error('Tracking link not found')
    }
    
    const trackingLinkData = trackingLinkDoc.data()
    
    // Get click data for this tracking link
    const clicksQuery = query(
      collection(db, 'link_clicks'),
      where('tracking_link_id', '==', trackingLinkId)
    )
    const clicksSnapshot = await getDocs(clicksQuery)
    const clicks = clicksSnapshot.docs.map(doc => doc.data())
    
    // Calculate analytics (mirrors Supabase view logic)
    const totalClicks = clicks.length
    const uniqueVisitors = new Set(clicks.map(c => c.ip_address)).size
    const conversions = clicks.filter(c => c.converted_to_pledge).length
    const clicksFromIndia = clicks.filter(c => c.country === 'India').length
    const clicksFromOther = totalClicks - clicksFromIndia
    const mobileClicks = clicks.filter(c => c.device_type === 'mobile').length
    const desktopClicks = clicks.filter(c => c.device_type === 'desktop').length
    const tabletClicks = clicks.filter(c => c.device_type === 'tablet').length
    
    const firstClick = clicks.length > 0 ? Math.min(...clicks.map(c => c.clicked_at?.toDate?.() || new Date())) : null
    const lastClick = clicks.length > 0 ? Math.max(...clicks.map(c => c.clicked_at?.toDate?.() || new Date())) : null
    
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
    
    return analyticsData
    
  } catch (error) {
    console.error('[firebase-utils] Error creating tracking analytics:', error)
    throw error
  }
}

// Helper function to generate tracking ID (same as Supabase function)
export function generateFirebaseTrackingId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'TRK-'
  
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

// Helper function to check if tracking ID exists
export async function trackingIdExists(trackingId: string): Promise<boolean> {
  const trackingQuery = query(
    collection(db, 'tracking_links'),
    where('tracking_id', '==', trackingId)
  )
  
  const snapshot = await getDocs(trackingQuery)
  return !snapshot.empty
}

// Helper function to get pledge data
export async function getPledgeData(pledgeId: string) {
  const pledgeDoc = await getDoc(doc(db, 'pledges', pledgeId))
  
  if (!pledgeDoc.exists()) {
    throw new Error(`Pledge not found: ${pledgeId}`)
  }
  
  return {
    id: pledgeDoc.id,
    ...pledgeDoc.data()
  }
}

// Helper function to update pledge data
export async function updatePledgeData(pledgeId: string, data: any) {
  const updateData = {
    ...data,
    updated_at: serverTimestamp()
  }
  
  await setDoc(doc(db, 'pledges', pledgeId), updateData, { merge: true })
}
