"use client"

import { Button } from "@/components/ui/button"
import { Languages } from "lucide-react"

type Lang = "en" | "hi"

interface LangToggleProps {
  lang: Lang
  onLangChange: (lang: Lang) => void
}

export default function LangToggle({ lang, onLangChange }: LangToggleProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onLangChange(lang === "en" ? "hi" : "en")}
      className="flex items-center gap-2"
    >
      <Languages className="h-4 w-4" />
      {lang === "en" ? "हिंदी" : "English"}
    </Button>
  )
}
