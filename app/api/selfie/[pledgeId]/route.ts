import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(
  req: NextRequest,
  { params }: { params: { pledgeId: string } }
) {
  try {
    const pledgeId = params.pledgeId
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('pledges')
      .select('selfie_url')
      .eq('pledge_id', pledgeId)
      .single()

    if (error || !data?.selfie_url) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.redirect(data.selfie_url, 302)
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal error', details: e?.message }, { status: 500 })
  }
}


