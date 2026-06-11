"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef, useMemo } from "react"
import { usePlans } from "@/lib/plans"
import { motion } from "framer-motion"
import { createPortal } from "react-dom"
import { companyMetrics } from "../lib/companyMetrics"
import { siteStats } from "../lib/siteStats"
import {
  ArrowRight,
  BarChart3,
  ChevronRight,
  Cpu,
  Globe,
  Globe2,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wallet,
  Menu,
  X,
  Target,
  Award,
} from "lucide-react"
import { PlanCard } from "./components/landing/PlanCard"
import { InfoCard } from "./components/landing/InfoCard"
import { ReviewCard } from "./components/landing/ReviewCard"

const navItems = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
  { label: "Mission", href: "#mission" },
  { label: "Vision", href: "#vision" },
  { label: "Reviews", href: "#reviews" },
]

const stats = [
  { icon: Wallet, label: "Total Funds Managed", value: companyMetrics.totalFundsManaged },
  { icon: Users, label: "Active Investors", value: companyMetrics.activeInvestorsLabel },
  { icon: Globe, label: "Countries Served", value: companyMetrics.countriesServedLabel },
  { icon: ShieldCheck, label: "Company Employees", value: companyMetrics.companyEmployeesLabel },
  { icon: BarChart3, label: "Total Trades Executed", value: companyMetrics.totalTradesExecutedLabel },
  { icon: Cpu, label: "AI Strategy Accuracy", value: companyMetrics.aiStrategyAccuracyLabel },
]

const features = [
  {
    icon: ShieldCheck,
    title: "Bank Grade Security",
    description: "Encrypted AI systems with multi-layer protection.",
  },
  {
    icon: Cpu,
    title: "AI Powered Trading",
    description: "Automated insights with high-frequency execution.",
  },
  {
    icon: BarChart3,
    title: "Premium Dashboard",
    description: "Cinematic analytics with immersive glass UI.",
  },
  {
    icon: Wallet,
    title: "Secure Withdrawals",
    description: "Instant transfers with crypto-grade verification.",
  },
  {
    icon: Users,
    title: "24/7 Expert Support",
    description: "White-glove service for every investor.",
  },
]

const heroStats = [
  { icon: Users, value: '50K+', label: 'Active Investors' },
  { icon: Target, value: '96%', label: 'AI Accuracy' },
  { icon: Award, value: '150+', label: 'Professional Traders Manage Funds' },
  { icon: ShieldCheck, value: '24/7', label: 'Monitoring' },
]


// Plans are loaded from Supabase `investment_plans` table to ensure
// a single source of truth shared with the Admin Plans Management.
// Each DB row is mapped into the shape expected by `PlanCard`.

const aboutCards = [
  {
    icon: Sparkles,
    title: "ABOUT APEX MULTIPLIER",
    description:
      "Apex Multiplier is a premium AI-powered investment platform focused on intelligent trading systems, advanced financial analytics, and sustainable portfolio growth opportunities designed for modern investors.",
  },
  {
    icon: ShieldCheck,
    title: "OUR MISSION",
    description:
      "Our mission is to provide secure, intelligent, and sustainable investment opportunities through advanced AI trading systems, professional financial infrastructure, and long-term investor confidence.",
  },
  {
    icon: Globe2,
    title: "OUR VISION",
    description:
      "Our vision is to build a globally trusted AI-powered investment ecosystem focused on innovation, transparency, financial growth, and modern investment technology.",
  },
]

const reviews = [
  {
    name: "Ahmed Raza",
    location: "Dubai, UAE",
    flag: "🇦🇪",
    text: "Apex Multiplier transformed my portfolio with intelligent trading and premium execution.",
  },
  {
    name: "Rahul Sharma",
    location: "Mumbai, India",
    flag: "🇮🇳",
    text: "The AI signals are precise and the dashboard feels like a futuristic trading cockpit.",
  },
  {
    name: "James Wilson",
    location: "London, UK",
    flag: "🇬🇧",
    text: "Elite-grade investment tools with a cyber-finance aesthetic that inspires confidence.",
  },
  {
    name: "Wei Ling",
    location: "Singapore",
    flag: "🇸🇬",
    text: "The platform is secure, fast, and visually premium — exactly what modern investors want.",
  },
]

const particlePositions = Array.from({ length: 30 }, (_, i) => ({
  left: `${(i * 13) % 100}%`,
  top: `${(i * 21) % 100}%`,
}))

const globePoints = [
  { top: "28%", left: "58%" }, // USA
  { top: "36%", left: "68%" }, // UK
  { top: "47%", left: "74%" }, // UAE
  { top: "63%", left: "72%" }, // India
  { top: "58%", left: "82%" }, // Singapore
  { top: "32%", left: "46%" }, // Europe
]

function FAQAccordion() {
  const faqs = [
    { q: "How does Apex Multiplier work?", a: "Apex uses AI-driven strategies and professional risk management to deploy investments across diversified opportunities tailored to plan selection." },
    { q: "How are profits generated?", a: "Profits are generated through algorithmic trading strategies, market arbitrage, and diversified portfolio allocations managed by our AI models and expert team." },
    { q: "How do withdrawals work?", a: "Withdrawals are processed through secure channels with verification; processing times vary by plan and payment method." },
    { q: "How secure is the platform?", a: "We employ enterprise-grade encryption, continuous monitoring, and strict data privacy controls to protect investor funds and information." },
    { q: "Can I upgrade my plan later?", a: "Yes — users can upgrade or modify plans via their dashboard; contact support for personalized assistance." },
    { q: "How does AI technology support investments?", a: "AI analyzes market data, signals, and risk patterns to optimize trade execution and enhance decision-making for better long-term outcomes." },
  ]
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="mt-4 space-y-3">
      {faqs.map((f, i) => (
        <div key={i} className="rounded-[18px] border border-white/8 bg-white/4 overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div>
              <p className="font-semibold text-white">{f.q}</p>
            </div>
            <motion.span animate={{ rotate: open === i ? 90 : 0 }} className="text-zinc-400"><ChevronRight /></motion.span>
          </button>
          <motion.div initial={{ height: 0, opacity: 0 }} animate={open === i ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="px-4 pb-4 text-zinc-300">
            <p className="text-sm leading-6">{f.a}</p>
          </motion.div>
        </div>
      ))}
    </div>
  )
}

