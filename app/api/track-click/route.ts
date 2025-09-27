import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createFirebaseServerClient } from '@/lib/firebase-server'
import { collection, addDoc, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'

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
    const { db: firebaseDb } = createFirebaseServerClient()

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

    // Insert click record in Supabase (existing)
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

    // NEW: Also record click in Firebase (with retry logic)
    try {
      let firebaseClickRecorded = false
      let firebaseClickId = null
      let retryCount = 0
      const maxRetries = 3

      while (!firebaseClickRecorded && retryCount < maxRetries) {
        try {
          console.log(`[api/track-click] 🚀 STARTING FIREBASE CLICK RECORDING (attempt ${retryCount + 1})`)
          const firebaseData = {
            tracking_link_id: trackingLink.id,
            pledge_id: trackingLink.pledge_id, // Add pledge_id for easier querying
            tracking_id: trackingId, // Add tracking_id for easier querying
            clicked_at: Timestamp.now(),
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
          }

          console.log('[api/track-click] Firebase data to insert:', JSON.stringify(firebaseData, null, 2))
          const docRef = await addDoc(collection(firebaseDb, 'link_clicks'), firebaseData)
          firebaseClickId = docRef.id
          firebaseClickRecorded = true
          console.log(`[api/track-click] ✅ Successfully wrote click to Firebase: ${docRef.id}`)
        } catch (firebaseInsertError) {
          retryCount++
          console.error(`[api/track-click] ❌ Firebase click insert failed (attempt ${retryCount}):`, firebaseInsertError)

          if (retryCount < maxRetries) {
            console.log(`[api/track-click] ⏳ Retrying Firebase click insert in 1 second...`)
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      }

      if (!firebaseClickRecorded) {
        console.error('[api/track-click] ❌ Firebase click recording failed after all retries')
      }

      // NEW: Update analytics in Firebase (only if click was recorded)
      if (firebaseClickRecorded) {
        try {
          console.log('[api/track-click] 🚀 STARTING FIREBASE ANALYTICS UPDATE')
          const analyticsRef = doc(firebaseDb, 'tracking_analytics', trackingId)
          const analyticsSnap = await getDoc(analyticsRef)
          const currentTime = Timestamp.now()

          let currentAnalytics = null
          if (analyticsSnap.exists()) {
            console.log('[api/track-click] Found existing analytics document')
            currentAnalytics = analyticsSnap.data()
          } else {
            console.log('[api/track-click] Creating new analytics document')
            // Create analytics document if it doesn't exist
            currentAnalytics = {
              tracking_id: trackingId,
              pledge_id: trackingLink.pledge_id,
              original_pledge_id: trackingLink.pledge_id,
              link_created_at: Timestamp.fromDate(new Date()), // This should be from tracking_link but we don't have it
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
              metadata: {},
              updated_at: currentTime
            }
          }

          // Update analytics data
          const updatedAnalytics = {
            ...currentAnalytics,
            total_clicks: (currentAnalytics.total_clicks || 0) + 1,
            unique_visitors: currentAnalytics.unique_visitors || 0, // TODO: Implement unique visitor logic
            first_click: currentAnalytics.first_click || currentTime,
            last_click: currentTime,
            [`${deviceInfo.deviceType}_clicks`]: (currentAnalytics[`${deviceInfo.deviceType}_clicks`] || 0) + 1,
            clicks_from_other: (currentAnalytics.clicks_from_other || 0) + 1, // TODO: Implement country detection
            updated_at: currentTime
          }

          await setDoc(analyticsRef, updatedAnalytics, { merge: true })
          console.log(`[api/track-click] ✅ Successfully updated analytics in Firebase: ${trackingId} (${updatedAnalytics.total_clicks} clicks)`)
        } catch (analyticsError) {
          console.error('[api/track-click] ❌ Firebase analytics update error:', analyticsError)
          // Don't fail the request if analytics update fails
        }
      } else {
        console.log('[api/track-click] ⚠️ Skipping Firebase analytics update because click recording failed')
      }
    } catch (firebaseError) {
      console.error('[api/track-click] ❌ Firebase operations error:', firebaseError)
      // Don't fail the request if Firebase fails, just log it
    }

    return NextResponse.json({
      success: true,
      pledgeId: trackingLink.pledge_id,
      clickId: data.id,
      dualWrite: true
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
