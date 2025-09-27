import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createFirebaseServerClient } from '@/lib/firebase-server'
import { collection, query, where, getDocs, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, trackingId, pledgeId } = body

    console.log('[api/track-conversion] Starting conversion tracking:', { sessionId, trackingId, pledgeId })

    // Debug: Check what clicks exist for this tracking ID
    if (trackingId) {
      console.log('[api/track-conversion] 🔍 Checking existing clicks for tracking ID:', trackingId)
      const { db } = createFirebaseServerClient()
      const { collection, query, where, getDocs } = await import('firebase/firestore')
      const clicksQuery = query(collection(db, 'link_clicks'), where('tracking_id', '==', trackingId))
      const clicksSnapshot = await getDocs(clicksQuery)
      console.log(`[api/track-conversion] Found ${clicksSnapshot.docs.length} clicks in Firebase for ${trackingId}`)
      clicksSnapshot.docs.forEach((doc, index) => {
        const clickData = doc.data()
        console.log(`[api/track-conversion] Click ${index + 1}: ${doc.id} - session: ${clickData.session_id} - converted: ${clickData.converted_to_pledge}`)
      })
    }

    // Ensure we have valid parameters (not just empty strings)
    const hasValidSessionId = sessionId && sessionId.trim() !== ''
    const hasValidTrackingId = trackingId && trackingId.trim() !== ''

    console.log('[api/track-conversion] Parameter validation:', {
      sessionId: `"${sessionId}"`,
      trackingId: `"${trackingId}"`,
      hasValidSessionId,
      hasValidTrackingId
    })

    if (!hasValidSessionId && !hasValidTrackingId) {
      return NextResponse.json({ error: 'sessionId or trackingId required' }, { status: 400 })
    }

    const supabase = createServerClient()
    const { db: firebaseDb } = createFirebaseServerClient()

    // Find the latest click for this session or tracking id in Supabase
    let supabaseQuery = supabase
      .from('link_clicks')
      .select('id, tracking_link_id')
      .order('clicked_at', { ascending: false })
      .limit(1)

    if (hasValidSessionId) {
      console.log('[api/track-conversion] Supabase: Querying by session_id:', sessionId)
      supabaseQuery = supabaseQuery.eq('session_id', sessionId)
    } else if (hasValidTrackingId) {
      console.log('[api/track-conversion] Supabase: Querying by tracking_id:', trackingId)
      // Need to join via tracking_links; do two-step
      const { data: tl, error: tlErr } = await supabase
        .from('tracking_links')
        .select('id')
        .eq('tracking_id', trackingId)
        .single()
      if (tlErr || !tl) {
        return NextResponse.json({ error: 'tracking link not found' }, { status: 404 })
      }
      supabaseQuery = supabaseQuery.eq('tracking_link_id', tl.id)
    }

    const { data: click, error: clickErr } = await supabaseQuery.single()
    if (clickErr || !click) {
      return NextResponse.json({ error: 'click not found' }, { status: 404 })
    }

    // Mark as converted in Supabase (existing)
    const { error: updErr } = await supabase
      .from('link_clicks')
      .update({ converted_to_pledge: true, conversion_pledge_id: pledgeId })
      .eq('id', click.id)

    if (updErr) {
      return NextResponse.json({ error: 'failed to update conversion', details: updErr.message }, { status: 500 })
    }

    // NEW: Also mark as converted in Firebase
    try {
      let firebaseClickQuery

      if (hasValidSessionId) {
        console.log('[api/track-conversion] Firebase: Querying by session_id:', sessionId)
        firebaseClickQuery = query(
          collection(firebaseDb, 'link_clicks'),
          where('session_id', '==', sessionId)
        )
      } else if (hasValidTrackingId) {
        console.log('[api/track-conversion] Firebase: Querying by tracking_id:', trackingId)
        firebaseClickQuery = query(
          collection(firebaseDb, 'link_clicks'),
          where('tracking_id', '==', trackingId)
        )
      }

      if (firebaseClickQuery) {
        console.log('[api/track-conversion] Querying Firebase clicks...')
        let firebaseClickSnapshot
        try {
          firebaseClickSnapshot = await getDocs(firebaseClickQuery)
          console.log(`[api/track-conversion] Found ${firebaseClickSnapshot.docs.length} Firebase clicks`)
        } catch (queryError) {
          console.error('[api/track-conversion] Firebase query error:', queryError)
          return NextResponse.json({
            error: 'Firebase query failed',
            details: queryError.message
          }, { status: 500 })
        }

        if (!firebaseClickSnapshot.empty) {
          console.log(`[api/track-conversion] Found ${firebaseClickSnapshot.docs.length} Firebase clicks to check for conversion`)

          // Find the most recent click by comparing clicked_at timestamps
          let latestClick = firebaseClickSnapshot.docs[0]
          let latestTime = latestClick.data().clicked_at?.toMillis() || 0

          console.log(`[api/track-conversion] Starting with click ${latestClick.id} at ${new Date(latestTime).toISOString()}`)

          for (const clickDoc of firebaseClickSnapshot.docs) {
            const clickTime = clickDoc.data().clicked_at?.toMillis() || 0
            console.log(`[api/track-conversion] Checking click ${clickDoc.id} at ${new Date(clickTime).toISOString()}`)
            if (clickTime > latestTime) {
              latestClick = clickDoc
              latestTime = clickTime
              console.log(`[api/track-conversion] New latest click: ${clickDoc.id}`)
            }
          }

          console.log(`[api/track-conversion] Selected click ${latestClick.id} for conversion (at ${new Date(latestTime).toISOString()})`)

          // Only update if this click is not already converted
          const clickData = latestClick.data()
          if (!clickData.converted_to_pledge) {
            const clickRef = latestClick.ref

            // Update the click record
            await updateDoc(clickRef, {
              converted_to_pledge: true,
              conversion_pledge_id: pledgeId,
              updated_at: Timestamp.now()
            })

            console.log(`[api/track-conversion] Successfully updated Firebase click: ${latestClick.id}`)
          } else {
            console.log(`[api/track-conversion] Click ${latestClick.id} already converted, skipping`)
          }
          
          // Also update analytics in Firebase (ALWAYS update conversions)
          if (trackingId) {
            try {
              const analyticsRef = doc(firebaseDb, 'tracking_analytics', trackingId)
              const analyticsSnap = await getDoc(analyticsRef)

              if (analyticsSnap.exists()) {
                const currentAnalytics = analyticsSnap.data()
                const newConversions = (currentAnalytics.conversions || 0) + 1

                const updatedAnalytics = {
                  ...currentAnalytics,
                  conversions: newConversions,
                  conversion_rate: currentAnalytics.total_clicks > 0
                    ? (newConversions / currentAnalytics.total_clicks) * 100
                    : 0,
                  updated_at: Timestamp.now()
                }

                await updateDoc(analyticsRef, updatedAnalytics)
                console.log(`[api/track-conversion] ✅ Updated Firebase analytics: ${trackingId} (${newConversions} conversions)`)
              } else {
                console.warn(`[api/track-conversion] ⚠️ Analytics document not found for tracking ID: ${trackingId}`)
                // Try to create analytics document
                try {
                  const newAnalytics = {
                    tracking_id: trackingId,
                    pledge_id: pledgeId, // We don't know this, but we can set it
                    original_pledge_id: pledgeId,
                    link_created_at: Timestamp.now(),
                    total_clicks: 1, // Assume at least 1 click
                    unique_visitors: 1,
                    conversions: 1,
                    conversion_rate: 100,
                    clicks_from_india: 0,
                    clicks_from_other: 1,
                    mobile_clicks: 0,
                    desktop_clicks: 1,
                    tablet_clicks: 0,
                    first_click: Timestamp.now(),
                    last_click: Timestamp.now(),
                    metadata: {},
                    updated_at: Timestamp.now()
                  }
                  await setDoc(analyticsRef, newAnalytics)
                  console.log(`[api/track-conversion] ✅ Created new Firebase analytics document: ${trackingId}`)
                } catch (createError) {
                  console.error('[api/track-conversion] ❌ Failed to create analytics document:', createError)
                }
              }
            } catch (analyticsError) {
              console.error('[api/track-conversion] ❌ Firebase analytics update error:', analyticsError)
            }
          }
        }
      }
    } catch (firebaseError) {
      console.error('[api/track-conversion] Firebase conversion update error:', firebaseError)
      // Don't fail the request if Firebase fails, just log it
    }

    console.log('[api/track-conversion] ✅ CONVERSION TRACKING COMPLETED SUCCESSFULLY')
    return NextResponse.json({ ok: true, dualWrite: true })
  } catch (e: any) {
    console.error('[api/track-conversion] ❌ CONVERSION TRACKING FAILED:', e)
    return NextResponse.json({ error: 'Internal server error', details: e?.message }, { status: 500 })
  }
}
