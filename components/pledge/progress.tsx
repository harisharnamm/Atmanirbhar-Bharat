"use client"

import { cn } from "@/lib/utils"

export default function Progress({
  currentStep,
  labels,
}: {
  currentStep: number
  labels: string[]
}) {
  const progressPercentage = ((currentStep + 1) / labels.length) * 100

  return (
    <div className="w-full space-y-3" aria-label="Progress">
      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progressPercentage}%` }}
          aria-valuenow={progressPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Step labels */}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${labels.length}, 1fr)` }}>
        {labels.map((label, idx) => {
          const isActive = idx <= currentStep
          return (
            <div key={label} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  isActive ? "bg-primary" : "bg-muted-foreground/30"
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  "text-[10px] leading-none text-center transition-colors",
                  isActive ? "text-primary font-medium" : "text-muted-foreground"
                )}
                aria-current={idx === currentStep ? "step" : undefined}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
