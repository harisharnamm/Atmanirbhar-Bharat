"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { generateHighQualityCertificateImage } from "@/lib/certificate-image"

export default function ShareButtons({
  label,
  url,
  text,
  certificateData,
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
}) {
  const [copied, setCopied] = useState(false)
  const [savingToGallery, setSavingToGallery] = useState(false)

  async function onShare() {
    if (navigator.share) {
      try {
        // Prioritize text over URL for better Facebook compatibility
        // Facebook will focus on the text content rather than the link
        await navigator.share({ 
          text: finalText
          // Removed URL parameter to emphasize text over link
        })
      } catch (error) {
        console.warn("Native share failed, falling back to clipboard:", error)
        // Fallback to clipboard
        try {
          await navigator.clipboard.writeText(clipboardText)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch {
          // ignore
        }
      }
      return
    }
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
  
  // Text-first approach: include URL within text content for better Facebook sharing
  const finalText = `${text} - Aatmanirbhar Bharat Pledge Certificate\n\n${url}\n\n${hashtags}`
  
  // For clipboard fallback, same format
  const clipboardText = finalText


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
        <Button onClick={onShare}>
          {label}
        </Button>
        <Button 
          variant="outline" 
          onClick={onSaveToGallery} 
          disabled={savingToGallery || !certificateData}
          aria-label="Save certificate to gallery"
        >
          {savingToGallery ? "Saving..." : "Save to Gallery"}
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
