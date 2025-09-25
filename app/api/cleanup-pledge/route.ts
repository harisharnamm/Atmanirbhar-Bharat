import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { pledgeId } = await req.json()
    
    if (!pledgeId) {
      return NextResponse.json({ error: 'pledgeId is required' }, { status: 400 })
    }
    
    const supabase = createServerClient()
    
    // Call the cleanup function for specific pledge
    const { error } = await supabase.rpc('cleanup_pledge_files', { 
      pledge_id_to_cleanup: pledgeId 
    })
    
    if (error) {
      console.error('Cleanup error:', error)
      return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Cleaned up files for pledge ${pledgeId}`
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
