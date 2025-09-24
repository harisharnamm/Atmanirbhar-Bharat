"use client"

// Template-based certificate generator using pdf-lib
// Dynamically fills public/default-format.pdf with user data.

import type { PledgeFormValues } from "@/components/pledge/step-form"

// We'll dynamic import to avoid bundling pdf-lib in non-certificate paths
export async function generateCertificateFromTemplate({
  id,
  name,
  district,
  constituency,
  village,
  lang,
  selfieDataUrl,
}: {
  id: string
  name: string
  district: string
  constituency: string
  village: string
  lang: "en" | "hi"
  selfieDataUrl?: string | null
}) {
  const [{ PDFDocument, rgb }, fontkit] = await Promise.all([
    import("pdf-lib"),
    import("@pdf-lib/fontkit").catch(() => ({ default: undefined })),
  ])

  // Fetch the template PDF from public
  const templateUrl = "/default-format.pdf"
  const templateBytes = await fetch(templateUrl).then((r) => r.arrayBuffer())
  const pdfDoc = await PDFDocument.create()
  const template = await PDFDocument.load(templateBytes)
  const [templatePage] = await pdfDoc.copyPages(template, [0])
  pdfDoc.addPage(templatePage)
  const page = pdfDoc.getPage(0)
  const { width: pageW, height: pageH } = page.getSize()

  // Optional: register fontkit to embed unicode font for Hindi
  if ((fontkit as any)?.default && (pdfDoc as any).registerFontkit) {
    ;(pdfDoc as any).registerFontkit((fontkit as any).default)
  }

  // Try to load Devanagari fonts from public if available (only for Hindi)
  let font = null as any
  let fontBold = null as any
  if (lang === "hi") {
    try {
      const [regularResp, boldResp] = await Promise.all([
        fetch("/fonts/NotoSansDevanagari-Regular.ttf"),
        fetch("/fonts/NotoSansDevanagari-Bold.ttf").catch(() => ({ ok: false } as Response)),
      ])
      if (regularResp.ok) {
        const fontBytes = await regularResp.arrayBuffer()
        font = await pdfDoc.embedFont(fontBytes, { subset: true })
      }
      if (boldResp && boldResp.ok) {
        const boldBytes = await boldResp.arrayBuffer()
        fontBold = await pdfDoc.embedFont(boldBytes, { subset: true })
      }
    } catch (_) {
      // ignore; we'll fall back to the template's default font
    }
  }

  // Helpers: incoming coords are specified with origin at top-left (0,0),
  // y increasing downward. pdf-lib uses bottom-left origin. Convert y.
  const drawTextTopLeft = (text: string, xTL: number, yTL: number, size = 12, customFont?: any) => {
    page.drawText(text, {
      x: xTL,
      y: pageH - yTL,
      size,
      font: customFont ?? font ?? undefined,
      color: rgb(0, 0, 0),
    })
  }

  const centerTextTopLeft = (text: string, yTL: number, xStart: number, xEnd: number, size = 12, customFont?: any) => {
    let textWidth = 0
    try {
      const metricsFont = customFont ?? font
      if (metricsFont) {
        textWidth = metricsFont.widthOfTextAtSize(text, size)
      } else {
        // heuristic fallback when no font metrics available
        textWidth = text.length * size * 0.55
      }
    } catch {
      textWidth = text.length * size * 0.55
    }
    const boxCenter = (xStart + xEnd) / 2
    const xTL = boxCenter - textWidth / 2
    drawTextTopLeft(text, xTL, yTL, size, customFont)
  }

  // Bold centered draw (uses bold font if available, else simulates bold by multi-pass)
  const centerBoldTextTopLeft = (text: string, yTL: number, xStart: number, xEnd: number, size = 12) => {
    if (fontBold) {
      centerTextTopLeft(text, yTL, xStart, xEnd, size, fontBold)
      return
    }
    // Synthetic bold: draw multiple slight offsets
    let textWidth = 0
    try {
      if (font) {
        textWidth = font.widthOfTextAtSize(text, size)
      } else {
        textWidth = text.length * size * 0.55
      }
    } catch {
      textWidth = text.length * size * 0.55
    }
    const boxCenter = (xStart + xEnd) / 2
    const xTL = boxCenter - textWidth / 2
    const offsets = [
      [0, 0],
      [0.2, 0],
      [0, 0.2],
      [0.2, 0.2],
    ]
    for (const [dx, dy] of offsets) {
      drawTextTopLeft(text, xTL + dx, yTL + dy, size)
    }
  }

  // Coordinates config (in PDF points). Adjust as per your template.
  // A4 ~ 595 x 842 pt. Update these after a test render.
  const coordsTL = {
    // Positions provided with top-left origin per user's template grid
    name: { x: 238, y: 428, size: 24 },
    // meta removed per request
    // DATE must start right after text "ने आज दिनांक" at this exact point
    date: { x: 232, y: 461, size: 14 },
    pledgeId: { x: 194, y: 905, size: 16 },
    // Selfie: X:78 Y:69 (top-left origin). Slightly larger frame.
    selfie: { x: 257, y: 241, w: 120, h: 120 },
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Draw content
  // Center the name between X:190 and X:440 at the provided Y (bold)
  centerBoldTextTopLeft(name, coordsTL.name.y, 190, 440, coordsTL.name.size)
  const metaLine =
    lang === "hi"
      ? `जिला: ${district}   विधानसभा: ${constituency}   गाँव/शहर: ${village}`
      : `District: ${district}   Constituency: ${constituency}   Village/City: ${village}`
  // Meta line removed per request (District/Constituency/Village)

  // Only draw the date string; background already has "ने आज दिनांक"
  drawTextTopLeft(dateStr, coordsTL.date.x, coordsTL.date.y, coordsTL.date.size)

  // Draw only the ID value (no label)
  drawTextTopLeft(id, coordsTL.pledgeId.x, coordsTL.pledgeId.y, coordsTL.pledgeId.size)

  // Add selfie if provided
  if (selfieDataUrl) {
    try {
      const imgBytes = await fetch(selfieDataUrl).then((r) => r.arrayBuffer())
      const img = await pdfDoc.embedPng(imgBytes).catch(async () => pdfDoc.embedJpg(imgBytes))
      page.drawImage(img, { x: coordsTL.selfie.x, y: pageH - coordsTL.selfie.y - coordsTL.selfie.h, width: coordsTL.selfie.w, height: coordsTL.selfie.h })
    } catch (_) {
      // ignore selfie errors
    }
  }

  const pdfBytes = await pdfDoc.save()
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" })
  const fileName = (lang === "hi" ? "praman-patra" : "certificate") + `-${name.toLowerCase().replace(/\s+/g, "-")}-${id.slice(0, 8)}.pdf`

  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  link.click()
}


