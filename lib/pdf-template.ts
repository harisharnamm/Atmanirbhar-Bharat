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
  const [{ PDFDocument, rgb, degrees }, fontkit] = await Promise.all([
    import("pdf-lib"),
    import("@pdf-lib/fontkit").catch(() => ({ default: undefined })),
  ])

  // Fetch the template PDF from public with cache-busting version
  const ASSET_VERSION = process.env.NEXT_PUBLIC_ASSET_VERSION || 'v1'
  const templateUrl = `/default-format.pdf?v=${encodeURIComponent(ASSET_VERSION)}`
  let templateBytes: ArrayBuffer
  try {
    templateBytes = await fetch(templateUrl, { cache: 'no-store' }).then((r) => r.arrayBuffer())
  } catch (e) {
    // Retry once without no-store as a fallback
    templateBytes = await fetch(templateUrl).then((r) => r.arrayBuffer())
  }
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
    date: { x: 237, y: 461, size: 18 },
    pledgeId: { x: 194, y: 905, size: 16 },
    // Selfie: X:78 Y:69 (top-left origin). Slightly larger frame.
    selfie: { x: 257, y: 241, w: 120, h: 120 },
  }

  const now = new Date()
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const yyyy = String(now.getFullYear())
  const dateStr = `${dd}/${mm}/${yyyy}`

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
      // Fix orientation by reading EXIF and redrawing via canvas
      const correctedDataUrl = await fixImageOrientation(selfieDataUrl)
      const imgBytes = await fetch(correctedDataUrl).then((r) => r.arrayBuffer())
      // Prefer PNG after canvas export
      const img = await pdfDoc.embedPng(imgBytes).catch(async () => pdfDoc.embedJpg(imgBytes))
      page.drawImage(img, {
        x: coordsTL.selfie.x,
        y: pageH - coordsTL.selfie.y - coordsTL.selfie.h,
        width: coordsTL.selfie.w,
        height: coordsTL.selfie.h,
      })
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


// ---- Helpers for EXIF orientation handling ----
async function fixImageOrientation(dataUrl: string): Promise<string> {
  // Only JPEGs typically carry EXIF orientation; for others, return as-is
  const isJpeg = /^data:image\/jpeg/i.test(dataUrl) || /\.jpe?g($|\?)/i.test(dataUrl)
  if (!isJpeg) return dataUrl

  // Try native EXIF-aware decode first
  try {
    const resp = await fetch(dataUrl)
    const blob = await resp.blob()
    // Some browsers support EXIF-aware decode
    const bitmap = await (self as any).createImageBitmap(blob, { imageOrientation: 'from-image' })
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0)
    return canvas.toDataURL('image/png')
  } catch {
    // Fallback to manual EXIF parse/transform
    try {
      const buf = await fetch(dataUrl).then((r) => r.arrayBuffer())
      const orientation = getExifOrientation(new DataView(buf))
      if (!orientation || orientation === 1) return dataUrl

      const img = await loadImage(dataUrl)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      const width = img.naturalWidth
      const height = img.naturalHeight

      // Set canvas size and transform based on EXIF orientation
      switch (orientation) {
        case 2: // horizontal flip
          canvas.width = width
          canvas.height = height
          ctx.translate(width, 0)
          ctx.scale(-1, 1)
          break
        case 3: // 180°
          canvas.width = width
          canvas.height = height
          ctx.translate(width, height)
          ctx.rotate(Math.PI)
          break
        case 4: // vertical flip
          canvas.width = width
          canvas.height = height
          ctx.translate(0, height)
          ctx.scale(1, -1)
          break
        case 5: // transpose
          canvas.width = height
          canvas.height = width
          ctx.rotate(0.5 * Math.PI)
          ctx.scale(1, -1)
          break
        case 6: // rotate 90° CW
          canvas.width = height
          canvas.height = width
          ctx.rotate(0.5 * Math.PI)
          ctx.translate(0, -height)
          break
        case 7: // transverse
          canvas.width = height
          canvas.height = width
          ctx.rotate(0.5 * Math.PI)
          ctx.translate(width, -height)
          ctx.scale(-1, 1)
          break
        case 8: // rotate 270°
          canvas.width = height
          canvas.height = width
          ctx.rotate(-0.5 * Math.PI)
          ctx.translate(-width, 0)
          break
        default:
          canvas.width = width
          canvas.height = height
      }

      ctx.drawImage(img, 0, 0)
      return canvas.toDataURL('image/png')
    } catch {
      return dataUrl
    }
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Minimal EXIF parser to obtain Orientation (0x0112)
function getExifOrientation(view: DataView): number | null {
  // Validate JPEG
  if (view.getUint16(0) !== 0xffd8) return null
  let offset = 2
  const length = view.byteLength
  while (offset < length) {
    const marker = view.getUint16(offset)
    offset += 2
    // APP1 (EXIF)
    if (marker === 0xffe1) {
      const app1Length = view.getUint16(offset)
      offset += 2
      // Check for Exif header (ASCII: 'Exif\0\0')
      if (
        view.getUint32(offset) === 0x45786966 && // 'Exif'
        view.getUint16(offset + 4) === 0x0000
      ) {
        const tiffOffset = offset + 6
        const endianness = view.getUint16(tiffOffset)
        const little = endianness === 0x4949
        const get16 = (p: number) => (little ? view.getUint16(p, true) : view.getUint16(p, false))
        const get32 = (p: number) => (little ? view.getUint32(p, true) : view.getUint32(p, false))
        const firstIFD = tiffOffset + get32(tiffOffset + 4)
        const entries = get16(firstIFD)
        for (let i = 0; i < entries; i++) {
          const entryOffset = firstIFD + 2 + i * 12
          const tag = get16(entryOffset)
          if (tag === 0x0112) {
            const value = get16(entryOffset + 8)
            return value
          }
        }
      }
      offset += app1Length - 2
    } else if ((marker & 0xff00) !== 0xff00) {
      break
    } else {
      // Skip other segments
      const size = view.getUint16(offset)
      offset += size
    }
  }
  return null
}


