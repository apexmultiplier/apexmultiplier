"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import MarketPriceCard, { PriceData } from "./MarketPriceCard"

interface MarketPricesResponse {
  gold: { price: number }
  silver: { price: number }
  error?: string
}

export default function LivePricesTicker() {
  const [goldPrice, setGoldPrice] = useState<PriceData | null>(null)
  const [silverPrice, setSilverPrice] = useState<PriceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>("")

  // Builds reusable price data for each symbol, calculating day-over-day movement.
  const buildPriceData = (
    symbol: string,
    price: number,
    previous: PriceData | null
  ): PriceData => {
    const priorPrice = previous?.price ?? price
    const difference = price - priorPrice
    const percent = priorPrice === 0 ? 0 : (difference / priorPrice) * 100

    return {
      symbol,
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(difference.toFixed(2)),
      changePercent: parseFloat(percent.toFixed(2)),
      isUp: difference >= 0,
    }
  }

  useEffect(() => {
    let active = true

    // Fetches market quotes from the Next.js API route and updates the UI.
    const loadLivePrices = async () => {
      if (!active) return
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/market", { cache: "no-store" })

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | MarketPricesResponse
            | null
          throw new Error(payload?.error || "Market data temporarily unavailable")
        }

        const payload = (await response.json()) as MarketPricesResponse
        if (payload.error) {
          throw new Error(payload.error)
        }

        if (!active) return

        setGoldPrice((previous) =>
          buildPriceData("XAUUSD", payload.gold.price, previous)
        )
        setSilverPrice((previous) =>
          buildPriceData("XAGUSD", payload.silver.price, previous)
        )
        setLastUpdate(new Date().toLocaleTimeString())
      } catch (err) {
        if (!active) return
        console.error("Live market fetch error:", err)
        setError("Market data temporarily unavailable")
      } finally {
        if (!active) return
        setIsLoading(false)
      }
    }

    loadLivePrices()
    const interval = window.setInterval(loadLivePrices, 7000)

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [])

  const showPrices = goldPrice !== null && silverPrice !== null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 text-sm">
        <div className="relative flex items-center">
          <motion.div
            className="w-2 h-2 rounded-full bg-emerald-400"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute w-2 h-2 rounded-full bg-emerald-400 opacity-0"
            animate={{ scale: [1, 2], opacity: [1, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        <span className="text-zinc-400">
          Live Market Data • {lastUpdate ? `Last updated ${lastUpdate}` : "Loading..."}
        </span>
      </div>

      {error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-center text-sm text-red-200"
        >
          Market data temporarily unavailable
        </motion.div>
      ) : (
        <>
          {showPrices && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="group">
                <MarketPriceCard data={goldPrice!} delay={0.1} />
              </div>
              <div className="group">
                <MarketPriceCard data={silverPrice!} delay={0.2} />
              </div>
            </div>
          )}

          {isLoading && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-center text-sm text-zinc-400"
            >
              Loading Live Market...
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  )
}
