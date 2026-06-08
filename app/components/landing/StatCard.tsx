"use client"

import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
}

export function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileHover={{ y: -8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.35 }}
      className="relative h-[160px] rounded-[30px] border border-white/10 bg-white/5 p-8 shadow-[0_0_60px_rgba(16,185,129,0.08)] backdrop-blur-2xl overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent" />
      <div className="relative z-10 flex flex-col">
        <div className="flex items-center gap-3 text-emerald-400">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.20)]">
            <Icon size={20} />
          </div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-emerald-400/90">{label}</p>
        </div>
        <p className="mt-6 text-3xl font-black tracking-[-0.04em] text-white drop-shadow-[0_0_15px_rgba(16,185,129,0.25)]">{value}</p>
      </div>
    </motion.div>
  )
}
