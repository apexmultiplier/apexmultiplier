"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Award, Crown, ShieldCheck, Sparkles, Star } from "lucide-react"

export interface PlanRow {
  title: string
  price: string
  amount: string
  roi: string
  duration: string
  featured?: boolean
  vip?: boolean
}

interface PlanCardProps {
  plan: PlanRow
}

const planThemes = {
  Starter: {
    icon: Award,
    accent: "text-amber-300",
    cardGlow: "shadow-[0_35px_110px_rgba(220,146,64,0.18)]",
    border: "border-amber-300/20",
    iconBg: "bg-amber-300/12",
    iconBorder: "border-amber-300/20",
    textAccent: "text-amber-200",
    button: "bg-gradient-to-r from-[#b17335]/30 via-[#d09b43]/35 to-[#f0c77a]/30 text-[#050505] shadow-[0_0_45px_rgba(217,119,6,0.28)] hover:shadow-[0_0_55px_rgba(217,119,6,0.40)]",
    badge: "bg-amber-400/20 text-amber-200 border border-amber-300/30 shadow-[0_0_20px_rgba(217,119,6,0.20)]",
  },
  Silver: {
    icon: ShieldCheck,
    accent: "text-slate-200",
    cardGlow: "shadow-[0_35px_90px_rgba(226,232,240,0.12)]",
    border: "border-slate-300/20",
    iconBg: "bg-slate-100/12",
    iconBorder: "border-slate-300/20",
    textAccent: "text-slate-200",
    button: "bg-gradient-to-r from-[#d8dde6]/25 via-[#f8fafc]/45 to-[#e2e8f0]/25 text-[#020617] shadow-[0_0_45px_rgba(226,232,240,0.28)] hover:shadow-[0_0_55px_rgba(226,232,240,0.40)]",
    badge: "bg-slate-200/10 text-slate-100 border border-slate-300/20 shadow-[0_0_20px_rgba(226,232,240,0.12)]",
  },
  Premium: {
    icon: Sparkles,
    accent: "text-violet-300",
    cardGlow: "shadow-[0_35px_110px_rgba(139,92,246,0.22)]",
    border: "border-violet-400/25",
    iconBg: "bg-violet-500/15",
    iconBorder: "border-violet-400/20",
    textAccent: "text-violet-200",
    button: "bg-gradient-to-r from-[#8b5cf6]/30 via-[#a78bfa]/45 to-[#7c3aed]/30 text-white shadow-[0_0_55px_rgba(167,139,250,0.38)] hover:shadow-[0_0_70px_rgba(167,139,250,0.50)]",
    badge: "bg-violet-500/20 text-violet-100 border border-violet-300/30 shadow-[0_0_24px_rgba(139,92,246,0.22)]",
  },
  Gold: {
    icon: Star,
    accent: "text-amber-300",
    cardGlow: "shadow-[0_35px_110px_rgba(245,158,11,0.20)]",
    border: "border-amber-300/20",
    iconBg: "bg-amber-300/15",
    iconBorder: "border-amber-300/20",
    textAccent: "text-amber-200",
    button: "bg-gradient-to-r from-[#f59e0b]/30 via-[#fbbf24]/45 to-[#fcd34d]/30 text-[#050505] shadow-[0_0_55px_rgba(245,158,11,0.32)] hover:shadow-[0_0_70px_rgba(245,158,11,0.48)]",
    badge: "bg-amber-300/15 text-amber-100 border border-amber-300/20 shadow-[0_0_22px_rgba(245,158,11,0.18)]",
  },
  "Elite Infinity": {
    icon: Crown,
    accent: "text-sky-300",
    cardGlow: "shadow-[0_35px_110px_rgba(56,189,248,0.20)]",
    border: "border-sky-400/25",
    iconBg: "bg-sky-500/15",
    iconBorder: "border-sky-400/20",
    textAccent: "text-sky-200",
    button: "bg-gradient-to-r from-[#38bdf8]/30 via-[#7dd3fc]/45 to-[#0ea5e9]/35 text-[#020617] shadow-[0_0_55px_rgba(56,189,248,0.36)] hover:shadow-[0_0_70px_rgba(56,189,248,0.50)]",
    badge: "bg-sky-400/25 text-sky-100 border border-sky-300/30 shadow-[0_0_24px_rgba(56,189,248,0.20)]",
  },
}

