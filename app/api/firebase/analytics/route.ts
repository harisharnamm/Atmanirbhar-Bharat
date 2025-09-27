import { NextRequest, NextResponse } from 'next/server'
import { createFirebaseServerClient } from '@/lib/firebase-server'
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore'

// GET /api/firebase/analytics - Get analytics data for tracking links
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const pledgeId = searchParams.get('pledgeId')
    const trackingId = searchParams.get('trackingId')
    const timeframe = searchParams.get('timeframe') || '7d' // 1d, 7d, 30d, 90d, all
    const includeDetails = searchParams.get('includeDetails') === 'true'

    const { db } = createFirebaseServerClient()

    // Build time filter using Indian timezone
    let timeFilter = new Date()
    const now = new Date()
    const indianTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}))
    
    switch (timeframe) {
      case '1d':
        timeFilter = new Date(indianTime.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        timeFilter = new Date(indianTime.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        timeFilter = new Date(indianTime.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        timeFilter = new Date(indianTime.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      // 'all' means no time filter
    }

    // Query tracking_analytics collection (this will be a computed collection in Firestore)
    let analyticsQuery = query(collection(db, 'tracking_analytics'))

    // Apply filters
    if (pledgeId) {
      analyticsQuery = query(analyticsQuery, where('pledge_id', '==', pledgeId))
    }
    if (trackingId) {
      analyticsQuery = query(analyticsQuery, where('tracking_id', '==', trackingId))
    }

    const analyticsSnapshot = await getDocs(analyticsQuery)
    const analytics = analyticsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Get detailed click data if requested (simplified for now)
    let detailedClicks = null
    if (includeDetails && analytics && analytics.length > 0) {
      // For now, get all clicks without complex filtering
      const clicksQuery = query(
        collection(db, 'link_clicks'),
        orderBy('clicked_at', 'desc'),
        limit(1000)
      )
      const clicksSnapshot = await getDocs(clicksQuery)
      detailedClicks = clicksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }

    // Get time-based click trends (simplified for now)
    let trends: any[] = []
    if (analytics && analytics.length > 0) {
      // For now, get all clicks without complex filtering
      const trendsQuery = query(
        collection(db, 'link_clicks'),
        orderBy('clicked_at', 'asc')
      )
      const trendsSnapshot = await getDocs(trendsQuery)
      trends = trendsSnapshot.docs.map(doc => doc.data())
    }


    // Process trends data
    const trendsData = processTrendsData(trends || [], timeframe)

    return NextResponse.json({ 
      success: true,
      data: {
        analytics: analytics || [],
        trends: trendsData,
        detailedClicks: detailedClicks,
        timeframe,
        generatedAt: new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"})
      }
    })

  } catch (e: any) {
    console.error('[api/firebase/analytics] Exception:', e)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: e?.message || 'Unknown error' 
    }, { status: 500 })
  }
}

// Helper function to process trends data using Indian timezone (same logic as Supabase version)
function processTrendsData(clicks: any[], timeframe: string) {
  const intervals: { [key: string]: number } = {}

  clicks.forEach(click => {
    const clickDate = new Date(click.clicked_at.toDate()) // Convert Firestore Timestamp
    // Convert to Indian timezone
    const indianDate = new Date(clickDate.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}))
    let intervalKey = ''

    switch (timeframe) {
      case '1d':
        // Hourly intervals in Indian time
        intervalKey = indianDate.toISOString().slice(0, 13) + ':00:00+05:30'
        break
      case '7d':
        // Daily intervals in Indian time
        intervalKey = indianDate.toISOString().slice(0, 10)
        break
      case '30d':
      case '90d':
        // Daily intervals in Indian time
        intervalKey = indianDate.toISOString().slice(0, 10)
        break
      default:
        // Weekly intervals in Indian time
        const weekStart = new Date(indianDate)
        weekStart.setDate(indianDate.getDate() - indianDate.getDay())
        intervalKey = weekStart.toISOString().slice(0, 10)
    }

    intervals[intervalKey] = (intervals[intervalKey] || 0) + 1
  })

  return Object.entries(intervals)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
