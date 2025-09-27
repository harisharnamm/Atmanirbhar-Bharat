import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createFirebaseServerClient } from '@/lib/firebase-server'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Check for required environment variables
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('[api/pledges] Missing environment variables:')
      console.error('NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.error('SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
      return NextResponse.json({ 
        error: 'Server not configured. Missing Supabase environment variables.',
        details: 'Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.'
      }, { status: 500 })
    }
    
    const supabase = createServerClient()
    const { db: firebaseDb } = createFirebaseServerClient()
    const payload = Array.isArray(body) ? body : [body]
    
    console.log('[api/pledges] Attempting to upsert pledge data to both Supabase and Firebase:', {
      pledge_id: payload[0]?.pledge_id,
      name: payload[0]?.name,
      hasSelfie: !!payload[0]?.selfie_url,
      hasCertificate: !!payload[0]?.certificate_pdf_url
    })
    
    // Write to Supabase (existing)
    const { error } = await supabase.from('pledges').upsert(payload, { onConflict: 'pledge_id' })
    if (error) {
      console.error('[api/pledges] Supabase upsert error:', error)
      return NextResponse.json({ 
        error: 'Database operation failed', 
        details: error.message 
      }, { status: 400 })
    }
    
    // NEW: Also write to Firebase
    try {
      for (const pledge of payload) {
        const pledgeRef = doc(firebaseDb, 'pledges', pledge.pledge_id)
        const firebaseData = {
          ...pledge,
          created_at: pledge.created_at ? Timestamp.fromDate(new Date(pledge.created_at)) : Timestamp.now(),
          updated_at: Timestamp.now(),
          storage_location: 'dual' // Mark as dual storage
        }
        await setDoc(pledgeRef, firebaseData, { merge: true })
        console.log(`[api/pledges] Successfully wrote to Firebase: ${pledge.pledge_id}`)
      }
    } catch (firebaseError) {
      console.error('[api/pledges] Firebase upsert error:', firebaseError)
      // Don't fail the request if Firebase fails, just log it
    }
    
    console.log('[api/pledges] Successfully upserted pledge data to both Supabase and Firebase')
    return NextResponse.json({ ok: true, dualWrite: true })
  } catch (e: any) {
    console.error('[api/pledges] Exception:', e)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: e?.message || 'Unknown error' 
    }, { status: 500 })
  }
}


