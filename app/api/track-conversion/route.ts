import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, trackingId, pledgeId } = body

    if (!sessionId && !trackingId) {
      return NextResponse.json({ error: 'sessionId or trackingId required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Find the latest click for this session or tracking id
    let query = supabase
      .from('link_clicks')
      .select('id, tracking_link_id')
      .order('clicked_at', { ascending: false })
      .limit(1)

    if (sessionId) {
      query = query.eq('session_id', sessionId)
    }

    if (trackingId) {
      // Need to join via tracking_links; do two-step
      const { data: tl, error: tlErr } = await supabase
        .from('tracking_links')
        .select('id')
        .eq('tracking_id', trackingId)
        .single()
      if (tlErr || !tl) {
        return NextResponse.json({ error: 'tracking link not found' }, { status: 404 })
      }
      query = query.eq('tracking_link_id', tl.id)
    }

    const { data: click, error: clickErr } = await query.single()
    if (clickErr || !click) {
      return NextResponse.json({ error: 'click not found' }, { status: 404 })
    }

    // Mark as converted
    const { error: updErr } = await supabase
      .from('link_clicks')
      .update({ converted_to_pledge: true, conversion_pledge_id: pledgeId })
      .eq('id', click.id)

    if (updErr) {
      return NextResponse.json({ error: 'failed to update conversion', details: updErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal server error', details: e?.message }, { status: 500 })
  }
}
