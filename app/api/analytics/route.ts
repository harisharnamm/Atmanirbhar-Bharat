import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// GET /api/analytics - Get analytics data for tracking links
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const pledgeId = searchParams.get('pledgeId')
    const trackingId = searchParams.get('trackingId')
    const timeframe = searchParams.get('timeframe') || '7d' // 1d, 7d, 30d, 90d, all
    const includeDetails = searchParams.get('includeDetails') === 'true'

    const supabase = createServerClient()

    // Build time filter using Indian timezone
    let timeFilter = ''
    const now = new Date()
    const indianTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}))
    
    switch (timeframe) {
      case '1d':
        timeFilter = `clicked_at >= '${new Date(indianTime.getTime() - 24 * 60 * 60 * 1000).toISOString()}'`
        break
      case '7d':
        timeFilter = `clicked_at >= '${new Date(indianTime.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()}'`
        break
      case '30d':
        timeFilter = `clicked_at >= '${new Date(indianTime.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()}'`
        break
      case '90d':
        timeFilter = `clicked_at >= '${new Date(indianTime.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()}'`
        break
      // 'all' means no time filter
    }

    let query = supabase
      .from('tracking_analytics')
      .select('*')

    // Apply filters
    if (pledgeId) {
      query = query.eq('pledge_id', pledgeId)
    }
    if (trackingId) {
      query = query.eq('tracking_id', trackingId)
    }

    const { data: analytics, error } = await query

    if (error) {
      console.error('[api/analytics] Error fetching analytics:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch analytics',
        details: error.message 
      }, { status: 500 })
    }

    // Get detailed click data if requested
    let detailedClicks = null
    if (includeDetails && analytics && analytics.length > 0) {
      const trackingLinkIds = analytics.map(a => a.tracking_id)
      
      let clicksQuery = supabase
        .from('link_clicks')
        .select(`
          *,
          tracking_links!inner(tracking_id, pledge_id)
        `)
        .in('tracking_links.tracking_id', trackingLinkIds)

      if (timeFilter) {
        clicksQuery = clicksQuery.filter('clicked_at', 'gte', timeFilter.split("'")[1])
      }

      const { data: clicks, error: clicksError } = await clicksQuery
        .order('clicked_at', { ascending: false })
        .limit(1000) // Limit to prevent large responses

      if (!clicksError) {
        detailedClicks = clicks
      }
    }

    // Get time-based click trends
    const { data: trends, error: trendsError } = await supabase
      .from('link_clicks')
      .select(`
        clicked_at,
        tracking_links!inner(tracking_id, pledge_id)
      `)
      .in('tracking_links.pledge_id', analytics?.map(a => a.pledge_id) || [])
      .order('clicked_at', { ascending: true })

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
    console.error('[api/analytics] Exception:', e)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: e?.message || 'Unknown error' 
    }, { status: 500 })
  }
}

// Helper function to process trends data using Indian timezone
function processTrendsData(clicks: any[], timeframe: string) {
  const intervals: { [key: string]: number } = {}

  clicks.forEach(click => {
    const clickDate = new Date(click.clicked_at)
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
