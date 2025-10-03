import { supabase } from './supabase'
import { compressImageForStorage, getFileSizeKB } from './image-compression'
import { createFirebaseServerClient } from './firebase-server'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

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

    // Upload to Firebase Storage only
    const { storage } = createFirebaseServerClient()
    const firebaseRef = ref(storage, `selfies/${pledgeId}.webp`)
    await uploadBytes(firebaseRef, compressedFile, { contentType: 'image/webp' })
    const firebaseUrl = await getDownloadURL(firebaseRef)
    console.log(`[uploadSelfie] Successfully uploaded to Firebase: ${pledgeId}`)

    // Update both Supabase and Firebase databases with Firebase URL
    await supabase
      .from('pledges')
      .update({
        selfie_status: 'available',
        selfie_url: firebaseUrl
      })
      .eq('pledge_id', pledgeId)

    // Update Firebase pledge document
    const { db } = createFirebaseServerClient()
    const { doc, setDoc } = await import('firebase/firestore')
    const pledgeRef = doc(db, 'pledges', pledgeId)
    await setDoc(pledgeRef, {
      selfie_status: 'available',
      selfie_url: firebaseUrl
    }, { merge: true })

    return firebaseUrl
  } catch (error) {
    console.error('Selfie compression failed, uploading original:', error)
    // Fallback to original if compression fails
    const { storage } = createFirebaseServerClient()
    const firebaseRef = ref(storage, `selfies/${pledgeId}.png`)
    await uploadBytes(firebaseRef, file, { contentType: 'image/png' })
    const firebaseUrl = await getDownloadURL(firebaseRef)
    console.log(`[uploadSelfie] Successfully uploaded original to Firebase: ${pledgeId}`)

    // Update both databases with Firebase URL
    await supabase
      .from('pledges')
      .update({
        selfie_status: 'available',
        selfie_url: firebaseUrl
      })
      .eq('pledge_id', pledgeId)

    // Update Firebase pledge document
    const { db } = createFirebaseServerClient()
    const { doc, setDoc } = await import('firebase/firestore')
    const pledgeRef = doc(db, 'pledges', pledgeId)
    await setDoc(pledgeRef, {
      selfie_status: 'available',
      selfie_url: firebaseUrl
    }, { merge: true })

    return firebaseUrl
  }
}

export async function uploadCertificateImage(pledgeId: string, file: Blob): Promise<string> {
  try {
    // Convert Blob to File for compression
    const originalFile = new File([file], 'certificate.png', { type: 'image/png' })
    const originalSize = getFileSizeKB(originalFile)

    // Compress image for storage (gentle compression for certificates)
    const compressedFile = await compressImageForStorage(originalFile, {
      maxSizeMB: 1.0, // ~1MB max for better quality
      maxWidthOrHeight: 1500, // Slightly larger max dimension
      quality: 0.85, // Higher quality compression
      fileType: 'image/webp'
    })

    const compressedSize = getFileSizeKB(compressedFile)
    console.log(`Certificate image compression: ${originalSize}KB -> ${compressedSize}KB (${Math.round((1 - compressedSize/originalSize) * 100)}% reduction)`)

    // Upload to Firebase Storage only
    const { storage } = createFirebaseServerClient()
    const firebaseRef = ref(storage, `certificates/${pledgeId}.webp`)
    await uploadBytes(firebaseRef, compressedFile, { contentType: 'image/webp' })
    const firebaseUrl = await getDownloadURL(firebaseRef)
    console.log(`[uploadCertificateImage] Successfully uploaded to Firebase: ${pledgeId}`)

    // Update both Supabase and Firebase databases with Firebase URL
    await supabase
      .from('pledges')
      .update({
        certificate_status: 'available',
        certificate_image_url: firebaseUrl
      })
      .eq('pledge_id', pledgeId)

    // Update Firebase pledge document
    const { db } = createFirebaseServerClient()
    const { doc, setDoc } = await import('firebase/firestore')
    const pledgeRef = doc(db, 'pledges', pledgeId)
    await setDoc(pledgeRef, {
      certificate_status: 'available',
      certificate_image_url: firebaseUrl
    }, { merge: true })

    return firebaseUrl
  } catch (error) {
    console.error('Certificate image upload failed:', error)
    throw error
  }
}

export async function uploadCertificatePdf(pledgeId: string, file: Blob): Promise<string> {
  // Direct upload without compression - template is already optimized

  // Upload to Firebase Storage only
  const { storage } = createFirebaseServerClient()
  const firebaseRef = ref(storage, `certificates/${pledgeId}.pdf`)
  await uploadBytes(firebaseRef, file, { contentType: 'application/pdf' })
  const firebaseUrl = await getDownloadURL(firebaseRef)
  console.log(`[uploadCertificatePdf] Successfully uploaded to Firebase: ${pledgeId}`)

  // Update both Supabase and Firebase databases with Firebase URL
  await supabase
    .from('pledges')
    .update({
      certificate_status: 'available',
      certificate_pdf_url: firebaseUrl
    })
    .eq('pledge_id', pledgeId)

  // Update Firebase pledge document
  const { db } = createFirebaseServerClient()
  const { doc, setDoc } = await import('firebase/firestore')
  const pledgeRef = doc(db, 'pledges', pledgeId)
  await setDoc(pledgeRef, {
    certificate_status: 'available',
    certificate_pdf_url: firebaseUrl
  }, { merge: true })

  return firebaseUrl
}


