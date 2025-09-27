import { NextRequest, NextResponse } from 'next/server'
import { createFirebaseServerClient } from '@/lib/firebase-server'
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { trackingId, ipAddress, userAgent, referrer, ...otherData } = body

    const { db } = createFirebaseServerClient()

    // Find the tracking link by tracking_id
    const trackingLinksQuery = query(
      collection(db, 'tracking_links'),
      where('tracking_id', '==', trackingId)
    )
    
    const trackingLinksSnapshot = await getDocs(trackingLinksQuery)
    
    if (trackingLinksSnapshot.empty) {
      return NextResponse.json({ 
        error: 'Tracking link not found',
        details: `No tracking link found with ID: ${trackingId}`
      }, { status: 404 })
    }

    const trackingLinkDoc = trackingLinksSnapshot.docs[0]
    const trackingLinkData = trackingLinkDoc.data()

    // Create click record
    const clickData = {
      tracking_link_id: trackingLinkDoc.id,
      clicked_at: serverTimestamp(),
      ip_address: ipAddress,
      user_agent: userAgent,
      referrer: referrer,
      ...otherData,
      // Store tracking link reference for easier querying
      tracking_links: {
        tracking_id: trackingLinkData.tracking_id,
        pledge_id: trackingLinkData.pledge_id
      }
    }

    const docRef = await addDoc(collection(db, 'link_clicks'), clickData)

    console.log(`[api/firebase/track-click] Click tracked successfully: ${docRef.id}`)

    return NextResponse.json({ 
      success: true,
      clickId: docRef.id
    })

  } catch (e: any) {
    console.error('[api/firebase/track-click] Exception:', e)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: e?.message || 'Unknown error' 
    }, { status: 500 })
  }
}
