import imageCompression from 'browser-image-compression'

export interface CompressionOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  quality?: number
  fileType?: string
}

/**
 * Compress an image for storage while maintaining quality for display
 */
export async function compressImageForStorage(
  file: File, 
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxSizeMB = 0.25, // 250KB target max size for storage
    maxWidthOrHeight = 700, // Reduce dimensions a bit more
    quality = 0.6, // 60% quality
    fileType = 'image/webp' // Use WebP for better compression ratio
  } = options

  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      quality,
      fileType,
      useWebWorker: true, // Use web worker for better performance
      maxIteration: 15,
      initialQuality: quality,
      alwaysKeepResolution: false,
    })

    console.log(`Image compression: ${Math.round(file.size / 1024)}KB -> ${Math.round(compressedFile.size / 1024)}KB (${Math.round((1 - compressedFile.size / file.size) * 100)}% reduction)`)
    
    return compressedFile
  } catch (error) {
    console.error('Image compression failed:', error)
    // Return original file if compression fails
    return file
  }
}

/**
 * Generate a compressed selfie data URL for certificate embedding
 */
export async function generateCompressedSelfieDataUrl(selfieDataUrl: string): Promise<string> {
  try {
    // Convert data URL to File
    const response = await fetch(selfieDataUrl)
    const blob = await response.blob()
    const file = new File([blob], 'selfie.png', { type: 'image/png' })
    
    // Compress the image
    const compressedFile = await compressImageForStorage(file, {
      maxSizeMB: 0.25, // ~250KB
      maxWidthOrHeight: 700,
      quality: 0.6,
      fileType: 'image/webp'
    })
    
    // Convert back to data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(compressedFile)
    })
  } catch (error) {
    console.error('Failed to generate compressed selfie data URL:', error)
    // Return original if compression fails
    return selfieDataUrl
  }
}

/**
 * Get file size in KB
 */
export function getFileSizeKB(file: File): number {
  return Math.round(file.size / 1024)
}
