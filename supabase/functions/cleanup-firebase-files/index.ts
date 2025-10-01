import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Firebase Admin SDK for storage operations
import { initializeApp, cert } from 'https://esm.sh/firebase-admin@12.0.0/app'
import { getStorage } from 'https://esm.sh/firebase-admin@12.0.0/storage'

// Environment variables from Supabase
const firebaseServiceAccount = {
  type: 'service_account',
  project_id: Deno.env.get('FIREBASE_PROJECT_ID'),
  private_key: Deno.env.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
  client_email: Deno.env.get('FIREBASE_CLIENT_EMAIL'),
}

// Initialize Firebase Admin
const firebaseApp = initializeApp({
  credential: cert(firebaseServiceAccount),
  storageBucket: Deno.env.get('FIREBASE_STORAGE_BUCKET'),
})

const storage = getStorage(firebaseApp)

// Initialize Supabase client for logging
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { pledgeId } = await req.json()

    if (!pledgeId) {
      return new Response(JSON.stringify({ error: 'pledgeId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`🗑️ Starting Firebase file cleanup for pledge: ${pledgeId}`)

    const bucket = storage.bucket()

    // Delete selfie file
    try {
      // Try webp first (compressed format)
      await bucket.file(`selfies/${pledgeId}.webp`).delete()
      console.log(`✅ Deleted selfie: selfies/${pledgeId}.webp`)
    } catch (error) {
      console.log(`⚠️ Selfie .webp not found, trying .png: ${error.message}`)
      try {
        await bucket.file(`selfies/${pledgeId}.png`).delete()
        console.log(`✅ Deleted selfie: selfies/${pledgeId}.png`)
      } catch (pngError) {
        console.log(`⚠️ Selfie .png not found either: ${pngError.message}`)
      }
    }

    // Delete certificate file
    try {
      await bucket.file(`certificates/${pledgeId}.pdf`).delete()
      console.log(`✅ Deleted certificate: certificates/${pledgeId}.pdf`)
    } catch (error) {
      console.log(`⚠️ Certificate not found: ${error.message}`)
    }

    console.log(`🎉 Firebase file cleanup completed for pledge: ${pledgeId}`)

    return new Response(JSON.stringify({
      success: true,
      message: `Files cleaned up for pledge ${pledgeId}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('❌ Error in cleanup-firebase-files:', error)
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
