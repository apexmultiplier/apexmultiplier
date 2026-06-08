"use client"

import { useRouter } from "next/navigation"
import { usePlans } from "@/lib/plans"
import { useEffect, useState } from "react"
import { Sparkles, Award, ShieldCheck, Star, Crown } from "lucide-react"

const planThemes = {
  Starter: {
    icon: Award,
    accent: "text-amber-300",
    cardGlow: "shadow-[0_35px_110px_rgba(220,146,64,0.18)]",
    border: "border-amber-300/20",
    iconBg: "bg-amber-300/12",
    iconBorder: "border-amber-300/20",
    textAccent: "text-amber-200",
    button: "bg-gradient-to-r from-[#b17335]/30 via-[#d09b43]/35 to-[#f0c77a]/30 text-[#050505] shadow-[0_0_45px_rgba(217,119,6,0.28)]",
  },
  Silver: {
    icon: ShieldCheck,
    accent: "text-slate-200",
    cardGlow: "shadow-[0_35px_90px_rgba(226,232,240,0.12)]",
    border: "border-slate-300/20",
    iconBg: "bg-slate-100/12",
    iconBorder: "border-slate-300/20",
    textAccent: "text-slate-200",
    button: "bg-gradient-to-r from-[#d8dde6]/25 via-[#f8fafc]/45 to-[#e2e8f0]/25 text-[#020617] shadow-[0_0_45px_rgba(226,232,240,0.28)]",
  },
  Premium: {
    icon: Sparkles,
    accent: "text-violet-300",
    cardGlow: "shadow-[0_35px_110px_rgba(139,92,246,0.22)]",
    border: "border-violet-400/25",
    iconBg: "bg-violet-500/15",
    iconBorder: "border-violet-400/20",
    textAccent: "text-violet-200",
    button: "bg-gradient-to-r from-[#8b5cf6]/30 via-[#a78bfa]/45 to-[#7c3aed]/30 text-white shadow-[0_0_55px_rgba(167,139,250,0.38)]",
  },
  Gold: {
    icon: Star,
    accent: "text-amber-300",
    cardGlow: "shadow-[0_35px_110px_rgba(245,158,11,0.20)]",
    border: "border-amber-300/20",
    iconBg: "bg-amber-300/15",
    iconBorder: "border-amber-300/20",
    textAccent: "text-amber-200",
    button: "bg-gradient-to-r from-[#f59e0b]/30 via-[#fbbf24]/45 to-[#fcd34d]/30 text-[#050505] shadow-[0_0_55px_rgba(245,158,11,0.32)]",
  },
  "Elite Infinity": {
    icon: Crown,
    accent: "text-sky-300",
    cardGlow: "shadow-[0_35px_110px_rgba(56,189,248,0.20)]",
    border: "border-sky-400/25",
    iconBg: "bg-sky-500/15",
    iconBorder: "border-sky-400/20",
    textAccent: "text-sky-200",
    button: "bg-gradient-to-r from-[#38bdf8]/30 via-[#7dd3fc]/45 to-[#0ea5e9]/35 text-[#020617] shadow-[0_0_55px_rgba(56,189,248,0.36)]",
  },
}

const canonicalFallback = [
  { title: "Starter", price: "$500", amount: "500", roi: "8%", duration: "30 Days" },
  { title: "Silver", price: "$1,000", amount: "1000", roi: "9%", duration: "30 Days" },
  { title: "Premium", price: "$2,500", amount: "2500", roi: "10%", duration: "30 Days" },
  { title: "Gold", price: "$5,000", amount: "5000", roi: "12%", duration: "30 Days" },
  { title: "Elite Infinity", price: "$10,000", amount: "10000", roi: "14%", duration: "30 Days" },
]

function PlanSelectCard({ plan, onSelect }: { plan: any; onSelect: (p: any) => void }) {
  const theme = planThemes[plan.title as keyof typeof planThemes] ?? planThemes.Premium
  const Icon = theme.icon

  return (
    <div className={`relative w-[92%] md:w-full max-w-[520px] mx-auto h-auto md:h-[560px] overflow-hidden rounded-[28px] md:rounded-[36px] border ${theme.border} bg-white/10 backdrop-blur-[30px] ${theme.cardGlow} transition-transform duration-500 hover:-translate-y-2 hover:shadow-[0_40px_120px_rgba(0,0,0,0.18)]`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-70" />
      <div className="relative z-10 flex h-full flex-col gap-6 p-5 md:p-8 min-h-[420px] md:min-h-0">
        <div className="flex flex-col items-center text-center gap-4">
          <div className={`relative flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-[20px] md:rounded-[24px] border ${theme.iconBorder} ${theme.iconBg} shadow-[0_0_35px_rgba(255,255,255,0.12)]`}>
            <Icon size={22} className={theme.accent} />
            <span className="absolute inset-0 rounded-[24px] border border-white/5" />
          </div>
          <p className="text-lg md:text-sm uppercase tracking-[0.32em] text-zinc-300 font-extrabold">{plan.title}</p>
        </div>

        <div className="flex flex-col items-center gap-4 text-center">
          <p className={`text-4xl md:text-5xl font-black tracking-[-0.03em] ${theme.textAccent}`}>{plan.price}</p>
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

        <div className="mt-auto">
          <button
            onClick={() => onSelect(plan)}
            className={`inline-flex h-10 md:h-[58px] w-[85%] md:w-full mx-auto items-center justify-center gap-3 rounded-full text-sm md:text-sm font-bold uppercase tracking-[0.22em] md:tracking-[0.3em] transition-transform duration-300 ${theme.button} hover:scale-[1.01]`}
          >
            Select Plan
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SelectPlanPage() {
  const { plans } = usePlans()
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    if (plans && plans.length > 0) {
      setItems(plans.map((p: any) => ({ title: p.title, price: p.price, amount: p.amount, roi: p.roi, duration: p.duration, raw: p.raw })))
    } else {
      setItems(canonicalFallback)
    }
  }, [plans])

  const handleSelect = (p: any) => {
    // store selected plan details in sessionStorage for convenience
    try {
      sessionStorage.setItem('apex_selected_plan', JSON.stringify({ selectedPlan: p.title, selectedAmount: p.amount, selectedROI: p.roi, selectedDuration: p.duration }))
    } catch (e) {}

    const params = new URLSearchParams()
    params.set('plan', p.title)
    if (p.amount) params.set('amount', String(p.amount))
    if (p.roi) params.set('roi', String(p.roi).replace('%',''))
    if (p.duration) params.set('duration', String(p.duration).split(' ')[0])

    router.push(`/deposit?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-[#020406] text-white p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-[30px] p-8 shadow-[0_0_70px_rgba(0,255,174,0.12)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-[#00ffae]/80">Deposit</p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.03em]">Choose Your Investment Plan</h1>
              <p className="mt-3 text-zinc-400 max-w-2xl">Select one of our active investment plans to continue to the deposit form.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {items.map((p: any) => (
            <PlanSelectCard key={p.title} plan={p} onSelect={handleSelect} />
          ))}
        </div>
      </div>
    </div>
  )
}
