"use client"

import { motion } from "framer-motion"
import { Users, Target, Award, Shield } from "lucide-react"

export function HeroDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55 }}
      className="relative h-[520px] overflow-hidden rounded-[30px] border border-white/10 bg-white/5 p-8 shadow-[0_0_60px_rgba(6,182,166,0.06)] backdrop-blur-2xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.06),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(6,182,166,0.04),transparent_40%)]" />
      <div className="absolute -right-16 top-20 h-56 w-56 rounded-full bg-cyan-400/8 blur-3xl" />
      <div className="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-emerald-500/8 blur-3xl" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center">
        <div className="flex w-full flex-col items-center">
          <p className="text-xs uppercase tracking-[0.32em] text-emerald-300/90">TRUSTED BY INVESTORS WORLDWIDE</p>

          <div className="mt-4 h-[2px] w-44 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 opacity-95 shadow-[0_0_20px_rgba(16,185,129,0.18)]" />

          <div className="mt-8 grid w-full max-w-4xl grid-cols-2 gap-6 sm:gap-6">
            {/* Card 1 */}
            <motion.div whileHover={{ y: -6 }} className="relative flex h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-white/8 bg-white/4 p-6 shadow-[0_20px_40px_rgba(2,6,23,0.6)] backdrop-blur-md">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-transparent via-cyan-500/5 to-transparent" />
              <div className="relative z-10 flex items-center justify-center">
                <div className="relative flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/10 to-emerald-500/8 p-1">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#0f1724]/60 border border-cyan-400/20 shadow-[0_8px_40px_rgba(6,182,166,0.12)]">
                    <Users size={30} className="text-cyan-300" />
                  </div>
                  <div className="absolute -inset-1 rounded-full blur-3xl bg-cyan-400/10" />
                </div>
              </div>
              <p className="z-10 mt-2 text-2xl font-extrabold text-white">50K+</p>
              <p className="z-10 text-sm text-zinc-400">Active Investors</p>
            </motion.div>

            {/* Card 2 */}
            <motion.div whileHover={{ y: -6 }} className="relative flex h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-white/8 bg-white/4 p-6 shadow-[0_20px_40px_rgba(2,6,23,0.6)] backdrop-blur-md">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-transparent via-cyan-500/5 to-transparent" />
              <div className="relative z-10 flex items-center justify-center">
                <div className="relative flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/10 to-emerald-500/8 p-1">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#0f1724]/60 border border-cyan-400/20 shadow-[0_8px_40px_rgba(6,182,166,0.12)]">
                    <Target size={30} className="text-cyan-300" />
                  </div>
                  <div className="absolute -inset-1 rounded-full blur-3xl bg-cyan-400/10" />
                </div>
              </div>
              <p className="z-10 mt-2 text-2xl font-extrabold text-white">96%</p>
              <p className="z-10 text-sm text-zinc-400">AI Accuracy</p>
            </motion.div>

            {/* Card 3 */}
            <motion.div whileHover={{ y: -6 }} className="relative flex h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-white/8 bg-white/4 p-6 shadow-[0_20px_40px_rgba(2,6,23,0.6)] backdrop-blur-md">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-transparent via-cyan-500/5 to-transparent" />
              <div className="relative z-10 flex items-center justify-center">
                <div className="relative flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/10 to-emerald-500/8 p-1">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#0f1724]/60 border border-cyan-400/20 shadow-[0_8px_40px_rgba(6,182,166,0.12)]">
                    <Award size={30} className="text-cyan-300" />
                  </div>
                  <div className="absolute -inset-1 rounded-full blur-3xl bg-cyan-400/10" />
                </div>
              </div>
              <p className="z-10 mt-2 text-2xl font-extrabold text-white">150+</p>
              <p className="z-10 text-sm text-zinc-400">Professional Traders Manage Funds</p>
            </motion.div>

            {/* Card 4 */}
            <motion.div whileHover={{ y: -6 }} className="relative flex h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-white/8 bg-white/4 p-6 shadow-[0_20px_40px_rgba(2,6,23,0.6)] backdrop-blur-md">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-transparent via-cyan-500/5 to-transparent" />
              <div className="relative z-10 flex items-center justify-center">
                <div className="relative flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/10 to-emerald-500/8 p-1">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#0f1724]/60 border border-cyan-400/20 shadow-[0_8px_40px_rgba(6,182,166,0.12)]">
                    <Shield size={30} className="text-cyan-300" />
                  </div>
                  <div className="absolute -inset-1 rounded-full blur-3xl bg-cyan-400/10" />
                </div>
              </div>
              <p className="z-10 mt-2 text-2xl font-extrabold text-white">24/7</p>
              <p className="z-10 text-sm text-zinc-400">Monitoring</p>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
