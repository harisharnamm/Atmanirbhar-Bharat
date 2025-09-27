import { storage } from './firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { compressImageForStorage, getFileSizeKB } from './image-compression'

export async function uploadSelfieToFirebase(pledgeId: string, file: Blob): Promise<string> {
  try {
    // Convert Blob to File for compression
    const originalFile = new File([file], 'selfie.png', { type: 'image/png' })
    const originalSize = getFileSizeKB(originalFile)
    
    // Compress image for storage (same logic as Supabase version)
    const compressedFile = await compressImageForStorage(originalFile, {
      maxSizeMB: 0.25, // ~250KB
      maxWidthOrHeight: 700,
      quality: 0.6,
      fileType: 'image/webp'
    })
    
    const compressedSize = getFileSizeKB(compressedFile)
    console.log(`[Firebase] Selfie compression: ${originalSize}KB -> ${compressedSize}KB (${Math.round((1 - compressedSize/originalSize) * 100)}% reduction)`)
    
    // Upload compressed version to Firebase Storage
    const storageRef = ref(storage, `selfies/${pledgeId}.webp`)
    await uploadBytes(storageRef, compressedFile)
    
    // Get public URL
    const downloadURL = await getDownloadURL(storageRef)
    
    console.log(`[Firebase] Selfie uploaded successfully: ${downloadURL}`)
    return downloadURL
    
  } catch (error) {
    console.error('[Firebase] Selfie compression failed, uploading original:', error)
    
    // Fallback to original if compression fails
    const storageRef = ref(storage, `selfies/${pledgeId}.png`)
    await uploadBytes(storageRef, file)
    
    const downloadURL = await getDownloadURL(storageRef)
    console.log(`[Firebase] Selfie uploaded (original): ${downloadURL}`)
    return downloadURL
  }
}

export async function uploadCertificatePdfToFirebase(pledgeId: string, file: Blob): Promise<string> {
  // Direct upload without compression - same logic as Supabase version
  const storageRef = ref(storage, `certificates/${pledgeId}.pdf`)
  
  await uploadBytes(storageRef, file)
  
  // Get public URL
  const downloadURL = await getDownloadURL(storageRef)
  
  console.log(`[Firebase] Certificate uploaded successfully: ${downloadURL}`)
  return downloadURL
}
