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
  const [generatingImage, setGeneratingImage] = useState(false)
  const [savingToGallery, setSavingToGallery] = useState(false)

  async function onShare() {
    if (navigator.share) {
      try {
        // If we have certificate data, try to share with both text and image
        if (certificateData && typeof window !== "undefined") {
          setGeneratingImage(true)
          try {
            const imageDataUrl = await generateHighQualityCertificateImage(certificateData)
            // Convert data URL to blob for sharing
            const response = await fetch(imageDataUrl)
            const imageBlob = await response.blob()
            const imageFile = new File([imageBlob], "aatmanirbhar-certificate.jpg", { type: "image/jpeg" })
            
            // Share both text and image together
            await navigator.share({ 
              text: finalText,
              files: [imageFile]
            })
          } catch (imageError) {
            console.warn("Image generation failed, sharing text only:", imageError)
            await navigator.share({ text: finalText })
          } finally {
            setGeneratingImage(false)
          }
        } else {
          // Share text only if no certificate data
          await navigator.share({ text: finalText })
        }
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

  // Updated share text with hashtags
  const hashtags = '#Sankalp4AtmanirbhrBharat #Vocal4Local #aatamnirbharbharat #BJPSikar #CMORajasthan #PMO'
  // Format text properly - Hindi text first, then certificate title, then URL, then hashtags
  const finalText = `${text}\n\nAatmanirbhar Bharat Pledge Certificate\n\n${url}\n\n${hashtags}`
  // For clipboard fallback, same format
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
        <Button onClick={onShare} disabled={generatingImage}>
          {generatingImage ? "Generating..." : label}
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
      {generatingImage && (
        <p className="text-xs text-muted-foreground">
          Generating certificate image for sharing...
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
