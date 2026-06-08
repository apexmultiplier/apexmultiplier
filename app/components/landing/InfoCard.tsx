"use client"

import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

interface InfoCardProps {
  icon: LucideIcon
  title: string
  description: string
  decoration?: ReactNode
}

export function InfoCard({ icon: Icon, title, description, decoration }: InfoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileHover={{ y: -6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.35 }}
      className="relative h-[280px] rounded-[30px] border border-white/10 bg-white/5 p-8 shadow-[0_0_60px_rgba(16,185,129,0.08)] backdrop-blur-2xl overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent" />
      <div className="absolute -bottom-4 right-6 h-32 w-32 rounded-full bg-gradient-to-tr from-emerald-500/15 to-transparent blur-3xl pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center gap-4 text-emerald-400">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
            <Icon size={24} />
          </div>
          <h3 className="text-lg font-bold uppercase tracking-[0.16em] text-white">{title}</h3>
        </div>
        <p className="mt-7 text-base leading-7 text-zinc-400">{description}</p>
      </div>
      {decoration ? <div className="pointer-events-none absolute left-0 right-0 bottom-0 z-0">{decoration}</div> : null}
    </motion.div>
  )
}
