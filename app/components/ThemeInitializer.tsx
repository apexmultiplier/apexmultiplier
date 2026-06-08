"use client"

import { useEffect } from "react"

const setTheme = (theme: "light" | "dark") => {
  document.documentElement.classList.remove("light", "dark")
  document.documentElement.classList.add(theme)
  window.localStorage.setItem("apex-theme", theme)
}

export default function ThemeInitializer() {
  useEffect(() => {
    const savedTheme = window.localStorage.getItem("apex-theme") as "light" | "dark" | null
    const initialTheme =
      savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")

    setTheme(initialTheme)
  }, [])

  return null
}
