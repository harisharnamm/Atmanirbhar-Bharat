"use client"

import { cn } from "@/lib/utils"

export default function Progress({
  currentStep,
  labels,
}: {
  currentStep: number
  labels: string[]
}) {
  return (
    <ol className={cn("grid gap-2", `grid-cols-${labels.length}`)} aria-label="Progress">
      {labels.map((label, idx) => {
        const state = idx < currentStep ? "complete" : idx === currentStep ? "current" : "upcoming"
        return (
          <li key={label} className="flex flex-col items-center gap-1">
            <span
              className={cn(
                "h-2 w-full rounded-sm",
                state === "complete" && "bg-primary",
                state === "current" && "bg-primary/70",
                state === "upcoming" && "bg-muted",
              )}
              aria-hidden="true"
            />
            <span
              className="text-[11px] leading-none text-muted-foreground"
              aria-current={state === "current" ? "step" : undefined}
            >
              {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
