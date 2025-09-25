import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Call the cleanup function
    const { data, error } = await supabase.rpc('cleanup_orphaned_files')
    
    if (error) {
      console.error('Cleanup error:', error)
      return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      cleaned_files: data,
      message: `Cleaned up ${data?.length || 0} orphaned files`
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
