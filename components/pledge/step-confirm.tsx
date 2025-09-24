"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { isNewPledgeIdFormat, generatePledgeId } from "@/lib/utils"
import { generateCertificateFromTemplate } from "@/lib/pdf-template"
import { uploadCertificatePdf, uploadSelfie } from "@/lib/storage"
import { supabase } from "@/lib/supabase"
import ShareButtons from "@/components/pledge/share-buttons"
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

  useEffect(() => {
    if ((window as any).__certificateGenerating) return
    ;(window as any).__certificateGenerating = true
    setDownloading(true)
    const safeLang = (strings as any).__lang === "hi" ? "hi" : "en"
    const formattedId = isNewPledgeIdFormat(pledgeId) ? pledgeId : generatePledgeId()
    ;(async () => {
      try {
        // Upload selfie first if present and not yet uploaded
        let selfiePublicUrl: string | undefined
        if (selfieDataUrl) {
          try {
            const selfieBlob = await (await fetch(selfieDataUrl)).blob()
            selfiePublicUrl = await uploadSelfie(formattedId, selfieBlob)
          } catch (e) {
            console.log("[v0] Selfie upload failed:", e)
          }
        }

        const { blob, fileName } = await generateCertificateFromTemplate({
          id: formattedId,
          name: values.name,
          district: values.district,
          constituency: values.constituency,
          village: values.village,
          lang: safeLang,
          selfieDataUrl: selfiePublicUrl ?? selfieDataUrl ?? ((typeof window !== "undefined" && (window as any).__pledgeSelfie) || undefined),
          download: true,
        })

        // Upload PDF to storage
        let pdfPublicUrl: string | undefined
        try {
          pdfPublicUrl = await uploadCertificatePdf(formattedId, blob)
        } catch (e) {
          console.log("[v0] PDF upload failed:", e)
        }

        // Upsert pledge row
        try {
          await supabase.from('pledges').upsert({
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
          }, { onConflict: 'pledge_id' })
        } catch (e) {
          console.log('[v0] DB insert failed:', e)
        }
      } catch (error: any) {
        console.log("[v0] Certificate generation error:", error?.message || error)
      } finally {
        setDownloading(false)
        ;(window as any).__certificateGenerating = false
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}?pledge=${encodeURIComponent(pledgeId)}`
      : ""

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
                // Upload selfie if available
                let selfiePublicUrl: string | undefined
                if (selfieDataUrl) {
                  try {
                    const selfieBlob = await (await fetch(selfieDataUrl)).blob()
                    selfiePublicUrl = await uploadSelfie(formattedId, selfieBlob)
                  } catch (e) {
                    console.log("[v0] Selfie upload failed:", e)
                  }
                }

                const { blob, fileName } = await generateCertificateFromTemplate({
                  id: formattedId,
                  name: values.name,
                  district: values.district,
                  constituency: values.constituency,
                  village: values.village,
                  lang: safeLang,
                  selfieDataUrl: selfiePublicUrl ?? selfieDataUrl ?? ((window as any).__pledgeSelfie ?? undefined),
                  download: true,
                })

                // Upload PDF
                let pdfPublicUrl: string | undefined
                try {
                  pdfPublicUrl = await uploadCertificatePdf(formattedId, blob)
                } catch (e) {
                  console.log("[v0] PDF upload failed:", e)
                }

                // Insert pledge row (upsert-on-conflict)
                try {
                  await supabase.from('pledges').upsert({
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
                  }, { onConflict: 'pledge_id' })
                } catch (e) {
                  console.log('[v0] DB upsert failed:', e)
                }
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
          {strings.confirm.cert}
        </Button>

        <ShareButtons
          label={strings.confirm.share}
          url={shareUrl}
          text={`${values.name} ने "आत्मनिर्भर भारत का संकल्प" लिया है। ${shareUrl}`}
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
