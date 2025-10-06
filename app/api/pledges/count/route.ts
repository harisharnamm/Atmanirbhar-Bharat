import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

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

    // Use RPC to fetch precise latest count
    const { data, error } = await supabase.rpc('get_pledge_count')

    const count = data || 0

    if (error) {
      console.error('[api/pledges/count] Count error:', error)
      return NextResponse.json({
        error: 'Database query failed',
        details: (error as any)?.message || 'Unknown error'
      }, { status: 400 })
    }

    // Add 13000 as requested by user
    const displayCount = (count || 0) + 13000

    return NextResponse.json({
      total: count || 0,
      display: displayCount
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (e: any) {
    console.error('[api/pledges/count] Exception:', e)
    return NextResponse.json({
      error: 'Internal server error',
      details: e?.message || 'Unknown error'
    }, { status: 500 })
  }
}
