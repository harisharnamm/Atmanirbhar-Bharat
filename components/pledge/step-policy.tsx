"use client"

export default function StepPolicy({
  strings,
}: {
  strings: ReturnType<typeof getStringsMock>
}) {
  return (
    <section aria-labelledby="policy-heading">
      <h2 id="policy-heading" className="text-lg font-semibold">
        {strings.policy.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{strings.policy.text}</p>
    </section>
  )
}

function getStringsMock() {
  return {
    policy: { title: "", text: "" },
  }
}
