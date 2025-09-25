"use client"

import "regenerator-runtime/runtime"
import html2canvas from "html2canvas"

export interface ImageGenerationOptions {
  scale?: number // Higher scale = better quality, larger file size
  format?: "image/png" | "image/jpeg"
  quality?: number // For JPEG, 0-1
}

/**
 * Converts a PDF blob to an image (PNG/JPEG) for social media sharing
 * @param pdfBlob - The PDF blob to convert
 * @param options - Image generation options
 * @returns Promise<string> - Data URL of the generated image
 */
export async function convertPdfToImage(
  pdfBlob: Blob,
  options: ImageGenerationOptions = {}
): Promise<string> {
  // For now, we'll create a simple preview using the PDF blob URL
  // This is a temporary solution until we implement proper PDF rendering
  const pdfUrl = URL.createObjectURL(pdfBlob)
  
  // Create a temporary iframe to render the PDF
  const iframe = document.createElement('iframe')
  iframe.src = pdfUrl
  iframe.style.width = '800px'
  iframe.style.height = '600px'
  iframe.style.border = 'none'
  iframe.style.position = 'absolute'
  iframe.style.left = '-9999px'
  iframe.style.top = '-9999px'
  
  document.body.appendChild(iframe)
  
  return new Promise((resolve, reject) => {
    iframe.onload = async () => {
      try {
        // Wait a bit for PDF to render
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Capture the iframe content
        const canvas = await html2canvas(iframe.contentDocument?.body || iframe, {
          scale: options.scale || 1.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        })
        
        // Clean up
        document.body.removeChild(iframe)
        URL.revokeObjectURL(pdfUrl)
        
        // Convert to data URL
        const format = options.format || "image/png"
        const quality = options.quality || 0.9
        
        if (format === "image/jpeg") {
          resolve(canvas.toDataURL(format, quality))
        } else {
          resolve(canvas.toDataURL(format))
        }
      } catch (error) {
        document.body.removeChild(iframe)
        URL.revokeObjectURL(pdfUrl)
        reject(new Error("Failed to convert PDF to image: " + error))
      }
    }
    
    iframe.onerror = () => {
      document.body.removeChild(iframe)
      URL.revokeObjectURL(pdfUrl)
      reject(new Error("Failed to load PDF"))
    }
  })
}

/**
 * Generates a social media optimized image from PDF
 * @param pdfBlob - The PDF blob to convert
 * @returns Promise<string> - Data URL of the optimized image
 */
export async function generateSocialMediaImage(pdfBlob: Blob): Promise<string> {
  // For social media, we want good quality but reasonable file size
  return convertPdfToImage(pdfBlob, {
    scale: 1.5, // Good balance of quality and size
    format: "image/jpeg",
    quality: 0.85
  })
}

/**
 * Generates a high-quality preview image from PDF
 * @param pdfBlob - The PDF blob to convert
 * @returns Promise<string> - Data URL of the high-quality image
 */
export async function generatePreviewImage(pdfBlob: Blob): Promise<string> {
  // For previews, we want high quality
  return convertPdfToImage(pdfBlob, {
    scale: 2,
    format: "image/png",
    quality: 1
  })
}
