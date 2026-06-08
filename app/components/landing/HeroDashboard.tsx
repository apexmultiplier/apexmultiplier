"use client"

import { motion } from "framer-motion"
import { BarChart3, Bot, Wallet } from "lucide-react"

export function HeroDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55 }}
      className="relative h-[520px] overflow-hidden rounded-[30px] border border-white/10 bg-white/5 p-8 shadow-[0_0_60px_rgba(16,185,129,0.08)] backdrop-blur-2xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.1),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.05),transparent_40%)]" />
      <div className="absolute -right-16 top-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-emerald-500/8 blur-3xl" />
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-emerald-400/90">PORTFOLIO PERFORMANCE</p>
              <p className="mt-3 text-[32px] font-black uppercase tracking-[-0.04em] text-white">$750,000</p>
            </div>
            <div className="flex items-center gap-2 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.25)]">
              <BarChart3 size={18} />
              +18.4%
            </div>
          </div>
          <div className="mt-8 rounded-[24px] border border-emerald-500/20 bg-emerald-500/5 p-6 shadow-[0_0_40px_rgba(16,185,129,0.12)]">
            <div className="relative h-[240px] overflow-hidden rounded-[24px] bg-gradient-to-b from-emerald-500/15 to-transparent p-4">
              <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(16,185,129,0.12),transparent_50%)]" />
              <svg viewBox="0 0 380 220" className="relative h-full w-full">
                <defs>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <path
                  d="M0 160 C80 120 120 180 180 110 C240 40 280 80 380 30"
                  fill="none"
                  stroke="rgba(16,185,129,0.3)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  className="stroke-current"
                  filter="url(#glow)"
                  style={{ strokeDasharray: 700, strokeDashoffset: 700 }}
                />
                <motion.path
                  d="M0 160 C80 120 120 180 180 110 C240 40 280 80 380 30"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="6"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  filter="url(#glow)"
                />
              </svg>
              <div className="absolute bottom-4 right-6 h-32 w-32 rounded-full bg-emerald-500/20 blur-3xl" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <motion.div 
            whileHover={{ y: -4 }}
            className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-[0_0_60px_rgba(16,185,129,0.08)] backdrop-blur-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent rounded-[30px]" />
            <div className="relative flex items-center gap-4 text-emerald-400">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <BarChart3 size={22} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-emerald-400/90">REVENUE ANALYTICS</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-zinc-400">Real-time capital flow insights with premium clarity.</p>
          </motion.div>
          <motion.div 
            whileHover={{ y: -4 }}
            className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-[0_0_60px_rgba(16,185,129,0.08)] backdrop-blur-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent rounded-[30px]" />
            <div className="relative flex items-center gap-4 text-emerald-400">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <Bot size={22} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-emerald-400/90">AI MARKET INTELLIGENCE</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-zinc-400">Advanced signals for smarter trade decisions.</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
