import { NextRequest, NextResponse } from 'next/server'
import { createFirebaseServerClient } from '@/lib/firebase-server'
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { pledgeId, originalPledgeId, createdBy, metadata, expiresAt } = body

    const { db } = createFirebaseServerClient()

    // Generate tracking ID (same format as Supabase version)
    const trackingId = generateTrackingId()

    // Create tracking link
    const trackingLinkData = {
      tracking_id: trackingId,
      pledge_id: pledgeId,
      original_pledge_id: originalPledgeId,
      created_at: serverTimestamp(),
      created_by: createdBy || null,
      metadata: metadata || {},
      is_active: true,
      expires_at: expiresAt ? new Date(expiresAt) : null
    }

    const docRef = await addDoc(collection(db, 'tracking_links'), trackingLinkData)

    console.log(`[api/firebase/track-link] Tracking link created: ${trackingId}`)

    return NextResponse.json({ 
      success: true,
      trackingId: trackingId,
      trackingLinkId: docRef.id
    })

  } catch (e: any) {
    console.error('[api/firebase/track-link] Exception:', e)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: e?.message || 'Unknown error' 
    }, { status: 500 })
  }
}

// Generate tracking ID function (same logic as Supabase version)
function generateTrackingId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'TRK-'
  
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}
