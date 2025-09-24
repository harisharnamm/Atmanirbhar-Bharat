"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function ShareButtons({
  label,
  url,
  text,
}: {
  label: string
  url: string
  text: string
}) {
  const [copied, setCopied] = useState(false)

  async function onShare() {
    if (navigator.share) {
      try {
        await navigator.share({ url, text, title: "People's Pledge" })
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
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(finalText)}&url=${encodeURIComponent(url)}`
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(finalText)}`

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <a
          className="inline-flex"
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Twitter"
        >
          <Button variant="secondary">X</Button>
        </a>
        <a
          className="inline-flex"
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Facebook"
        >
          <Button variant="secondary">Facebook</Button>
        </a>
        <Button onClick={onShare}>{label}</Button>
      </div>
      {!navigator.share && (
        <p className="text-xs text-muted-foreground">
          {copied ? "Link copied." : "No native share available. Click to copy link."}
        </p>
      )}
    </div>
  )
}
