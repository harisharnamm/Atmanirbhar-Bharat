import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// POST /api/track-click - Record a click on a tracking link
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      trackingId, 
      sessionId, 
      userAgent, 
      referrer, 
      screenResolution, 
      language, 
      timezone 
    } = body

    if (!trackingId) {
      return NextResponse.json({ 
        error: 'trackingId is required' 
      }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get client IP and basic info
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               req.ip || 
               'unknown'

    // Get tracking link info
    const { data: trackingLink, error: linkError } = await supabase
      .from('tracking_links')
      .select('id, pledge_id, is_active')
      .eq('tracking_id', trackingId)
      .single()

    if (linkError || !trackingLink) {
      return NextResponse.json({ 
        error: 'Tracking link not found' 
      }, { status: 404 })
    }

    if (!trackingLink.is_active) {
      return NextResponse.json({ 
        error: 'Tracking link is inactive' 
      }, { status: 410 })
    }

    // Parse user agent for device/browser info
    const deviceInfo = parseUserAgent(userAgent || req.headers.get('user-agent') || '')

    // Insert click record
    const { data, error } = await supabase
      .from('link_clicks')
      .insert({
        tracking_link_id: trackingLink.id,
        ip_address: ip,
        user_agent: userAgent || req.headers.get('user-agent'),
        referrer: referrer || req.headers.get('referer'),
        device_type: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        browser_version: deviceInfo.browserVersion,
        os: deviceInfo.os,
        os_version: deviceInfo.osVersion,
        screen_resolution: screenResolution,
        language: language || req.headers.get('accept-language')?.split(',')[0],
        timezone,
        session_id: sessionId,
        is_bot: deviceInfo.isBot
      })
      .select()
      .single()

    if (error) {
      console.error('[api/track-click] Error recording click:', error)
      return NextResponse.json({ 
        error: 'Failed to record click',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      pledgeId: trackingLink.pledge_id,
      clickId: data.id
    })

  } catch (e: any) {
    console.error('[api/track-click] Exception:', e)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: e?.message || 'Unknown error' 
    }, { status: 500 })
  }
}

// Helper function to parse user agent
function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase()
  
  // Detect device type
  let deviceType = 'desktop'
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    deviceType = 'mobile'
  } else if (/tablet|ipad|playbook|silk/i.test(ua)) {
    deviceType = 'tablet'
  }

  // Detect browser
  let browser = 'unknown'
  let browserVersion = 'unknown'
  
  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome'
    const match = ua.match(/chrome\/(\d+\.\d+)/)
    if (match) browserVersion = match[1]
  } else if (ua.includes('firefox')) {
    browser = 'Firefox'
    const match = ua.match(/firefox\/(\d+\.\d+)/)
    if (match) browserVersion = match[1]
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari'
    const match = ua.match(/version\/(\d+\.\d+)/)
    if (match) browserVersion = match[1]
  } else if (ua.includes('edg')) {
    browser = 'Edge'
    const match = ua.match(/edg\/(\d+\.\d+)/)
    if (match) browserVersion = match[1]
  }

  // Detect OS
  let os = 'unknown'
  let osVersion = 'unknown'
  
  if (ua.includes('windows')) {
    os = 'Windows'
    if (ua.includes('windows nt 10.0')) osVersion = '10'
    else if (ua.includes('windows nt 6.3')) osVersion = '8.1'
    else if (ua.includes('windows nt 6.2')) osVersion = '8'
    else if (ua.includes('windows nt 6.1')) osVersion = '7'
  } else if (ua.includes('mac os x')) {
    os = 'macOS'
    const match = ua.match(/mac os x (\d+[._]\d+)/)
    if (match) osVersion = match[1].replace('_', '.')
  } else if (ua.includes('android')) {
    os = 'Android'
    const match = ua.match(/android (\d+\.\d+)/)
    if (match) osVersion = match[1]
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS'
    const match = ua.match(/os (\d+[._]\d+)/)
    if (match) osVersion = match[1].replace('_', '.')
  } else if (ua.includes('linux')) {
    os = 'Linux'
  }

  // Detect if it's a bot
  const isBot = /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegram/i.test(ua)

  return {
    deviceType,
    browser,
    browserVersion,
    os,
    osVersion,
    isBot
  }
}
