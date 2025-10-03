"use client"

import "regenerator-runtime/runtime"
import { getDistrictInHindi, getConstituencyInHindi } from "./district-mapping"

export interface CertificateImageOptions {
  scale?: number
  format?: "image/png" | "image/jpeg"
  quality?: number
}

/**
 * Generates a certificate image using a JPG template
 * This is much more efficient than PDF conversion
 */
export async function generateCertificateImage(
  templateData: {
    id: string
    name: string
    profession?: string
    district: string
    constituency: string
    village: string
    lang: "en" | "hi"
    selfieDataUrl?: string | null
  },
  options: CertificateImageOptions = {}
): Promise<string> {
  const {
    scale = 1.5,
    format = "image/jpeg",
    quality = 0.9
  } = options

  try {
    // Check if we're in browser environment
    if (typeof window === "undefined") {
      throw new Error("Certificate image generation only works in browser")
    }

    // Load the JPG template
    const templateImage = new Image()
    templateImage.crossOrigin = "anonymous"
    
    await new Promise((resolve, reject) => {
      templateImage.onload = resolve
      templateImage.onerror = reject
      templateImage.src = "/default-format(jpeg).jpg"
    })

    // Create canvas
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    
    if (!ctx) {
      throw new Error("Could not get canvas context")
    }

    // Set canvas size (scaled)
    const scaledWidth = templateImage.width * scale
    const scaledHeight = templateImage.height * scale
    canvas.width = scaledWidth
    canvas.height = scaledHeight

    // Draw the template image
    ctx.drawImage(templateImage, 0, 0, scaledWidth, scaledHeight)

    // MANUAL COORDINATES FOR JPG TEMPLATE
    // Adjust these coordinates to match your JPG template exactly
    // The JPG template dimensions are: width x height pixels
    const coords = {
      // Name position (centered between x:190-440 in PDF)
      name: { x: 1450, y: 2000, size: 72 },
      // Date position (after "ने आज दिनांक" text)
      date: { x: 694, y: 2133, size: 49 },
      // Pledge ID position (bottom of certificate)
      pledgeId: { x: 520, y: 2400, size: 48 },
      // Selfie position and size
      selfie: { x: 1153, y: 1280, w: 600, h: 600 }
    }
    
    console.log("[certificate-image] Using manual coordinates:", coords)
    console.log("[certificate-image] Template dimensions:", {
      originalWidth: templateImage.width,
      originalHeight: templateImage.height,
      scaledWidth,
      scaledHeight
    })

    // Set font properties
    ctx.fillStyle = "#000000"
    ctx.textAlign = "left"
    ctx.textBaseline = "top"

    // Preload local fonts for Devanagari support
    try {
      // Load local Noto Sans Devanagari fonts
      const fontFace = new FontFace('Noto Sans Devanagari', 'url(/fonts/NotoSansDevanagari-Regular.ttf)', {
        style: 'normal',
        weight: '400'
      })
      const fontFaceBold = new FontFace('Noto Sans Devanagari', 'url(/fonts/NotoSansDevanagari-Bold.ttf)', {
        style: 'normal',
        weight: '700'
      })

      await Promise.all([
        fontFace.load(),
        fontFaceBold.load()
      ])

      document.fonts.add(fontFace)
      document.fonts.add(fontFaceBold)
      console.log("[certificate-image] Local Noto Sans Devanagari fonts loaded successfully")
    } catch (fontError) {
      console.warn("[certificate-image] Failed to load local fonts, using fallback:", fontError)
    }

    // Draw name (centered) - with profession and constituency in Hindi (no pledge ID)
    const hindiConstituency = getConstituencyInHindi(templateData.constituency)
    const profession = templateData.profession || ''
    const nameText = profession
      ? `${templateData.name} - विधानसभा क्षेत्र ${hindiConstituency}`
      : `${templateData.name} - विधानसभा क्षेत्र ${hindiConstituency}`
    ctx.font = `bold ${coords.name.size}px "Noto Sans Devanagari", Arial, sans-serif`
    
    // Center the name at the specified position
    const nameWidth = ctx.measureText(nameText).width
    const centeredNameX = coords.name.x - (nameWidth / 2)
    
    console.log("[certificate-image] Name centering:", {
      nameText,
      nameWidth,
      centerX: coords.name.x,
      centeredNameX,
      finalY: coords.name.y
    })
    
    ctx.fillText(nameText, centeredNameX, coords.name.y)

    // Draw date in DD/MM/YYYY format (bold)
    const today = new Date()
    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const yyyy = today.getFullYear()
    const dateStr = `${dd}/${mm}/${yyyy}`
    ctx.font = `bold ${coords.date.size}px Arial, sans-serif`
    ctx.fillText(dateStr, coords.date.x, coords.date.y)

    // Draw pledge ID - TEMPORARILY DISABLED
    // ctx.font = `${coords.pledgeId.size}px Arial, sans-serif`
    // ctx.fillText(templateData.id, coords.pledgeId.x, coords.pledgeId.y)

    // Draw selfie if provided
    if (templateData.selfieDataUrl) {
      try {
        const selfieImage = new Image()
        selfieImage.crossOrigin = "anonymous"
        
        await new Promise((resolve, reject) => {
          selfieImage.onload = resolve
          selfieImage.onerror = reject
          selfieImage.src = templateData.selfieDataUrl!
        })

        // Draw selfie in the designated area
        ctx.drawImage(
          selfieImage,
          coords.selfie.x,
          coords.selfie.y,
          coords.selfie.w,
          coords.selfie.h
        )
      } catch (selfieError) {
        console.warn("Failed to add selfie to certificate:", selfieError)
      }
    }

    // Convert to data URL
    if (format === "image/jpeg") {
      return canvas.toDataURL(format, quality)
    } else {
      return canvas.toDataURL(format)
    }
  } catch (error) {
    console.error("[certificate-image] Generation failed:", error)
    throw new Error("Failed to generate certificate image")
  }
}

/**
 * Generates a social media optimized certificate image
 */
export async function generateSocialMediaCertificateImage(templateData: {
  id: string
  name: string
  profession?: string
  district: string
  constituency: string
  village: string
  lang: "en" | "hi"
  selfieDataUrl?: string | null
}): Promise<string> {
  return generateCertificateImage(templateData, {
    scale: 1.5, // Good balance of quality and size
    format: "image/jpeg",
    quality: 0.85
  })
}

/**
 * Generates a high-quality certificate image
 */
export async function generateHighQualityCertificateImage(templateData: {
  id: string
  name: string
  profession?: string
  district: string
  constituency: string
  village: string
  lang: "en" | "hi"
  selfieDataUrl?: string | null
}): Promise<string> {
  return generateCertificateImage(templateData, {
    scale: 1.5, // Balanced scale for quality and file size
    format: "image/jpeg",
    quality: 0.9 // 90% quality for excellent visual results
  })
}
