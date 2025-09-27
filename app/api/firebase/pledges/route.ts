import { NextRequest, NextResponse } from 'next/server'
import { createFirebaseServerClient } from '@/lib/firebase-server'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Check for required environment variables
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      console.error('[api/firebase/pledges] Missing environment variables:')
      console.error('NEXT_PUBLIC_FIREBASE_PROJECT_ID:', !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
      return NextResponse.json({ 
        error: 'Server not configured. Missing Firebase environment variables.',
        details: 'Please set NEXT_PUBLIC_FIREBASE_PROJECT_ID and other Firebase config in your environment.'
      }, { status: 500 })
    }
    
    const { db } = createFirebaseServerClient()
    const payload = Array.isArray(body) ? body : [body]
    
    console.log('[api/firebase/pledges] Attempting to upsert pledge data:', {
      pledge_id: payload[0]?.pledge_id,
      name: payload[0]?.name,
      hasSelfie: !!payload[0]?.selfie_url,
      hasCertificate: !!payload[0]?.certificate_pdf_url
    })
    
    // Process each pledge
    for (const pledge of payload) {
      const pledgeData = {
        ...pledge,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        // Ensure all required fields have defaults
        storage_location: pledge.storage_location || 'firebase',
        certificate_status: pledge.certificate_status || 'available',
        selfie_status: pledge.selfie_status || 'available',
        certificate_stable_url: pledge.certificate_stable_url || '',
        selfie_stable_url: pledge.selfie_stable_url || ''
      }
      
      // Use pledge_id as document ID for consistency with Supabase
      await setDoc(doc(db, 'pledges', pledge.pledge_id), pledgeData, { merge: true })
    }
    
    console.log('[api/firebase/pledges] Successfully upserted pledge data to Firebase')
    return NextResponse.json({ ok: true })
    
  } catch (e: any) {
    console.error('[api/firebase/pledges] Exception:', e)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: e?.message || 'Unknown error' 
    }, { status: 500 })
  }
}
