"use client"

import { motion } from "framer-motion"
import { ArrowDownLeft, ArrowUpRight, Zap } from "lucide-react"

export interface PriceData {
  symbol: string
  price: number
  change: number
  changePercent: number
  isUp: boolean
}

interface MarketPriceCardProps {
  data: PriceData
  delay: number
}

export default function MarketPriceCard({ data, delay }: MarketPriceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={`relative overflow-hidden rounded-3xl border backdrop-blur-2xl p-6 sm:p-8 ${
        data.isUp
          ? "bg-emerald-500/10 border-emerald-500/30"
          : "bg-red-500/10 border-red-500/30"
      }`}
    >
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
          data.isUp
            ? "bg-gradient-to-br from-emerald-500/20 to-transparent"
            : "bg-gradient-to-br from-red-500/20 to-transparent"
        }`}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className={data.isUp ? "text-emerald-400" : "text-red-400"} size={20} />
            <span className={`text-lg font-bold ${data.isUp ? "text-emerald-400" : "text-red-400"}`}>
              {data.symbol}
            </span>
          </div>

          <div
            className={`flex items-center gap-1 px-3 py-1 rounded-full ${
              data.isUp
                ? "bg-emerald-500/20 border border-emerald-500/30"
                : "bg-red-500/20 border border-red-500/30"
            }`}
          >
            {data.isUp ? (
              <ArrowUpRight size={16} className="text-emerald-400" />
            ) : (
              <ArrowDownLeft size={16} className="text-red-400" />
            )}
            <span className={`text-sm font-bold ${data.isUp ? "text-emerald-400" : "text-red-400"}`}>
              {data.changePercent}%
            </span>
          </div>
        </div>

        <h3 className="text-4xl sm:text-5xl font-black mb-2">${data.price.toFixed(2)}</h3>

        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${data.isUp ? "text-emerald-400" : "text-red-400"}`}>
            {data.isUp ? "+" : ""}${data.change.toFixed(2)}
          </span>
          <span className="text-xs text-zinc-500">24h change</span>
        </div>

        <div className="mt-4 h-1 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              data.isUp
                ? "bg-gradient-to-r from-emerald-400 to-cyan-400"
                : "bg-gradient-to-r from-red-400 to-pink-400"
            }`}
            initial={{ width: "0%" }}
            animate={{ width: `${Math.min(100, Math.abs(data.changePercent) * 5)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      <div
        className={`absolute inset-0 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
          data.isUp
            ? "shadow-[inset_0_0_30px_rgba(16,185,129,0.2)]"
            : "shadow-[inset_0_0_30px_rgba(239,68,68,0.2)]"
        }`}
      />
    </motion.div>
  )
}
