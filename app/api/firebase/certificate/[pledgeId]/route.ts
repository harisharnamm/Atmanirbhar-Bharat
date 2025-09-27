import { NextRequest, NextResponse } from 'next/server'
import { createFirebaseServerClient } from '@/lib/firebase-server'
import { doc, getDoc } from 'firebase/firestore'

export async function GET(
  req: NextRequest,
  { params }: { params: { pledgeId: string } }
) {
  try {
    const { pledgeId } = params
    
    const { db } = createFirebaseServerClient()

    // Get pledge data from Firestore
    const pledgeDoc = await getDoc(doc(db, 'pledges', pledgeId))
    
    if (!pledgeDoc.exists()) {
      return NextResponse.json({ 
        error: 'Pledge not found',
        details: `No pledge found with ID: ${pledgeId}`
      }, { status: 404 })
    }

    const pledgeData = pledgeDoc.data()
    
    // Check if certificate URL exists
    if (!pledgeData.certificate_pdf_url) {
      return NextResponse.json({ 
        error: 'Certificate not available',
        details: 'No certificate URL found for this pledge'
      }, { status: 404 })
    }

    console.log(`[api/firebase/certificate] Certificate URL retrieved: ${pledgeData.certificate_pdf_url}`)

    return NextResponse.json({ 
      success: true,
      pledgeId: pledgeId,
      certificateUrl: pledgeData.certificate_pdf_url,
      certificateStableUrl: pledgeData.certificate_stable_url,
      name: pledgeData.name,
      district: pledgeData.district,
      constituency: pledgeData.constituency,
      village: pledgeData.village
    })

  } catch (e: any) {
    console.error('[api/firebase/certificate] Exception:', e)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: e?.message || 'Unknown error' 
    }, { status: 500 })
  }
}
