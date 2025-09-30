"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn, generatePledgeId } from "@/lib/utils"
import StepForm, { type PledgeFormValues } from "@/components/pledge/step-form"
import StepAcknowledge from "@/components/pledge/step-ack"
import StepConfirm from "@/components/pledge/step-confirm"
import Progress from "@/components/pledge/progress"
import LangToggle from "@/components/pledge/lang-toggle"

type Lang = "en" | "hi"

export default function HomePage() {
  const [lang, setLang] = useState<Lang>("en")
  const [step, setStep] = useState(0)
  const [pledgeId, setPledgeId] = useState<string>("")
  const [formValues, setFormValues] = useState<PledgeFormValues | null>(null)
  const [ackChecked, setAckChecked] = useState(false)
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null)

  useEffect(() => {
    // generate stable pledge id per session
    setPledgeId(generatePledgeId())
  }, [])

  const strings = useMemo(() => getStrings(lang), [lang])

  const nextEnabled = useMemo(() => {
    if (step === 0) return !!formValues // Details
    if (step === 1) return ackChecked   // Pledge
    if (step === 2) return false        // Confirm (no next)
    return false
  }, [step, formValues, ackChecked])

  const goNext = () => {
    if (!nextEnabled) return
    setStep((s) => Math.min(s + 1, 2))
  }
  const goBack = () => setStep((s) => Math.max(s - 1, 0))

  return (
    <main className="min-h-dvh p-4 pt-8">
      <div className="w-full max-w-xl mx-auto">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/atmanirbharBharat.png"
              alt="Aatmanirbhar Bharat"
              className="h-20 w-auto"
            />
            <img
              src="/ghar-ghar-swadeshi-logo.png"
              alt="Ghar Ghar Swadeshi"
              className="h-16 w-auto"
            />
          </div>
          <LangToggle lang={lang} onLangChange={setLang} />
        </header>

        <div className="mb-6 text-center">
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            {strings.description}
          </p>
        </div>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">{strings.subtitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress
              currentStep={step}
              labels={[strings.steps.details, strings.steps.ack, strings.steps.confirm]}
            />

            <div className="mt-4">
              {step === 0 && (
                <StepForm
                  lang={lang}
                  strings={strings}
                  initialValues={formValues || undefined}
                  onValid={(vals) => setFormValues(vals)}
                />
              )}
              {step === 1 && (
                <StepAcknowledge
                  strings={strings}
                  checked={ackChecked}
                  name={formValues?.name}
                  gender={formValues?.gender}
                  onSelfieChange={(d) => {
                    setSelfieDataUrl(d)
                    ;(window as any).__pledgeSelfie = d
                  }}
                  onCheckedChange={(v) => {
                    setAckChecked(v)
                    if (v) setStep(2)
                  }}
                />
              )}
              {step === 2 && formValues && (
                <StepConfirm
                  strings={strings}
                  pledgeId={pledgeId}
                  values={formValues}
                  selfieDataUrl={selfieDataUrl}
                />
              )}
            </div>

            <nav className={cn("mt-6 flex items-center justify-between")} aria-label={strings.nav}>
              <Button variant="secondary" onClick={goBack} disabled={step === 0}>
                {strings.back}
              </Button>
              {step < 2 && (
                <Button onClick={goNext} disabled={!nextEnabled}>
                  {strings.form.continue}
                </Button>
              )}
            </nav>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}


function getStrings(lang: "en" | "hi") {
  if (lang === "hi") {
    return {
      __lang: "hi",
      title: "जन प्रतिज्ञा",
      subtitle: "अपनी प्रतिज्ञा पूरी करने के लिए चरण पूरे करें",
      description: "आत्मनिर्भर भारत के लिए एक राष्ट्रव्यापी पहल - आर्थिक स्वतंत्रता और स्थानीय उत्पादन का समर्थन करें",
      steps: { details: "विवरण", ack: "प्रतिज्ञा", confirm: "पुष्टि" },
      start: "शुरू करें",
      next: "आगे",
      back: "वापस",
      nav: "नेविगेशन",
      intro: {
        heading: "आत्मनिर्भर भारत के लिए प्रतिज्ञा करें",
        body: "भारतीय अर्थव्यवस्था को मजबूत बनाने और स्थानीय उद्योगों का समर्थन करने के लिए अपनी प्रतिज्ञा दें। यह पहल आपको अपनी जानकारी साझा करने, नीति सार पढ़ने, प्रतिज्ञा करने और प्रमाण पत्र प्राप्त करने में मदद करेगी।",
        cta: "मैं तैयार हूँ",
      },
      form: {
        legend: "आपका विवरण",
        name: "पूरा नाम",
        mobile: "मोबाइल (भारत)",
        district: "ज़िला",
        constituency: "विधानसभा सीट",
        village: "गाँव/शहर",
        continue: "जारी रखें",
        errors: {
          required: "यह फ़ील्ड आवश्यक है",
          mobile: "मान्य 10 अंकों का भारतीय मोबाइल नंबर दर्ज करें",
        },
      },
      ack: {
        title: "आत्मनिर्भर भारत का संकल्प",
        startScript: "प्रतिज्ञा प्रारंभ करें",
        checkbox: "मैं आत्मनिर्भर भारत के लिए प्रतिज्ञा करता/करती हूँ।",
      },
      confirm: {
        title: "धन्यवाद! आपकी प्रतिज्ञा दर्ज हो गई है।",
        cert: "प्रमाण पत्र डाउनलोड करें",
        share: "शेयर करें",
      },
    }
  }
  return {
    __lang: "en",
    title: "People's Pledge",
    subtitle: "Complete the steps to make your pledge",
    description: "A nationwide initiative for Aatmanirbhar Bharat - supporting economic freedom and local manufacturing",
    steps: { details: "Details", ack: "Pledge", confirm: "Confirm" },
    start: "Start",
    next: "Next",
    back: "Back",
    nav: "Navigation",
    intro: {
      heading: "Pledge for Aatmanirbhar Bharat",
      body: "Make your commitment to strengthen the Indian economy and support local industries. This initiative helps you share your details, review policy summary, make your pledge, and receive a certificate.",
      cta: "I’m ready",
    },
    form: {
      legend: "Your details",
      name: "Full name",
      mobile: "Mobile (India)",
      district: "District",
      constituency: "Constituency",
      village: "Village/City",
      continue: "Continue",
      errors: {
        required: "This field is required",
        mobile: "Enter a valid 10-digit Indian mobile number",
      },
    },
    ack: {
      title: "आत्मनिर्भर भारत का संकल्प",
      startScript: "Start Pledge",
      checkbox: "I pledge to support Aatmanirbhar Bharat.",
    },
    confirm: {
      title: "Thank you! Your pledge is recorded.",
      cert: "Download certificate",
      share: "Share",
    },
  }
}
