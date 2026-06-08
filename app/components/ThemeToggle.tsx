"use client"

import { useEffect, useState } from "react"
import { Moon, SunMedium } from "lucide-react"

const applyTheme = (theme: "light" | "dark") => {
  document.documentElement.classList.remove("light", "dark")
  document.documentElement.classList.add(theme)
  window.localStorage.setItem("apex-theme", theme)
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark")

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("apex-theme") as "light" | "dark" | null
    const initialTheme =
      savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")

    setTheme(initialTheme)
    applyTheme(initialTheme)
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark"
    setTheme(nextTheme)
    applyTheme(nextTheme)
  }

  const Icon = theme === "dark" ? SunMedium : Moon
  const label = theme === "dark" ? "Light Mode" : "Dark Mode"

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/15"
    >
      <Icon size={18} />
      {label}
    </button>
  )
}
