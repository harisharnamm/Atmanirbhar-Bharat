"use client"

import jsPDF from "jspdf"

export function generateCertificate({
  id,
  name,
  district,
  constituency,
  village,
  lang,
}: {
  id: string
  name: string
  district: string
  constituency: string
  village: string
  lang: "en" | "hi"
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" })
  const now = new Date()
  const dateStr = now.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Header bar
  doc.setFillColor(20, 108, 67) // deep green
  doc.rect(0, 0, 595.28, 64, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.text(lang === "hi" ? "जन प्रतिज्ञा प्रमाण पत्र" : "People's Pledge Certificate", 42, 40)

  // Body
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  doc.text(lang === "hi" ? "यह प्रमाणित किया जाता है कि:" : "This certifies that:", 42, 110)

  doc.setFontSize(22)
  doc.text(name, 42, 140)

  doc.setFontSize(12)
  doc.text(
    lang === "hi"
      ? `जिला: ${district}   विधानसभा: ${constituency}   गाँव/शहर: ${village}`
      : `District: ${district}   Constituency: ${constituency}   Village/City: ${village}`,
    42,
    170,
  )

  doc.setFontSize(12)
  const pledgeLine =
    lang === "hi"
      ? "ने पारदर्शिता, समावेश और जवाबदेही को बढ़ावा देने हेतु जन प्रतिज्ञा ली है।"
      : "has taken the People's Pledge to promote transparency, inclusion, and accountability."
  doc.text(pledgeLine, 42, 200)

  doc.setFontSize(10)
  doc.text((lang === "hi" ? "तिथि" : "Date") + `: ${dateStr}`, 42, 240)
  doc.text((lang === "hi" ? "प्रतिज्ञा ID" : "Pledge ID") + `: ${id}`, 42, 260)

  // Footer line
  doc.setDrawColor(200)
  doc.line(42, 780, 553, 780)
  doc.setTextColor(120, 120, 120)
  doc.setFontSize(9)
  doc.text(
    lang === "hi"
      ? "यह प्रमाण पत्र केवल सत्यापन और सांख्यिकीय उद्देश्य के लिए है।"
      : "This certificate is for verification and statistical purposes only.",
    42,
    796,
  )

  const fileName =
    (lang === "hi" ? "praman-patra" : "certificate") +
    `-${name.toLowerCase().replace(/\\s+/g, "-")}-${id.slice(0, 8)}.pdf`

  doc.save(fileName)
}
