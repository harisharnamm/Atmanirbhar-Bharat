"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { generateHighQualityCertificateImage } from "@/lib/certificate-image"

export default function ShareButtons({
  label,
  url,
  text,
  certificateData,
  saveToGalleryText,
  disabled = false,
}: {
  label: string
  url: string
  text: string
  certificateData?: {
    id: string
    name: string
    district: string
    constituency: string
    village: string
    lang: "en" | "hi"
    selfieDataUrl?: string | null
  }
  saveToGalleryText?: string
  disabled?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const [savingToGallery, setSavingToGallery] = useState(false)

  async function onShare() {
    // Updated share text with hashtags - optimized for platforms
    const hashtags = '#Sankalp4AtmanirbhrBharat #Vocal4Local #aatamnirbharbharat #BJPSikar #CMORajasthan #PMO'
    // Put URL inside text so it persists even when sharing with files
    const finalText = `${text}\n\nAatmanirbhar Bharat Pledge Certificate\n\n${url}\n\n${hashtags}`
    const clipboardText = finalText

    // Prefer sharing with image file when possible
    if (navigator.share) {
      try {
        if (certificateData) {
          // Generate image and share as a file for better previews
          const imageDataUrl = await generateHighQualityCertificateImage(certificateData)
          const res = await fetch(imageDataUrl)
          const blob = await res.blob()
          const file = new File([blob], `aatmanirbhar-certificate-${certificateData.id}.jpg`, { type: "image/jpeg" })

          if ((navigator as any).canShare?.({ files: [file] })) {
            await navigator.share({ text: finalText, files: [file] })
            return
          }
        }
        // Fallback: share text + url only
        await navigator.share({ text: finalText })
        return
      } catch (error) {
        // ignore and fallback to clipboard
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(clipboardText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  // Updated share text with hashtags - optimized for Facebook
  const hashtags = '#Sankalp4AtmanirbhrBharat #Vocal4Local #aatamnirbharbharat #BJPSikar #CMORajasthan #PMO'
  
  // Text as description for URL-based sharing (Facebook will show link preview)
  const finalText = `${text}\n\nAatmanirbhar Bharat Pledge Certificate\n\n${hashtags}`
  
  // For clipboard fallback, include URL in text after declaration line
  const clipboardText = `${text}\n\nAatmanirbhar Bharat Pledge Certificate\n\n${url}\n\n${hashtags}`


  async function onSaveToGallery() {
    if (!certificateData) {
      console.warn("No certificate data available for saving")
      return
    }

    setSavingToGallery(true)
    try {
      // Generate high-quality image for saving
      const imageDataUrl = await generateHighQualityCertificateImage(certificateData)
      
      // Create download link
      const link = document.createElement('a')
      link.href = imageDataUrl
      link.download = `aatmanirbhar-certificate-${certificateData.id}.png`
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log("Certificate saved to gallery/downloads")
    } catch (error) {
      console.error("Failed to save certificate to gallery:", error)
    } finally {
      setSavingToGallery(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={onShare} disabled={disabled}>
          {label}
        </Button>
        <Button
          variant="outline"
          onClick={onSaveToGallery}
          disabled={disabled || savingToGallery || !certificateData}
          aria-label="Save certificate to gallery"
        >
          {savingToGallery ? (saveToGalleryText === "गैलरी में सहेजें" ? "सहेज रहा है..." : "Saving...") : (saveToGalleryText || "Save to Gallery")}
        </Button>
      </div>
      {!navigator.share && (
        <p className="text-xs text-muted-foreground">
          {copied ? "Text copied to clipboard." : "No native share available. Text will be copied to clipboard."}
        </p>
      )}
      {savingToGallery && (
        <p className="text-xs text-muted-foreground">
          Generating certificate image for download...
        </p>
      )}
    </div>
  )
}
