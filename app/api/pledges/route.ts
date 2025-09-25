import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

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
    const payload = Array.isArray(body) ? body : [body]
    
    console.log('[api/pledges] Attempting to upsert pledge data:', {
      pledge_id: payload[0]?.pledge_id,
      name: payload[0]?.name,
      hasSelfie: !!payload[0]?.selfie_url,
      hasCertificate: !!payload[0]?.certificate_pdf_url
    })
    
    const { error } = await supabase.from('pledges').upsert(payload, { onConflict: 'pledge_id' })
    if (error) {
      console.error('[api/pledges] Supabase upsert error:', error)
      return NextResponse.json({ 
        error: 'Database operation failed', 
        details: error.message 
      }, { status: 400 })
    }
    
    console.log('[api/pledges] Successfully upserted pledge data')
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[api/pledges] Exception:', e)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: e?.message || 'Unknown error' 
    }, { status: 500 })
  }
}


