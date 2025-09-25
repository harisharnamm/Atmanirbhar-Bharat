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
        // If we have certificate data, try to share with image
        if (certificateData && typeof window !== "undefined") {
          setGeneratingImage(true)
          try {
            const imageDataUrl = await generateHighQualityCertificateImage(certificateData)
            // Convert data URL to blob for sharing
            const response = await fetch(imageDataUrl)
            const imageBlob = await response.blob()
            const imageFile = new File([imageBlob], "certificate.jpg", { type: "image/jpeg" })
            
            await navigator.share({ 
              url, 
              text, 
              title: "Aatmanirbhar Bharat Pledge Certificate",
              files: [imageFile]
            })
          } catch (imageError) {
            console.warn("Image generation failed, sharing without image:", imageError)
            await navigator.share({ url, text, title: "Aatmanirbhar Bharat Pledge" })
          } finally {
            setGeneratingImage(false)
          }
        } else {
          await navigator.share({ url, text, title: "Aatmanirbhar Bharat Pledge" })
        }
      } catch {
        // silently ignore
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  const hashtags = '#Sankalp4AtmanirbhrBharat #PMO #SikarBJP #CMORajasthan #BJPSikar #aatamnirbharbharat'
  const finalText = `${text} ${hashtags}`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(finalText)}`

  async function onTwitterShare() {
    if (certificateData && typeof window !== "undefined") {
      setGeneratingImage(true)
      try {
        const imageDataUrl = await generateHighQualityCertificateImage(certificateData)
        // Convert data URL to blob for sharing
        const response = await fetch(imageDataUrl)
        const imageBlob = await response.blob()
        const imageFile = new File([imageBlob], "certificate.jpg", { type: "image/jpeg" })
        
        // Try to share with image using native share API
        if (navigator.share) {
          try {
            await navigator.share({ 
              url, 
              text: finalText, 
              title: "Aatmanirbhar Bharat Pledge Certificate",
              files: [imageFile]
            })
            return
          } catch (shareError) {
            console.warn("Native share with image failed, falling back to URL:", shareError)
          }
        }
        
        // Fallback: open Twitter with text (can't attach image via URL)
        window.open(twitterUrl, '_blank', 'noopener,noreferrer')
      } catch (imageError) {
        console.warn("Image generation failed for Twitter, sharing without image:", imageError)
        // Fallback to text-only sharing
        window.open(twitterUrl, '_blank', 'noopener,noreferrer')
      } finally {
        setGeneratingImage(false)
      }
    } else {
      // No certificate data, share text only
      window.open(twitterUrl, '_blank', 'noopener,noreferrer')
    }
  }

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
        <Button variant="secondary" onClick={onTwitterShare} disabled={generatingImage} aria-label="Share on X (Twitter)">
          {generatingImage ? "..." : "X"}
        </Button>
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
          Converting certificate to image for sharing...
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
