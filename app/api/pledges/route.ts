import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('[api/pledges] Missing env vars')
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }
    const supabase = createServerClient()
    const payload = Array.isArray(body) ? body : [body]
    const { error } = await supabase.from('pledges').upsert(payload, { onConflict: 'pledge_id' })
    if (error) {
      console.error('[api/pledges] Upsert error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[api/pledges] Exception:', e)
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}


