import { supabase } from './supabase'

export async function uploadSelfie(pledgeId: string, file: Blob): Promise<string> {
  const path = `${pledgeId}.png`
  const { error } = await supabase.storage.from('selfies').upload(path, file, {
    upsert: true,
    contentType: 'image/png',
  })
  if (error) throw error
  const { data } = supabase.storage.from('selfies').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadCertificatePdf(pledgeId: string, file: Blob): Promise<string> {
  const path = `${pledgeId}.pdf`
  const { error } = await supabase.storage.from('certificates').upload(path, file, {
    upsert: true,
    contentType: 'application/pdf',
  })
  if (error) throw error
  const { data } = supabase.storage.from('certificates').getPublicUrl(path)
  return data.publicUrl
}


