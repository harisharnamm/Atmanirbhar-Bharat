"use client"

import { useState, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const PLEDGE_TEXT = `मैं, _________ आज यह संकल्प लेता/लेती हूँ कि –

1. अपने जीवन, कार्य और व्यवहार में स्वदेशी को प्राथमिकता दूँगा/दूँगी।

2. भारतीय उत्पादों और सेवाओं का सम्मानपूर्वक उपयोग करूँगा/करूँगी तथा दूसरों को भी इसके लिए प्रेरित करूँगा/करूँगी।

3. आत्मनिर्भर भारत के निर्माण हेतु निरंतर परिश्रम, नवाचार और ईमानदारी से योगदान दूँगा/दूँगी।

4. स्थानीय कारीगरों, उद्यमियों और उद्योगों को सहयोग व प्रोत्साहन दूँगा/दूँगी।

5. राष्ट्रहित को सर्वोपरि रखते हुए हर परिस्थिति में स्वावलंबन का मार्ग अपनाऊँगा/अपनाऊँगी।`

export default function StepAcknowledge({
  strings,
  checked,
  onCheckedChange,
}: {
  strings: ReturnType<typeof getStringsMock>
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  const [animationStarted, setAnimationStarted] = useState(false)
  const [animationComplete, setAnimationComplete] = useState(false)
  const [visibleText, setVisibleText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)

  const startAnimation = () => {
    setAnimationStarted(true)
    setVisibleText("")
    setCurrentIndex(0)
  }

  useEffect(() => {
    if (animationStarted && currentIndex < PLEDGE_TEXT.length) {
      const timer = setTimeout(() => {
        setVisibleText(PLEDGE_TEXT.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      }, 50) // Speed of animation - 50ms per character

      return () => clearTimeout(timer)
    } else if (animationStarted && currentIndex >= PLEDGE_TEXT.length) {
      setAnimationComplete(true)
    }
  }, [animationStarted, currentIndex])

  return (
    <section aria-labelledby="ack-heading">
      <h2 id="ack-heading" className="text-lg font-semibold">
        {strings.ack.title}
      </h2>

      {/* Start Script Button */}
      {!animationStarted && (
        <div className="mt-4 text-center">
          <Button onClick={startAnimation} className="px-6">
            {strings.ack.startScript || "Start Script"}
          </Button>
        </div>
      )}

      {/* Animated Pledge Text */}
      {animationStarted && (
        <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
          <div className="text-sm leading-relaxed whitespace-pre-line font-medium">
            {visibleText}
            {!animationComplete && <span className="animate-pulse">|</span>}
          </div>
        </div>
      )}

      {/* Acknowledgment Checkbox - Only shown after animation completes */}
      {animationComplete && (
        <div className="mt-4 flex items-start gap-3">
          <Checkbox
            id="ack"
            checked={checked}
            onCheckedChange={(v) => onCheckedChange(!!v)}
            aria-describedby="ack-desc"
          />
          <Label htmlFor="ack" id="ack-desc" className="text-sm leading-relaxed">
            {strings.ack.checkbox}
          </Label>
        </div>
      )}
    </section>
  )
}

function getStringsMock() {
  return {
    ack: { title: "", checkbox: "", startScript: "" },
  }
}
