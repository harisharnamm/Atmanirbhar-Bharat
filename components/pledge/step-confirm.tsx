"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { isNewPledgeIdFormat, generatePledgeId } from "@/lib/utils"
import { generateCertificateFromTemplate } from "@/lib/pdf-template"
import { uploadCertificatePdf, uploadSelfie } from "@/lib/storage"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import ShareButtons from "@/components/pledge/share-buttons"
import { createTrackingLink } from "@/lib/tracking"
import type { PledgeFormValues } from "./step-form"

export default function StepConfirm({
  strings,
  pledgeId,
  values,
  selfieDataUrl,
}: {
  strings: ReturnType<typeof getStringsMock>
  pledgeId: string
  values: PledgeFormValues
  selfieDataUrl?: string | null
}) {
  const [downloading, setDownloading] = useState(false)
  const [pdfBlob, setPdfBlob] = useState<Blob | undefined>(undefined)
  const [trackingLink, setTrackingLink] = useState<string>("")
  const [trackingLinkCreated, setTrackingLinkCreated] = useState(false)
  const [certificateData, setCertificateData] = useState<{
    id: string
    name: string
    district: string
    constituency: string
    village: string
    lang: "en" | "hi"
    selfieDataUrl?: string | null
  } | undefined>(undefined)

  async function upsertPledge(payload: any) {
    try {
      const res = await fetch('/api/pledges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        // Keep the request alive during page/tab lifecycle changes (mobile)
        keepalive: true as any,
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('[v0] API error:', res.status, errorData)
        throw new Error(`HTTP ${res.status}: ${errorData.error || 'Unknown error'}`)
      }
      
      const result = await res.json()
      console.log('[v0] Pledge upserted successfully:', result)
      return true
    } catch (e) {
      console.error('[v0] Primary upsert failed:', e)
      
      // Try fallback with sendBeacon
      try {
        if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
          const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
          const ok = (navigator as any).sendBeacon('/api/pledges', blob)
          console.log('[v0] Beacon fallback result:', ok)
          return !!ok
        }
      } catch (beaconError) {
        console.error('[v0] Beacon fallback also failed:', beaconError)
      }
      
      console.log('[v0] All pledge DB upsert methods failed')
      return false
    }
  }

  function triggerDownload(blob: Blob, fileName: string) {
    try {
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      setTimeout(() => {
        URL.revokeObjectURL(link.href)
        document.body.removeChild(link)
      }, 0)
    } catch (_) {}
  }

  useEffect(() => {
    if ((window as any).__certificateGenerating) return
    ;(window as any).__certificateGenerating = true
    setDownloading(true)
    const safeLang = (strings as any).__lang === "hi" ? "hi" : "en"
    const formattedId = isNewPledgeIdFormat(pledgeId) ? pledgeId : generatePledgeId()
    ;(async () => {
      try {
        // 1) Always embed the local selfie data URL first to avoid any network/CORS issues
        // IMPORTANT: Do NOT trigger download yet on mobile; finish uploads and DB first
        const { blob, fileName } = await generateCertificateFromTemplate({
          id: formattedId,
          name: values.name,
          district: values.district,
          constituency: values.constituency,
          village: values.village,
          lang: safeLang,
          selfieDataUrl: selfieDataUrl ?? ((typeof window !== "undefined" && (window as any).__pledgeSelfie) || undefined),
          download: false,
        })
        
        // Store the PDF blob for sharing
        setPdfBlob(blob)
        
        // Store certificate data for image generation
        setCertificateData({
          id: formattedId,
          name: values.name,
          district: values.district,
          constituency: values.constituency,
          village: values.village,
          lang: safeLang,
          selfieDataUrl: selfieDataUrl ?? ((typeof window !== "undefined" && (window as any).__pledgeSelfie) || undefined),
        })

        // 2) Upload selfie (best-effort)
        let selfiePublicUrl: string | undefined
        if (selfieDataUrl) {
          try {
            const selfieBlob = await (await fetch(selfieDataUrl)).blob()
            selfiePublicUrl = await uploadSelfie(formattedId, selfieBlob)
          } catch (e) {
            console.log("[v0] Selfie upload failed:", e)
            // Fallback: use the local data URL if storage fails
            selfiePublicUrl = selfieDataUrl
          }
        }

        // 3) Upload PDF to storage (best-effort)
        let pdfPublicUrl: string | undefined
        {
          let lastErr: any
          for (let i = 0; i < 2; i++) {
            try {
              pdfPublicUrl = await uploadCertificatePdf(formattedId, blob)
              break
            } catch (e) {
              lastErr = e
              await new Promise((r) => setTimeout(r, 300))
            }
          }
          if (!pdfPublicUrl && lastErr) {
            console.log("[v0] PDF upload failed:", lastErr)
            // Fallback: create a local blob URL for the PDF
            pdfPublicUrl = URL.createObjectURL(blob)
          }
        }

        // 4) Upsert pledge row via server API (keepalive + beacon fallback)
        await upsertPledge({
          pledge_id: formattedId,
          name: values.name,
          mobile: (values as any).mobile ?? null,
          district: values.district,
          constituency: values.constituency,
          village: (values as any).village ?? null,
          gender: (values as any).gender ?? null,
          lang: safeLang,
          selfie_url: selfiePublicUrl ?? null,
          certificate_pdf_url: pdfPublicUrl ?? null,
        })

        // Mark conversion for attribution (best-effort)
        try {
          const { markConversion } = await import("@/lib/tracking")
          await markConversion(formattedId)
        } catch (_) {}

        // 5) Create tracking link after pledge is saved
        await createTrackingLinkAfterPledgeSaved()

        // Finally trigger download
        triggerDownload(blob, fileName)
      } catch (error: any) {
        console.log("[v0] Certificate generation error:", error?.message || error)
      } finally {
        setDownloading(false)
        ;(window as any).__certificateGenerating = false
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Create tracking link after pledge is saved
  const createTrackingLinkAfterPledgeSaved = async () => {
    if (trackingLinkCreated || !pledgeId) return
    
    try {
      const { trackingLink } = await createTrackingLink(
        pledgeId,
        pledgeId,
        {
          name: values.name,
          district: values.district,
          constituency: values.constituency,
          village: values.village,
          created_at: new Date().toISOString()
        },
        values.name
      )
      
      console.log('[step-confirm] Created tracking link:', trackingLink)
      setTrackingLink(trackingLink)
      setTrackingLinkCreated(true)
    } catch (error) {
      console.error('Failed to create tracking link:', error)
      // Fallback to regular URL
      setTrackingLink(
        typeof window !== "undefined"
          ? `${window.location.origin}${window.location.pathname}?pledge=${encodeURIComponent(pledgeId)}`
          : ""
      )
      setTrackingLinkCreated(true)
    }
  }

  // Force full URL construction for share - always use tracking link if available
  const shareUrl = trackingLink 
    ? (trackingLink.startsWith('http') 
        ? trackingLink 
        : `${window.location.origin}${trackingLink}`)
    : (typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}?pledge=${encodeURIComponent(pledgeId)}`
        : "")

  return (
    <section aria-labelledby="confirm-heading" className="text-center">
      <h2 id="confirm-heading" className="text-lg font-semibold">
        {strings.confirm.title}
      </h2>

      <div className="mx-auto mt-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Checkmark />
      </div>

      <div className="mt-4 flex flex-col items-center gap-3">
        <Button
          onClick={() => {
            if (downloading || (window as any).__certificateGenerating) return
            ;(window as any).__certificateGenerating = true
            setDownloading(true)
            const safeLang = (strings as any).__lang === "hi" ? "hi" : "en"
            const formattedId = isNewPledgeIdFormat(pledgeId) ? pledgeId : generatePledgeId()
            ;(async () => {
              try {
                // 1) Generate with local selfie first
                const { blob, fileName } = await generateCertificateFromTemplate({
                  id: formattedId,
                  name: values.name,
                  district: values.district,
                  constituency: values.constituency,
                  village: values.village,
                  lang: safeLang,
                  selfieDataUrl: selfieDataUrl ?? ((window as any).__pledgeSelfie ?? undefined),
                  download: false,
                })
                
                // Store the PDF blob for sharing
                setPdfBlob(blob)
                
                // Store certificate data for image generation
                setCertificateData({
                  id: formattedId,
                  name: values.name,
                  district: values.district,
                  constituency: values.constituency,
                  village: values.village,
                  lang: safeLang,
                  selfieDataUrl: selfieDataUrl ?? ((window as any).__pledgeSelfie ?? undefined),
                })

                // 2) Upload selfie
                let selfiePublicUrl: string | undefined
                if (selfieDataUrl) {
                  try {
                    const selfieBlob = await (await fetch(selfieDataUrl)).blob()
                    selfiePublicUrl = await uploadSelfie(formattedId, selfieBlob)
                  } catch (e) {
                    console.log("[v0] Selfie upload failed:", e)
                    // Fallback: use the local data URL if storage fails
                    selfiePublicUrl = selfieDataUrl
                  }
                }

                // 3) Upload PDF
                let pdfPublicUrl: string | undefined
                {
                  let lastErr: any
                  for (let i = 0; i < 2; i++) {
                    try {
                      pdfPublicUrl = await uploadCertificatePdf(formattedId, blob)
                      break
                    } catch (e) {
                      lastErr = e
                      await new Promise((r) => setTimeout(r, 300))
                    }
                  }
                  if (!pdfPublicUrl && lastErr) {
                    console.log("[v0] PDF upload failed:", lastErr)
                    // Fallback: create a local blob URL for the PDF
                    pdfPublicUrl = URL.createObjectURL(blob)
                  }
                }

                // 4) Upsert pledge row via server API (keepalive + beacon fallback)
                await upsertPledge({
                  pledge_id: formattedId,
                  name: values.name,
                  mobile: (values as any).mobile ?? null,
                  district: values.district,
                  constituency: values.constituency,
                  village: (values as any).village ?? null,
                  gender: (values as any).gender ?? null,
                  lang: safeLang,
                  selfie_url: selfiePublicUrl ?? null,
                  certificate_pdf_url: pdfPublicUrl ?? null,
                })

                // Mark conversion for attribution (best-effort)
                try {
                  const { markConversion } = await import("@/lib/tracking")
                  await markConversion(formattedId)
                } catch (_) {}

                // 5) Create tracking link after pledge is saved
                await createTrackingLinkAfterPledgeSaved()

                // Trigger download at the very end
                triggerDownload(blob, fileName)
              } catch (error: any) {
                console.log("[v0] Certificate generation error (manual):", error?.message || error)
              } finally {
                setDownloading(false)
                ;(window as any).__certificateGenerating = false
              }
            })()
          }}
          disabled={downloading}
        >
          {downloading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing certificate...
            </span>
          ) : (
            strings.confirm.cert
          )}
        </Button>

        {downloading && (
          <p className="text-xs text-muted-foreground">
            This may take 5–10 seconds. Please don’t close or switch apps.
          </p>
        )}

        <ShareButtons
          label={strings.confirm.share}
          url={shareUrl}
          text={`${values.name} ने "आत्मनिर्भर भारत का संकल्प" लिया है।`}
          certificateData={certificateData}
        />
      </div>
    </section>
  )
}

function Checkmark() {
  // simple SVG stroke animation
  return (
    <svg
      role="img"
      aria-label="Success"
      className="h-8 w-8 text-primary"
      viewBox="0 0 52 52"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle className="opacity-30" cx="26" cy="26" r="24" />
      <path
        d="M14 27 l8 8 l16 -16"
        className="animate-[dash_600ms_ease-out_forwards]"
        style={
          {
            strokeDasharray: 48,
            strokeDashoffset: 48,
          } as any
        }
      />
      <style>{`@keyframes dash { to { stroke-dashoffset: 0; } }`}</style>
    </svg>
  )
}

function getStringsMock() {
  return {
    __lang: "en",
    confirm: { title: "", cert: "", share: "" },
  }
}
