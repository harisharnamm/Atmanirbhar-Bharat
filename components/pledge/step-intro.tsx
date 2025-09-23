"use client"

import { Button } from "@/components/ui/button"

export default function StepIntro({
  strings,
  onStart,
}: {
  strings: ReturnType<typeof getStringsMock>
  onStart: () => void
}) {
  return (
    <section aria-labelledby="intro-heading">
      <h2 id="intro-heading" className="text-pretty text-xl font-semibold">
        {strings.intro.heading}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{strings.intro.body}</p>
      <div className="mt-4">
        <Button onClick={onStart}>{strings.intro.cta}</Button>
      </div>
    </section>
  )
}

// ... helper type to match app/page strings without import cycle
function getStringsMock() {
  return {
    intro: { heading: "", body: "", cta: "" },
  }
}
