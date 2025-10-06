import { createClient } from '@supabase/supabase-js'

export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase server env (URL or SERVICE_ROLE_KEY)')
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    }
  })
}


