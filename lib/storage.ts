import { supabase } from './supabase'
import { compressImageForStorage, getFileSizeKB } from './image-compression'

export async function uploadSelfie(pledgeId: string, file: Blob): Promise<string> {
  try {
    // Convert Blob to File for compression
    const originalFile = new File([file], 'selfie.png', { type: 'image/png' })
    const originalSize = getFileSizeKB(originalFile)
    
    // Compress image for storage (more aggressive)
    const compressedFile = await compressImageForStorage(originalFile, {
      maxSizeMB: 0.25, // ~250KB
      maxWidthOrHeight: 700,
      quality: 0.6,
      fileType: 'image/webp'
    })
    
    const compressedSize = getFileSizeKB(compressedFile)
    console.log(`Selfie compression: ${originalSize}KB -> ${compressedSize}KB (${Math.round((1 - compressedSize/originalSize) * 100)}% reduction)`)
    
    // Upload compressed version
    const path = `${pledgeId}.webp` // Store as WebP
    const { error } = await supabase.storage.from('selfies').upload(path, compressedFile, {
      upsert: true,
      contentType: 'image/webp',
    })
    
    if (error) throw error
    const { data } = supabase.storage.from('selfies').getPublicUrl(path)
    return data.publicUrl
  } catch (error) {
    console.error('Selfie compression failed, uploading original:', error)
    // Fallback to original if compression fails
    const path = `${pledgeId}.png`
    const { error: uploadError } = await supabase.storage.from('selfies').upload(path, file, {
      upsert: true,
      contentType: 'image/png',
    })
    if (uploadError) throw uploadError
    const { data } = supabase.storage.from('selfies').getPublicUrl(path)
    return data.publicUrl
  }
}

export async function uploadCertificatePdf(pledgeId: string, file: Blob): Promise<string> {
  try {
    // Convert blob to ArrayBuffer for compression
    const arrayBuffer = await file.arrayBuffer()
    const originalSize = Math.round(arrayBuffer.byteLength / 1024)
    
    // Compress PDF using API endpoint
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('/api/compress-pdf', {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      throw new Error('Compression failed')
    }
    
    const compressedBuffer = await response.arrayBuffer()
    const compressedSize = Math.round(compressedBuffer.byteLength / 1024)
    
    console.log(`PDF compression: ${originalSize}KB -> ${compressedSize}KB (${Math.round((1 - compressedSize/originalSize) * 100)}% reduction)`)
    
    // Upload compressed version
    const compressedBlob = new Blob([compressedBuffer], { type: 'application/pdf' })
    const path = `${pledgeId}.pdf`
    
    const { error } = await supabase.storage.from('certificates').upload(path, compressedBlob, {
      upsert: true,
      contentType: 'application/pdf',
    })
    
    if (error) throw error
    const { data } = supabase.storage.from('certificates').getPublicUrl(path)
    return data.publicUrl
  } catch (error) {
    console.error('PDF compression failed, uploading original:', error)
    // Fallback to original if compression fails
    const path = `${pledgeId}.pdf`
    const { error: uploadError } = await supabase.storage.from('certificates').upload(path, file, {
      upsert: true,
      contentType: 'application/pdf',
    })
    if (uploadError) throw uploadError
    const { data } = supabase.storage.from('certificates').getPublicUrl(path)
    return data.publicUrl
  }
}


