import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createFirebaseServerClient } from '@/lib/firebase-server'
import { collection, addDoc, doc, setDoc, Timestamp } from 'firebase/firestore'

// POST /api/track-link - Create a new tracking link
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { pledgeId, originalPledgeId, metadata = {}, createdBy } = body

    if (!pledgeId) {
      return NextResponse.json({ 
        error: 'pledgeId is required' 
      }, { status: 400 })
    }

    const supabase = createServerClient()
    const { db: firebaseDb } = createFirebaseServerClient()

    // First, check if a tracking link already exists for this pledge
    const { data: existingLink, error: checkError } = await supabase
      .from('tracking_links')
      .select('tracking_id, id')
      .eq('pledge_id', pledgeId)
      .single()

    if (existingLink && !checkError) {
      // Return existing tracking link
      return NextResponse.json({ 
        success: true,
        trackingId: existingLink.tracking_id,
        trackingLink: `/track/${existingLink.tracking_id}`,
        data: existingLink,
        existing: true
      })
    }

    // Generate tracking ID using the database function
    const { data: trackingIdResult, error: trackingIdError } = await supabase
      .rpc('generate_tracking_id')

    if (trackingIdError) {
      console.error('[api/track-link] Error generating tracking ID:', trackingIdError)
      return NextResponse.json({ 
        error: 'Failed to generate tracking ID' 
      }, { status: 500 })
    }

    const trackingId = trackingIdResult

    // Insert tracking link in Supabase (existing)
    const { data, error } = await supabase
      .from('tracking_links')
      .insert({
        tracking_id: trackingId,
        pledge_id: pledgeId,
        original_pledge_id: originalPledgeId || pledgeId,
        metadata,
        created_by: createdBy
      })
      .select()
      .single()

    if (error) {
      console.error('[api/track-link] Error creating tracking link:', error)
      return NextResponse.json({ 
        error: 'Failed to create tracking link',
        details: error.message 
      }, { status: 500 })
    }

    // NEW: Also create tracking link in Firebase
    try {
      const firebaseData = {
        tracking_id: trackingId,
        pledge_id: pledgeId,
        original_pledge_id: originalPledgeId || pledgeId,
        metadata,
        created_by: createdBy,
        is_active: true,
        expires_at: null,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      }
      
      const docRef = await addDoc(collection(firebaseDb, 'tracking_links'), firebaseData)
      console.log(`[api/track-link] Successfully wrote to Firebase: ${trackingId} -> ${docRef.id}`)

      // NEW: Also create automatic tracking_analytics entry in Firebase
      const analyticsData = {
        tracking_id: trackingId,
        pledge_id: pledgeId,
        original_pledge_id: originalPledgeId || pledgeId,
        link_created_at: Timestamp.now(),
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
        metadata: metadata || {},
        updated_at: Timestamp.now()
      }
      
      const analyticsRef = doc(firebaseDb, 'tracking_analytics', trackingId)
      await setDoc(analyticsRef, analyticsData, { merge: true })
      console.log(`[api/track-link] Successfully created analytics entry in Firebase: ${trackingId}`)
    } catch (firebaseError) {
      console.error('[api/track-link] Firebase insert error:', firebaseError)
      // Don't fail the request if Firebase fails, just log it
    }

    // Get the full URL with domain
    const origin = req.headers.get('origin')
    const host = req.headers.get('host')
    const referer = req.headers.get('referer')
    
    console.log('[api/track-link] Headers:', { origin, host, referer })
    
    let baseUrl = 'http://localhost:3000' // Default for local development
    
    if (origin) {
      baseUrl = origin
    } else if (host) {
      baseUrl = host.startsWith('http') ? host : `http://${host}`
    } else if (referer) {
      const url = new URL(referer)
      baseUrl = `${url.protocol}//${url.host}`
    }
    
    console.log('[api/track-link] Using baseUrl:', baseUrl)
    const fullUrl = baseUrl
    
    return NextResponse.json({ 
      success: true,
      trackingId,
      trackingLink: `${fullUrl}/track/${trackingId}`,
      data,
      dualWrite: true
    })

  } catch (e: any) {
    console.error('[api/track-link] Exception:', e)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: e?.message || 'Unknown error' 
    }, { status: 500 })
  }
}

// GET /api/track-link?trackingId=xxx - Get tracking link info
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const trackingId = searchParams.get('trackingId')

    if (!trackingId) {
      return NextResponse.json({ 
        error: 'trackingId is required' 
      }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('tracking_links')
      .select(`
        *,
        link_clicks(count)
      `)
      .eq('tracking_id', trackingId)
      .single()

    if (error) {
      console.error('[api/track-link] Error fetching tracking link:', error)
      return NextResponse.json({ 
        error: 'Tracking link not found',
        details: error.message 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      data 
    })

  } catch (e: any) {
    console.error('[api/track-link] Exception:', e)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: e?.message || 'Unknown error' 
    }, { status: 500 })
  }
}
