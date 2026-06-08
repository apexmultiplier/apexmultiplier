"use client"

import { motion } from "framer-motion"
import { BadgeCheck, Star } from "lucide-react"

interface ReviewCardProps {
  name: string
  location: string
  flag: string
  text: string
}

export function ReviewCard({ name, location, flag, text }: ReviewCardProps) {
  return (
    <motion.div
      whileHover={{ y: -10 }}
      transition={{ duration: 0.3 }}
      className="relative w-full max-w-full md:max-w-[360px] rounded-[20px] md:rounded-[30px] border border-white/10 bg-white/5 p-4 md:p-8 shadow-[0_0_40px_rgba(16,185,129,0.08)] backdrop-blur-2xl overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl md:rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-lg font-semibold text-white shadow-[0_0_20px_rgba(16,185,129,0.20)]">
              {name
                .split(" ")
                .map((part) => part[0])
                .join("")}
            </div>
            <div>
              <p className="font-semibold text-white">{name}</p>
              <p className="text-sm text-zinc-500">{location} {flag}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.32em] text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <BadgeCheck size={14} /> Verified
          </span>
        </div>

        <p className="mt-4 md:mt-6 text-zinc-400 leading-6 md:leading-7 text-sm md:text-base flex-grow">{text}</p>

        <div className="mt-6 flex items-center gap-1 text-emerald-400">
          {[...Array(5)].map((_, index) => (
            <Star key={index} size={16} fill="#10b981" />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
