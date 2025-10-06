import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    // Check for required environment variables
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('[api/pledges/count] Missing environment variables:')
      console.error('NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.error('SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
      return NextResponse.json({
        error: 'Server not configured. Missing Supabase environment variables.',
        details: 'Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.'
      }, { status: 500 })
    }

    const supabase = createServerClient()

    // Get the total count of pledges
    const { count, error } = await supabase
      .from('pledges')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('[api/pledges/count] Count error:', error)
      return NextResponse.json({
        error: 'Database query failed',
        details: error.message
      }, { status: 400 })
    }

    // Add 3000 as requested by user
    const displayCount = (count || 0) + 3000

    console.log(`[api/pledges/count] Total pledges: ${count}, Display count: ${displayCount}`)

    return NextResponse.json({
      total: count || 0,
      display: displayCount
    })
  } catch (e: any) {
    console.error('[api/pledges/count] Exception:', e)
    return NextResponse.json({
      error: 'Internal server error',
      details: e?.message || 'Unknown error'
    }, { status: 500 })
  }
}