function AICalculator() {
  // Calculator must exactly match website plans — keep only allowed plans
  const plans = [
    { title: "Starter", amount: 500, roi: 8 },
    { title: "Silver", amount: 1000, roi: 9 },
    { title: "Premium", amount: 2500, roi: 10 },
    { title: "Gold", amount: 5000, roi: 12 },
    { title: "Elite Infinity", amount: 10000, roi: 14 },
  ]

  const [selectedIdx, setSelectedIdx] = useState(0)
  const [amount, setAmount] = useState(plans[selectedIdx].amount)
  const [months, setMonths] = useState(1)
  const [displayProfit, setDisplayProfit] = useState(0)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    setAmount(plans[selectedIdx].amount)
  }, [selectedIdx])

  const finalAmount = useMemo(() => {
    const principal = Number(amount) || 0
    const monthlyRate = (plans[selectedIdx].roi || 0) / 100
    return principal * Math.pow(1 + monthlyRate, months)
  }, [amount, months, selectedIdx])

  const profit = Math.max(0, finalAmount - (Number(amount) || 0))

  // Monthly withdrawal scenario
  const monthlyProfit = (Number(amount) || 0) * ((plans[selectedIdx].roi || 0) / 100)
  const totalProfitCollected = monthlyProfit * months
  const principalRemaining = Number(amount) || 0
  const reinvestProfit = profit
  const differenceEarned = reinvestProfit - totalProfitCollected

  // animate profit display
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const from = displayProfit
    const to = profit
    const duration = 600

    function step(now: number) {
      const t = Math.min(1, (now - start) / duration)
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      const value = from + (to - from) * eased
      setDisplayProfit(Number(value.toFixed(2)))
      if (t < 1) raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profit])

  // lock body scroll when modal is open
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (showModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      if (typeof document !== 'undefined') document.body.style.overflow = ''
    }
  }, [showModal])

  return (
    <section className="relative z-10 px-6 pb-12" aria-label="AI Profit Estimator">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-[#00ffae]/80">AI Profit Estimator</p>
          <h3 className="mt-3 text-2xl md:text-4xl font-black text-white">Calculate Your Future Investment Growth</h3>
          <p className="mt-2 text-zinc-400">Quickly estimate projected returns using our plan ROIs.</p>
        </div>

        <div className="rounded-[24px] border border-[rgba(0,255,174,0.12)] bg-white/4 p-5 md:p-8 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,255,174,0.06)]">
          <div className="grid gap-4 md:grid-cols-3 items-start">
            <div className="md:col-span-1">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {plans.map((p, i) => (
                  <button
                    key={p.title}
                    onClick={() => setSelectedIdx(i)}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl border ${i === selectedIdx ? "border-[#00ffae] bg-[#00ffae]/6" : "border-white/6 bg-white/2"} text-sm font-semibold text-white`}
                  >
                    {p.title}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <label className="text-xs text-zinc-400">Amount (USD)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full mt-2 rounded-lg bg-white/3 p-3 text-white"
                />
              </div>

              <div className="mt-4">
                <label className="text-xs text-zinc-400">Duration (months)</label>
                <input
                  type="range"
                  min={1}
                  max={36}
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                  className="w-full mt-2"
                />
                <div className="text-sm text-zinc-300 mt-1">{months} month{months > 1 ? "s" : ""}</div>
              </div>
            </div>

            <div className="md:col-span-2 grid gap-4">
              <div className="rounded-[18px] p-4 bg-gradient-to-br from-white/[0.02] to-transparent border border-white/6 flex flex-col md:flex-row items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Projected Final Amount</p>
                  <p className="mt-2 text-2xl md:text-3xl font-black text-white">${finalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                  <p className="text-sm text-zinc-400">Estimated Profit</p>
                  <p className="mt-2 text-2xl md:text-3xl font-black text-[#00ffae]">${displayProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-[12px] p-3 bg-white/3 text-zinc-200">
                  <p className="text-xs">Selected Plan ROI</p>
                  <p className="mt-1 text-lg font-bold">{plans[selectedIdx].roi}% / mo</p>
                </div>
                <div className="rounded-[12px] p-3 bg-white/3 text-zinc-200">
                  <p className="text-xs">Initial</p>
                  <p className="mt-1 text-lg font-bold">${Number(amount).toLocaleString()}</p>
                </div>
                <div className="rounded-[12px] p-3 bg-white/3 text-zinc-200">
                  <p className="text-xs">Duration</p>
                  <p className="mt-1 text-lg font-bold">{months} mo</p>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={() => setShowModal(true)} className="neon-btn mt-2 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#00ffae]/8 border border-[#00ffae]/30 text-white font-semibold">
                  Simulate Investment
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Modal */}
      {showModal ? createPortal(
        <div onClick={() => setShowModal(false)} className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-[90%] max-w-[800px] max-h-[85vh] overflow-y-auto rounded-[28px] border border-[rgba(0,255,174,0.12)] bg-white/6 p-4 sm:p-6 md:p-8 backdrop-blur-3xl shadow-[0_10px_50px_rgba(0,0,0,0.6)] transform-gpu"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base md:text-2xl font-black text-white">Investment Projection Summary</h3>
                <p className="text-zinc-400 mt-1 text-xs md:text-sm">Summary of projected outcomes for your selected plan.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-zinc-300 text-sm">Close</button>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm text-zinc-400">Selected Plan:</p>
                <p className="font-bold text-white">{plans[selectedIdx].title}</p>

                <p className="text-sm text-zinc-400 mt-2">Investment Amount:</p>
                <p className="font-bold text-white">${Number(amount).toLocaleString()}</p>

                <p className="text-sm text-zinc-400 mt-2">Monthly ROI:</p>
                <p className="font-bold text-white">{plans[selectedIdx].roi}%</p>

                <p className="text-sm text-zinc-400 mt-2">Selected Duration:</p>
                <p className="font-bold text-white">{months} month{months > 1 ? 's' : ''}</p>
              </div>

              <div className="space-y-3">
                <div className="rounded-[12px] p-3 bg-white/4 border border-white/6">
                  <p className="text-sm text-zinc-400">REINVESTMENT SCENARIO</p>
                  <p className="mt-2 text-xl md:text-2xl font-black text-[#00ffae] drop-shadow-[0_0_18px_rgba(0,255,174,0.16)]">${reinvestProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  <p className="text-sm text-zinc-400">Projected Profit</p>
                  <p className="mt-2 text-base md:text-lg font-bold text-white">Total Portfolio Value: ${finalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>

                <div className="rounded-[12px] p-3 bg-white/4 border border-white/6">
                  <p className="text-sm text-zinc-400">MONTHLY WITHDRAWAL SCENARIO</p>
                  <p className="mt-2 text-xl md:text-2xl font-black text-white">Monthly Profit: ${monthlyProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  <p className="text-sm text-zinc-400 mt-1">Total Profit Collected: ${totalProfitCollected.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  <p className="text-sm text-zinc-400 mt-1">Principal Remaining: ${principalRemaining.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2 items-start">
              <div className="rounded-[12px] p-3 bg-white/4 border border-white/6">
                <p className="text-sm text-zinc-400">Option A</p>
                <h4 className="mt-1 font-black text-white">Reinvest Profits</h4>
                <p className="mt-1 text-base text-[#00ffae]">Projected Profit: ${reinvestProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
              <div className="rounded-[12px] p-3 bg-white/4 border border-white/6">
                <p className="text-sm text-zinc-400">Option B</p>
                <h4 className="mt-1 font-black text-white">Monthly Withdrawals</h4>
                <p className="mt-1 text-base text-white">Total Profit Collected: ${totalProfitCollected.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="bg-[#052018] text-[#00ffae] px-3 py-1 rounded-full text-sm font-semibold">Potential Additional Growth</div>
              <div className="text-sm text-zinc-400">Difference Earned: <span className="font-bold text-white ml-2">${differenceEarned.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
            </div>

            <div className="mt-3 text-zinc-300 text-sm">
              <p className="font-semibold">Important Notice</p>
              <p className="mt-1 text-xs md:text-sm">These figures are estimated projections based on the selected package ROI. Results assume constant ROI throughout the selected period. Actual performance may vary.</p>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-center sm:justify-end gap-3">
              <Link href={`/signup?plan=${encodeURIComponent(plans[selectedIdx].title)}&amount=${Number(amount)}`} className="w-full sm:w-auto h-12 rounded-2xl bg-gradient-to-r from-[#00ffae] via-[#00e5ff] to-[#10f2c1] px-6 text-sm font-bold text-black shadow-[0_0_28px_rgba(0,255,174,0.25)]">Buy This Package</Link>
              <button onClick={() => setShowModal(false)} className="w-full sm:w-auto h-12 rounded-2xl border border-white/10 px-6 text-sm font-bold text-white">Close</button>
            </div>
          </motion.div>
        </div>,
        // mount at document.body to ensure modal is outside page layout
        typeof document !== 'undefined' ? document.body : ({} as DocumentFragment)
      ) : null}

    </section>
  )
}

export default function Page() {
  const router = useRouter()
  const [feedIndex, setFeedIndex] = useState(0)
  const feedRef = useRef<number | null>(null)

  const activityFeed = [
    "Ahmed R. (UAE) activated Premium Plan",
    "James W. (UK) received withdrawal",
    "Rahul S. (India) joined Gold Plan",
    "Daniel C. (Canada) earned daily profit",
  ]

  useEffect(() => {
    feedRef.current = window.setInterval(() => {
      setFeedIndex((i) => (i + 1) % activityFeed.length)
    }, 2800)
    return () => {
      if (feedRef.current) window.clearInterval(feedRef.current)
    }
  }, [])

  const { plans, loading: plansLoading, error: plansError } = usePlans()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Fallback plans shown when Supabase returns empty data or an error.
  // Keep UI/design identical by matching `PlanCard` props.
  const defaultPlans = [
    { title: "Starter", price: "$500", amount: "500", roi: "8% Monthly", duration: "30 Days", featured: false, vip: false },
    { title: "Silver", price: "$1,000", amount: "1000", roi: "9% Monthly", duration: "30 Days", featured: true, vip: false },
    { title: "Premium", price: "$2,500", amount: "2500", roi: "10% Monthly", duration: "30 Days", featured: false, vip: true },
    { title: "Gold", price: "$5,000", amount: "5000", roi: "12% Monthly", duration: "30 Days", featured: false, vip: false },
    { title: "Elite Infinity", price: "$10,000", amount: "10000", roi: "14% Monthly", duration: "30 Days", featured: true, vip: true },
  ]

  // Determine which plans to render: prefer DB plans, otherwise fallback.
  const displayPlans = (!plansLoading && (plans?.length || 0) === 0) ? defaultPlans : plans

  // Console logging for debugging; do not expose DB errors to users.
  useEffect(() => {
    console.debug('Plans Provider - loading:', plansLoading)
    console.debug('Plans Provider - plans count:', (plans || []).length)
    if (plansError) console.warn('Plans Provider - error loading plans (logged only):', plansError)
  }, [plansLoading, plans, plansError])

  // Global presence will display companyMetrics labels to ensure exact official values

  const growthDecoration = (
    <motion.div
      aria-hidden
      animate={{ y: [0, -6, 0], opacity: [0.14, 0.22, 0.14] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="absolute left-0 right-0 bottom-0 flex justify-center pointer-events-none z-0"
      style={{ mixBlendMode: "screen" }}
    >
      <svg width="100%" height="120" viewBox="0 0 800 120" fill="none" preserveAspectRatio="xMidYMax meet" className="opacity-20">
        <defs>
          <linearGradient id="g1" x1="0" x2="1">
            <stop offset="0%" stopColor="#00ffae" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        <g transform="translate(20,10)">
          <rect x="0" y="50" width="18" height="60" rx="3" fill="#042015" />
          <rect x="36" y="32" width="18" height="78" rx="3" fill="#06261a" />
          <rect x="72" y="20" width="18" height="90" rx="3" fill="#08322a" />
          <rect x="108" y="6" width="18" height="104" rx="3" fill="#0a3f2f" />
          <rect x="144" y="38" width="18" height="72" rx="3" fill="#063224" />
          <path d="M0 96 C120 60 240 40 360 20 C480 4 600 10 720 8" stroke="url(#g1)" strokeWidth="3" fill="none" strokeLinecap="round" />
          <g opacity="0.9" transform="translate(560,12)">
            <rect x="0" y="28" width="8" height="36" rx="2" fill="#00ffae" opacity="0.16" />
            <rect x="12" y="8" width="8" height="56" rx="2" fill="#00e5ff" opacity="0.12" />
            <rect x="24" y="0" width="8" height="64" rx="2" fill="#10f2c1" opacity="0.10" />
          </g>
          <path d="M180 80 L210 44 L240 60 L270 32 L300 40" stroke="#00ffae" strokeWidth="2" opacity="0.18" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    </motion.div>
  )

  const missionDecoration = (
    <motion.div
      aria-hidden
      animate={{ y: [0, -4, 0], opacity: [0.12, 0.18, 0.12] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      className="absolute right-0 bottom-0 pointer-events-none z-0"
      style={{ mixBlendMode: "screen" }}
    >
      <svg width="220" height="120" viewBox="0 0 220 120" fill="none" preserveAspectRatio="xMaxYMax meet" className="opacity-18">
        <defs>
          <radialGradient id="r1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00ffae" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.06" />
          </radialGradient>
        </defs>
        <g transform="translate(0,6)">
          <circle cx="180" cy="70" r="34" stroke="#00ffae" strokeWidth="2" opacity="0.12" fill="url(#r1)" />
          <circle cx="180" cy="70" r="52" stroke="#00e5ff" strokeWidth="1" opacity="0.08" fill="none" />
          <circle cx="180" cy="70" r="18" stroke="#10f2c1" strokeWidth="1.5" opacity="0.14" fill="none" />
          <path d="M140 72 L172 72 L186 58" stroke="#00ffae" strokeWidth="1.6" opacity="0.14" fill="none" strokeLinecap="round" />
          <circle cx="186" cy="58" r="2.6" fill="#00ffae" opacity="0.9" />
        </g>
      </svg>
    </motion.div>
  )

  const visionDecoration = (
    <motion.div
      aria-hidden
      animate={{ y: [0, -3, 0], opacity: [0.12, 0.2, 0.12] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      className="absolute left-0 right-0 bottom-0 flex justify-center pointer-events-none z-0"
      style={{ mixBlendMode: "screen" }}
    >
      <svg width="100%" height="120" viewBox="0 0 800 120" fill="none" preserveAspectRatio="xMidYMax meet" className="opacity-18">
        <defs>
          <linearGradient id="g2" x1="0" x2="1">
            <stop offset="0%" stopColor="#00ffae" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <g transform="translate(140,6)">
          <circle cx="180" cy="40" r="36" stroke="url(#g2)" strokeWidth="1.8" opacity="0.14" fill="none" />
          <path d="M34 40 C74 10 146 10 186 40 C226 70 298 70 338 40" stroke="#00e5ff" strokeWidth="1" opacity="0.08" fill="none" />
          <g opacity="0.12">
            <path d="M120 16 L148 36 M120 64 L148 44" stroke="#00ffae" strokeWidth="0.9" strokeLinecap="round" />
            <path d="M196 18 L224 38 M196 62 L224 42" stroke="#00ffae" strokeWidth="0.9" strokeLinecap="round" />
          </g>
          <g opacity="0.14" stroke="#00ffae" strokeWidth="0.9" fill="none">
            <path d="M40 80 C80 60 120 60 160 80" />
            <path d="M200 80 C240 60 280 60 320 80" />
          </g>
        </g>
      </svg>
    </motion.div>
  )
  return (
    <main className="min-h-screen overflow-hidden bg-[#020406] text-white relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,255,174,0.15),transparent_40%)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#00ffae]/10 blur-[140px]" />
      <div className="absolute top-40 left-20 w-72 h-72 rounded-full bg-[#00e5ff]/10 blur-[120px]" />
      <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-[#00ffae]/10 blur-[140px]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] opacity-20" />

      <div className="absolute inset-0 overflow-hidden">
        {particlePositions.map((particle, index) => (
          <motion.div
            key={index}
            className="absolute w-[2px] h-[2px] rounded-full bg-[#00ffae] opacity-40"
            animate={{ y: [0, -18, 0], opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 4 + index * 0.15, repeat: Infinity }}
            style={{ left: particle.left, top: particle.top }}
          />
        ))}
      </div>

      <header className="sticky top-4 z-50 px-3 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-[30px] border border-[rgba(0,255,174,0.2)] bg-white/5 px-4 py-3 md:px-8 md:py-5 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,255,174,0.12),inset_0_0_20px_rgba(255,255,255,0.03)]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-[#0a0f1c]/80 border border-[#00ffae]/20 shadow-[0_0_18px_rgba(0,255,174,0.18)]">
                  <img src="/logo.png" alt="Apex Multiplier" className="max-h-7 md:max-h-9 max-w-full object-contain" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">Apex</p>
                  <p className="text-xl font-black uppercase tracking-[0.1em] text-white">Multiplier</p>
                </div>
              </div>

              {/* Desktop nav (unchanged) */}
              <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="group inline-flex items-center gap-2 transition hover:text-white"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#00ffae] shadow-[0_0_10px_rgba(0,255,174,0.35)] group-hover:bg-[#00e5ff]" />
                    {item.label}
                  </a>
                ))}
              </nav>

              {/* Mobile hamburger */}
              <div className="md:hidden">
                <button
                  aria-label="Open menu"
                  onClick={() => setMobileMenuOpen((s) => !s)}
                  className="inline-flex items-center justify-center rounded-lg bg-white/6 p-2 text-zinc-200"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => router.push("/login")}
                  className="h-10 md:h-12 rounded-2xl border border-[#00ffae]/25 bg-white/7 px-4 md:px-6 text-sm text-white transition duration-300 hover:bg-white/10 hover:border-[#00ffae]/40 hover:shadow-[0_0_30px_rgba(0,255,174,0.18)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#00ffae]/40"
                >
                  Login
                </button>
                <Link
                  href="/signup"
                  className="h-10 md:h-12 rounded-2xl bg-gradient-to-r from-[#00ffae] via-[#00e5ff] to-[#10f2c1] px-4 md:px-6 text-sm font-bold text-black shadow-[0_0_28px_rgba(0,255,174,0.25)] transition hover:shadow-[0_0_40px_rgba(0,255,174,0.35)]"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu panel (only affects screens < md) */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4">
          <div className="mx-auto mt-2 rounded-xl border border-white/8 bg-white/4 p-4 shadow-lg backdrop-blur-sm">
            <nav className="flex flex-col gap-3">
              {navItems.map((item) => (
                <a key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 text-white/90 py-2 px-2 rounded hover:bg-white/6">
                  <span className="h-2 w-2 rounded-full bg-[#00ffae]" />
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-3 flex gap-3">
              <button onClick={() => { setMobileMenuOpen(false); router.push('/login') }} className="flex-1 h-10 rounded-2xl border border-[#00ffae]/25 bg-white/7 text-sm">Login</button>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="flex-1 h-10 rounded-2xl bg-gradient-to-r from-[#00ffae] via-[#00e5ff] to-[#10f2c1] text-sm text-black flex items-center justify-center">Create Account</Link>
            </div>
          </div>
        </div>
      )}

      <section className="relative z-10 px-6 pt-20 pb-28">
        <div className="max-w-7xl mx-auto grid gap-16 lg:grid-cols-2 items-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-sm uppercase tracking-[0.35em] text-[#00ffae]/80 mb-6">
              ADVANCED AI TRADING INFRASTRUCTURE
            </p>
            <h1 className="text-4xl sm:text-6xl md:text-5xl lg:text-7xl font-black uppercase leading-tight md:leading-[0.92] tracking-[-0.04em] text-white">
              FUTURE OF
              <span className="block text-[#00ffae] drop-shadow-[0_0_25px_rgba(0,255,174,0.45)]">
                SMART INVESTING
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-zinc-400 leading-7 text-sm md:text-lg">
              Every great financial journey begins with a single decision. Join thousands of forward-thinking individuals leveraging AI-powered investment solutions to build long-term wealth, create new income opportunities, and move closer to the financial freedom they deserve.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <button
                onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="inline-flex items-center gap-3 h-10 md:h-14 rounded-2xl bg-gradient-to-r from-[#00ffae] via-[#00e5ff] to-[#10f2c1] px-4 md:px-8 text-black font-bold shadow-[0_0_28px_rgba(0,255,174,0.25)] transition hover:scale-[1.02]"
              >
                Start Investing
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="inline-flex items-center gap-3 h-10 md:h-14 rounded-2xl border border-white/10 bg-white/5 px-4 md:px-8 text-white transition hover:bg-white/10"
              >
                Explore Platform
                <ChevronRight className="w-5 h-5 text-[#00ffae]" />
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div
              className="relative rounded-[32px] border border-[rgba(0,255,174,0.12)] bg-[radial-gradient(circle_at_center,rgba(0,255,170,0.12)_0%,rgba(0,255,170,0.04)_40%,transparent_75%),rgba(16,45,40,0.55)] backdrop-blur-xl overflow-hidden p-6"
              style={{ boxShadow: "0 0 40px rgba(0,255,170,0.08), 0 0 80px rgba(0,255,170,0.04)" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-500/3 to-transparent pointer-events-none rounded-[28px]" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/3 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.14),transparent_40%)] opacity-90 blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="mb-4">
                  <p className="text-sm uppercase tracking-[0.24em] text-emerald-300/90">APEX MARKET PERFORMANCE</p>
                  <h2 className="mt-1 text-2xl md:text-3xl font-black text-white">PORTFOLIO GROWTH</h2>
                  <p className="mt-2 text-sm text-zinc-400">Real Performance Across Major Trading Assets</p>
                </div>

                <div className="mt-4 w-full h-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <div className="relative flex h-28 flex-col justify-between gap-2 overflow-hidden rounded-xl border border-white/6 bg-[#081018]/60 p-4 shadow-[0_10px_30px_rgba(2,6,23,0.6)] backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">XAUUSD</p>
                            <p className="mt-1 text-sm font-medium text-zinc-300">Gold</p>
                          </div>
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/10 to-emerald-500/8 border border-cyan-400/20 shadow-[0_8px_30px_rgba(6,182,166,0.08)]">
                            <TrendingUp className="w-4 h-4 text-cyan-300" />
                          </div>
                        </div>
                        <div className="flex items-end justify-between">
                          <p className="text-2xl font-extrabold text-white">$2.8M+</p>
                          <div className="flex items-center gap-2 text-sm text-emerald-400">
                            <ArrowRight className="w-4 h-4" />
                            <span className="text-emerald-400">+2.4%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1">
                      <div className="relative flex h-28 flex-col justify-between gap-2 overflow-hidden rounded-xl border border-white/6 bg-[#081018]/60 p-4 shadow-[0_10px_30px_rgba(2,6,23,0.6)] backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">XAGUSD</p>
                            <p className="mt-1 text-sm font-medium text-zinc-300">Silver</p>
                          </div>
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/10 to-emerald-500/8 border border-cyan-400/20 shadow-[0_8px_30px_rgba(6,182,166,0.08)]">
                            <TrendingUp className="w-4 h-4 text-cyan-300" />
                          </div>
                        </div>
                        <div className="flex items-end justify-between">
                          <p className="text-2xl font-extrabold text-white">$0.9M+</p>
                          <div className="flex items-center gap-2 text-sm text-emerald-400">
                            <ArrowRight className="w-4 h-4" />
                            <span className="text-emerald-400">+1.8%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1">
                      <div className="relative flex h-28 flex-col justify-between gap-2 overflow-hidden rounded-xl border border-white/6 bg-[#081018]/60 p-4 shadow-[0_10px_30px_rgba(2,6,23,0.6)] backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">BTCUSD</p>
                            <p className="mt-1 text-sm font-medium text-zinc-300">Bitcoin</p>
                          </div>
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/10 to-emerald-500/8 border border-cyan-400/20 shadow-[0_8px_30px_rgba(6,182,166,0.08)]">
                            <TrendingUp className="w-4 h-4 text-cyan-300" />
                          </div>
                        </div>
                        <div className="flex items-end justify-between">
                          <p className="text-2xl font-extrabold text-white">$1.7M+</p>
                          <div className="flex items-center gap-2 text-sm text-emerald-400">
                            <ArrowRight className="w-4 h-4" />
                            <span className="text-emerald-400">+3.1%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1">
                      <div className="relative flex h-28 flex-col justify-between gap-2 overflow-hidden rounded-xl border border-white/6 bg-[#081018]/60 p-4 shadow-[0_10px_30px_rgba(2,6,23,0.6)] backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">EURUSD</p>
                            <p className="mt-1 text-sm font-medium text-zinc-300">EUR/USD</p>
                          </div>
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/10 to-emerald-500/8 border border-cyan-400/20 shadow-[0_8px_30px_rgba(6,182,166,0.08)]">
                            <TrendingUp className="w-4 h-4 text-cyan-300" />
                          </div>
                        </div>
                        <div className="flex items-end justify-between">
                          <p className="text-2xl font-extrabold text-white">$1.3M+</p>
                          <div className="flex items-center gap-2 text-sm text-emerald-400">
                            <ArrowRight className="w-4 h-4" />
                            <span className="text-emerald-400">+1.9%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 flex justify-center">
                      <div className="w-full max-w-xs">
                        <div className="relative flex h-28 flex-col justify-between gap-2 overflow-hidden rounded-xl border border-white/6 bg-[#081018]/60 p-4 shadow-[0_10px_30px_rgba(2,6,23,0.6)] backdrop-blur-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">GBPUSD</p>
                              <p className="mt-1 text-sm font-medium text-zinc-300">GBP/USD</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/10 to-emerald-500/8 border border-cyan-400/20 shadow-[0_8px_30px_rgba(6,182,166,0.08)]">
                              <TrendingUp className="w-4 h-4 text-cyan-300" />
                            </div>
                          </div>
                          <div className="flex items-end justify-between">
                            <p className="text-2xl font-extrabold text-white">$1.1M+</p>
                            <div className="flex items-center gap-2 text-sm text-emerald-400">
                              <ArrowRight className="w-4 h-4" />
                              <span className="text-emerald-400">+1.6%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 px-6 pb-28" id="features">
        <div className="max-w-7xl mx-auto grid gap-5 grid-cols-2 md:grid-cols-2 xl:grid-cols-6">
          {stats.map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -8 }}
              className="relative rounded-[30px] border border-[rgba(0,255,174,0.2)] bg-white/5 backdrop-blur-2xl p-7 overflow-hidden shadow-[0_0_25px_rgba(0,255,174,0.15),inset_0_0_20px_rgba(255,255,255,0.03)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent" />
              <div className="relative z-10">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-3xl bg-[#00ffae]/10 border border-[#00ffae]/20 flex items-center justify-center mb-5 shadow-[0_0_25px_rgba(0,255,174,0.12)]">
                  <item.icon className="w-5 h-5 md:w-6 md:h-6 text-[#00ffae]" />
                </div>
                <p className="text-sm uppercase tracking-[0.35em] text-[#00ffae]/80">{item.label}</p>
                <h3 className="mt-4 text-xl md:text-3xl font-black text-white">{item.value}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-6 pb-28">
        <div className="max-w-7xl mx-auto mb-12 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-[#00ffae]/80">Features</p>
          <h2 className="mt-4 text-4xl md:text-5xl font-black text-white tracking-normal leading-tight">
            Advanced Fintech Features Built for Elite Global Investors
          </h2>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -8 }}
              className="relative rounded-[30px] border border-[rgba(0,255,174,0.2)] bg-white/5 backdrop-blur-2xl p-8 overflow-hidden shadow-[0_0_25px_rgba(0,255,174,0.15),inset_0_0_20px_rgba(255,255,255,0.03)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent" />
              <div className="relative z-10 flex h-full flex-col gap-6">
                <div className="w-16 h-16 rounded-3xl bg-[#00ffae]/10 border border-[#00ffae]/20 flex items-center justify-center text-[#00ffae] shadow-[0_0_20px_rgba(0,255,174,0.12)]">
                  <feature.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{feature.title}</h3>
                  <p className="mt-4 text-zinc-400 leading-7">{feature.description}</p>
                </div>
                <div className="mt-auto text-sm uppercase tracking-[0.35em] text-[#00ffae]/80">Live</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-6 pb-28" id="pricing">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <p className="text-sm uppercase tracking-[0.35em] text-[#00ffae]/80">Investment Plans</p>
          <h2 className="mt-4 text-3xl md:text-5xl font-black text-white tracking-normal leading-tight">
            Choose the Perfect AI Investment Plan for Your Portfolio
          </h2>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-5">
          {plansLoading && (
            <div className="col-span-1 lg:col-span-5 text-center text-zinc-400">Loading plans...</div>
          )}

          {displayPlans.map((plan) => <PlanCard key={plan.title} plan={plan} />)}
        </div>
      </section>

      {/* AI Profit Estimator Section (inserted between Pricing and About) */}
      <AICalculator />

      <section className="relative z-10 px-6 pb-28" id="about">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <p className="text-sm uppercase tracking-[0.35em] text-[#00ffae]/80">About / Mission / Vision</p>
          <h2 className="mt-4 text-4xl md:text-5xl font-black text-white tracking-normal leading-tight">
            Purpose-Built for Next-Generation AI Investments
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {aboutCards.map((card) => (
            <InfoCard
              key={card.title}
              icon={card.icon}
              title={card.title}
              description={card.description}
              decoration={
                card.title === "ABOUT APEX MULTIPLIER"
                  ? growthDecoration
                  : card.title === "OUR MISSION"
                  ? missionDecoration
                  : card.title === "OUR VISION"
                  ? visionDecoration
                  : null
              }
            />
          ))}
        </div>
      </section>

      {/* Live Activity Feed */}
      <section className="relative z-10 px-6 pb-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="col-span-1 md:col-span-1 relative rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-[0_0_60px_rgba(16,185,129,0.04)] backdrop-blur-2xl">
            <p className="text-sm uppercase tracking-[0.35em] text-[#00ffae]/80">Live Activity</p>
            <h3 className="mt-3 text-xl font-black text-white">Recent Platform Activity</h3>
            <div className="mt-4 h-20 flex items-center">
              <motion.div key={feedIndex} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }} className="text-zinc-300">
                ✓ {activityFeed[feedIndex]}
              </motion.div>
            </div>
          </div>

          {/* Trust & Security */}
          <div className="col-span-1 md:col-span-1 rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-[0_0_60px_rgba(16,185,129,0.04)] backdrop-blur-2xl">
            <p className="text-sm uppercase tracking-[0.35em] text-[#00ffae]/80">Trust & Security</p>
            <h3 className="mt-3 text-xl font-black text-white">Enterprise-Grade Protection</h3>
            <ul className="mt-4 grid gap-3 text-zinc-300">
              <li className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-[#00ffae]" /> Advanced AI Infrastructure</li>
              <li className="flex items-center gap-3"><Wallet className="w-5 h-5 text-[#00ffae]" /> Secure Transactions</li>
              <li className="flex items-center gap-3"><Cpu className="w-5 h-5 text-[#00ffae]" /> 24/7 Platform Monitoring</li>
              <li className="flex items-center gap-3"><Globe className="w-5 h-5 text-[#00ffae]" /> Global Accessibility</li>
              <li className="flex items-center gap-3"><Users className="w-5 h-5 text-[#00ffae]" /> Professional Risk Management</li>
              <li className="flex items-center gap-3"><BarChart3 className="w-5 h-5 text-[#00ffae]" /> Investor Data Protection</li>
            </ul>
          </div>

          {/* FAQ Accordion */}
          <div className="col-span-1 md:col-span-1 rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-[0_0_60px_rgba(16,185,129,0.04)] backdrop-blur-2xl">
            <p className="text-sm uppercase tracking-[0.35em] text-[#00ffae]/80">FAQ</p>
            <h3 className="mt-3 text-xl font-black text-white">Common Questions</h3>
            <FAQAccordion />
          </div>
        </div>
      </section>

      {/* Global Presence & CTA */}
      <section className="relative z-10 px-6 pb-12">
        <div className="max-w-7xl mx-auto grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-[0_0_60px_rgba(16,185,129,0.04)] backdrop-blur-2xl">
              <p className="text-sm uppercase tracking-[0.35em] text-[#00ffae]/80">Global Presence</p>
              <h3 className="mt-3 text-xl font-black text-white">Worldwide Reach</h3>
              <div className="mt-6 grid grid-cols-2 gap-4 text-white">
                <div className="rounded-[18px] bg-white/6 p-4">
                  <p className="text-xs text-zinc-400">Active Investors</p>
                  <p className="mt-2 text-2xl font-black">{companyMetrics.activeInvestorsLabel}</p>
                </div>
                <div className="rounded-[18px] bg-white/6 p-4">
                  <p className="text-xs text-zinc-400">Countries Served</p>
                  <p className="mt-2 text-2xl font-black">{companyMetrics.countriesServedLabel}</p>
                </div>
                <div className="rounded-[18px] bg-white/6 p-4">
                  <p className="text-xs text-zinc-400">Company Employees</p>
                  <p className="mt-2 text-2xl font-black">{companyMetrics.companyEmployeesLabel}</p>
                </div>
                <div className="rounded-[18px] bg-white/6 p-4">
                  <p className="text-xs text-zinc-400">Total Trades Executed</p>
                  <p className="mt-2 text-2xl font-black">{companyMetrics.totalTradesExecutedLabel}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-8 shadow-[0_0_60px_rgba(16,185,129,0.04)] backdrop-blur-2xl flex flex-col justify-center">
              <h3 className="text-2xl font-black text-white">START BUILDING YOUR FINANCIAL FUTURE TODAY</h3>
              <p className="mt-4 text-zinc-400">Join a growing community of forward-thinking individuals leveraging intelligent technology, innovative financial solutions, and long-term growth opportunities.</p>
              <div className="mt-6 flex gap-3">
                <Link href="/signup" className="h-12 rounded-2xl bg-gradient-to-r from-[#00ffae] via-[#00e5ff] to-[#10f2c1] px-6 text-sm font-bold text-black shadow-[0_0_28px_rgba(0,255,174,0.25)]">Create Account</Link>
                <Link href="#pricing" className="h-12 rounded-2xl border border-white/10 px-6 text-sm font-bold text-white">Explore Plans</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div id="mission" className="absolute -top-24" />
      <div id="vision" className="absolute -top-24" />

      <section className="relative z-10 px-6 pb-28" id="reviews">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <p className="text-sm uppercase tracking-[0.35em] text-[#00ffae]/80">Investor Reviews</p>
          <h2 className="mt-4 text-4xl md:text-5xl font-black text-white tracking-normal leading-tight">
            Trusted by Global Investors Worldwide
          </h2>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.name}
              name={review.name}
              location={review.location}
              flag={review.flag}
              text={review.text}
            />
          ))}
        </div>
      </section>

      {/* Company Presentation PDF Download - inserted below client reviews, above footer */}
      <section className="relative z-10 px-6 pb-12">
        <div className="max-w-[900px] mx-auto">
          <div className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-2xl p-6 md:p-8 shadow-[0_0_60px_rgba(0,255,174,0.08)]">
            <div className="grid gap-6 md:grid-cols-2 items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-[#00ffae]/80">Investor Resources</p>
                <h3 className="mt-3 text-2xl md:text-3xl font-black text-white">Download Our Complete Investment Presentation</h3>
                <p className="mt-3 text-zinc-400">Everything you need to understand our investment plans, ROI structure, security framework, growth strategy, and investor opportunities in one professional document.</p>

                <p className="mt-4 text-zinc-300">Review our complete company presentation before investing. Explore detailed plan information, investment projections, platform benefits, and long-term growth opportunities designed for global investors.</p>

                <ul className="mt-4 space-y-2 text-zinc-300">
                  <li className="flex items-start gap-3"><span className="text-[#00ffae]">✓</span> Complete Investment Plan Breakdown</li>
                  <li className="flex items-start gap-3"><span className="text-[#00ffae]">✓</span> ROI & Profit Structure Overview</li>
                  <li className="flex items-start gap-3"><span className="text-[#00ffae]">✓</span> Platform Features & Security Details</li>
                  <li className="flex items-start gap-3"><span className="text-[#00ffae]">✓</span> Long-Term Growth Strategy</li>
                  <li className="flex items-start gap-3"><span className="text-[#00ffae]">✓</span> Investor Benefits & Opportunities</li>
                </ul>
              </div>

              <div className="flex flex-col items-stretch gap-4">
                <div className="rounded-[20px] border border-white/8 bg-white/6 p-4">
                  <p className="text-sm text-zinc-400">Presentation Plan PDF</p>
                  <p className="mt-1 font-bold text-white">Professional Investor Presentation</p>
                  <p className="mt-2 text-sm text-zinc-400">Updated Investment Plans & ROI Structure</p>
                </div>

                <a href="/pdf/Apex-Multiplier-Presentation.pdf" download className="mt-2 inline-flex items-center justify-center gap-3 h-14 rounded-2xl bg-gradient-to-r from-[#00ffae] via-[#00e5ff] to-[#10f2c1] text-sm font-bold text-black shadow-[0_0_28px_rgba(0,255,174,0.25)] hover:scale-[1.02] transition-transform">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M12 3v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 9l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 21H3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Download PDF
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 px-6 pb-10">
        <div className="max-w-7xl mx-auto rounded-[32px] border border-[rgba(0,255,174,0.2)] bg-white/5 backdrop-blur-2xl overflow-hidden shadow-[0_0_60px_rgba(0,255,174,0.12),inset_0_0_20px_rgba(255,255,255,0.03)] p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-black text-white">
                Apex <span className="text-[#00ffae]">Multiplier</span>
              </h3>
              <p className="text-zinc-400 mt-2">Premium futuristic AI trading ecosystem.</p>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-zinc-400 justify-center md:justify-end">
              <a href="/privacy" className="hover:text-white transition">Privacy</a>
              <a href="/terms" className="hover:text-white transition">Terms</a>
              <a href="/support" className="hover:text-white transition">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