export function PlanCard({ plan }: PlanCardProps) {
  const theme = planThemes[plan.title as keyof typeof planThemes] ?? planThemes.Premium
  const Icon = theme.icon
  const badgeLabel = plan.vip ? "VIP" : plan.featured ? "POPULAR" : null

  return (
    <motion.div
      whileHover={{ y: -12, scale: 1.01 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
        className={`relative w-[92%] md:w-full max-w-[520px] mx-auto h-auto md:h-[560px] overflow-hidden rounded-[28px] md:rounded-[36px] border ${theme.border} bg-white/10 backdrop-blur-[30px] ${theme.cardGlow} transition-transform duration-500 hover:-translate-y-2 hover:shadow-[0_40px_120px_rgba(0,0,0,0.18)]`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-70" />
      <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_28%)]" />
      <div className="absolute right-0 top-0 h-full w-full bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.10),transparent_35%)]" />
      <div className="absolute inset-x-10 top-6 h-px bg-white/10 blur-sm" />
      {badgeLabel ? (
        <div className={`absolute right-6 top-6 rounded-full px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.32em] z-10 ${theme.badge}`}>
          {badgeLabel}
        </div>
      ) : null}

      <div className="relative z-10 flex h-full flex-col gap-8 md:gap-6 p-6 md:p-8 min-h-[420px] md:min-h-0">
        <div className="flex flex-col items-center text-center gap-6 md:gap-4">
            <div className={`relative flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-[20px] md:rounded-[24px] border ${theme.iconBorder} ${theme.iconBg} shadow-[0_0_35px_rgba(255,255,255,0.12)]`}>
              <Icon size={22} className={theme.accent} />
            <span className="absolute inset-0 rounded-[24px] border border-white/5" />
          </div>
          <p className="text-lg md:text-sm uppercase tracking-[0.32em] text-zinc-300 font-extrabold">{plan.title}</p>
        </div>

        <div className="flex flex-col items-center gap-6 text-center">
            <p className={`text-[96px] sm:text-[72px] md:text-5xl lg:text-6xl font-black leading-none whitespace-nowrap tracking-tight drop-shadow-[0_0_30px_rgba(255,215,0,0.55)] ${theme.textAccent}`}>{plan.price}</p>
            <p className="max-w-[240px] text-xs md:text-sm uppercase tracking-[0.28em] text-zinc-400 mt-1">{plan.duration} • {plan.roi}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-zinc-300 w-full">
          <div className="rounded-[18px] border border-white/10 bg-white/10 p-3 text-center shadow-[inset_0_0_12px_rgba(255,255,255,0.05)]">
            <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">ROI</p>
            <p className="mt-2 text-sm md:text-base font-semibold text-white">{plan.roi}</p>
          </div>
          <div className="rounded-[18px] border border-white/10 bg-white/10 p-3 text-center shadow-[inset_0_0_12px_rgba(255,255,255,0.05)]">
            <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">Duration</p>
            <p className="mt-2 text-sm md:text-base font-semibold text-white">{plan.duration}</p>
          </div>
        </div>

        <div className="mt-auto w-full">
          <Link
            href={`/signup?plan=${encodeURIComponent(plan.title)}&amount=${plan.amount}`}
            className={`inline-flex h-14 md:h-[58px] w-full mx-0 items-center justify-center gap-3 rounded-full text-sm md:text-sm font-bold uppercase tracking-[0.22em] md:tracking-[0.3em] transition-transform duration-300 ${theme.button} hover:scale-[1.01]`}
          >
            Invest Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
