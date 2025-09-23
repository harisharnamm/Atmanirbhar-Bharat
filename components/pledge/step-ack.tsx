"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

const PLEDGE_TEXT = `मैं, ....................................................... (अपना नाम लिखें)

आज दिनांक ................. को यह संकल्प/शपथ लेता/लेती हूँ कि –

1.⁠ ⁠मैं अपने जीवन, कार्य एवं व्यवहार में आत्मनिर्भरता को प्राथमिकता दूँगा/दूँगी。


2.⁠ ⁠मैं अपने जीवन, कार्य और व्यवहार में देशी उत्पादों व सेवाओं को प्राथमिकता दूँगा/दूँगी。


3.⁠ ⁠मैं भारतीय उद्योगों, कारीगरों, किसानों और उद्यमियों का सहयोग व प्रोत्साहन करूँगा/करूँगी。


4.⁠ ⁠मैं समाज में "Vocal for Local" का संदेश प्रसारित करूँगा/करूँगी और दूसरों को भी इसके लिए प्रेरित करूँगा/करूँगी。


5.⁠ ⁠मैं राष्ट्रहित को सर्वोपरि मानते हुए हर परिस्थिति में स्वावलंबन का मार्ग अपनाऊँगा/अपनाऊँगी。


6.⁠ ⁠मैं यह संकल्प करता/करती हूँ कि अपने आचरण, व्यवहार और कार्यों के माध्यम से भारत को आत्मनिर्भर बनाने में सक्रिय योगदान दूँगा/दूँगी।`

export default function StepAcknowledge({
  strings,
  checked,
  onCheckedChange,
  name,
  gender,
}: {
  strings: ReturnType<typeof getStringsMock>
  checked: boolean
  onCheckedChange: (v: boolean) => void
  name?: string
  gender?: "male" | "female"
}) {
  const renderPledge = () => {
    const userName = (name && name.trim().length > 0)
      ? name.trim()
      : "....................................................... (अपना नाम लिखें)"
    const isFemale = gender === "female"

    // Insert name
    let text = PLEDGE_TEXT.replace(
      "मैं, ....................................................... (अपना नाम लिखें)",
      `मैं, ${userName}`,
    )

    // Insert today's date (hi-IN formatted)
    const dateStr = new Date().toLocaleDateString("hi-IN", { year: "numeric", month: "long", day: "numeric" })
    text = text.replace("आज दिनांक .................", `आज दिनांक ${dateStr}`)

    // Keep both forms visible irrespective of gender selection
    return text
  }
  const renderCheckboxLabel = () => {
    let label = strings.ack.checkbox
    const isHindi = (strings as any).__lang === "hi"
    if (isHindi) {
      // Keep both forms visible
      label = label.replace(/करता|करती/g, "करता/करती")
    }
    return label
  }
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const onSelectFile = (file?: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null
      setImagePreview(result)
    }
    reader.readAsDataURL(file)
  }
  return (
    <section aria-labelledby="ack-heading">
      <h2 id="ack-heading" className="text-lg font-semibold">
        {strings.ack.title}
      </h2>

      {/* Full pledge text */}
      <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
        <div className="text-sm leading-relaxed whitespace-pre-line font-medium">
          {renderPledge()}
        </div>
      </div>

      {/* Selfie capture/upload */}
      <div className="mt-4 grid gap-3">
        <label className="text-sm font-medium">Selfie</label>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full overflow-hidden bg-muted border">
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} alt="Selfie preview" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">No photo</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm hover:bg-accent">
              <input
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={(e) => onSelectFile(e.target.files?.[0])}
              />
              Take selfie
            </label>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm hover:bg-accent">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onSelectFile(e.target.files?.[0])}
              />
              Upload photo
            </label>
          </div>
        </div>
      </div>

      {/* Acknowledgment Checkbox */}
      <div className="mt-4 flex items-start gap-3">
        <Checkbox
          id="ack"
          checked={checked}
          disabled={!imagePreview}
          onCheckedChange={(v) => onCheckedChange(!!v)}
          aria-describedby="ack-desc"
        />
        <Label htmlFor="ack" id="ack-desc" className="text-sm leading-relaxed">
          {renderCheckboxLabel()}
        </Label>
      </div>
      {!imagePreview && (
        <p className="mt-2 text-xs text-muted-foreground">कृपया पहले अपनी सेल्फ़ी जोड़ें।</p>
      )}
    </section>
  )
}

function getStringsMock() {
  return {
    ack: { title: "", checkbox: "", startScript: "" },
  }
}