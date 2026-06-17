"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { usePlans } from "@/lib/plans"

import {
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts"

import {
  Bell,
  Wallet,
  Crown,
  TrendingUp,
  ShieldCheck,
  Bot,
  CalendarDays,
  Activity,
  Gem,
  Clock3,
  User,
} from "lucide-react"

import { Award, Sparkles, Star } from "lucide-react"

const planThemes: any = {
  Starter: {
    icon: Award,
    accent: "text-amber-300",
    cardGlow: "shadow-[0_35px_110px_rgba(220,146,64,0.18)]",
    border: "border-amber-300/20",
    iconBg: "bg-amber-300/12",
    iconBorder: "border-amber-300/20",
    textAccent: "text-amber-200",
  },
  Silver: {
    icon: ShieldCheck,
    accent: "text-slate-200",
    cardGlow: "shadow-[0_35px_90px_rgba(226,232,240,0.12)]",
    border: "border-slate-300/20",
    iconBg: "bg-slate-100/12",
    iconBorder: "border-slate-300/20",
    textAccent: "text-slate-200",
  },
  Premium: {
    icon: Sparkles,
    accent: "text-violet-300",
    cardGlow: "shadow-[0_35px_110px_rgba(139,92,246,0.22)]",
    border: "border-violet-400/25",
    iconBg: "bg-violet-500/15",
    iconBorder: "border-violet-400/20",
    textAccent: "text-violet-200",
  },
  Gold: {
    icon: Star,
    accent: "text-amber-300",
    cardGlow: "shadow-[0_35px_110px_rgba(245,158,11,0.20)]",
    border: "border-amber-300/20",
    iconBg: "bg-amber-300/15",
    iconBorder: "border-amber-300/20",
    textAccent: "text-amber-200",
  },
  "Elite Infinity": {
    icon: Crown,
    accent: "text-sky-300",
    cardGlow: "shadow-[0_35px_110px_rgba(56,189,248,0.20)]",
    border: "border-sky-400/25",
    iconBg: "bg-sky-500/15",
    iconBorder: "border-sky-400/20",
    textAccent: "text-sky-200",
  },
}

function getPlanTheme(planName: string) {
  if (!planName) return planThemes.Premium
  const key = Object.keys(planThemes).find((k) => planName.toLowerCase().includes(k.toLowerCase()))
  return (key && planThemes[key]) || planThemes.Premium
}
function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`relative overflow-hidden rounded-[30px] glass-panel ${className}`}
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(0,245,176,0.18)',
        boxShadow: '0 0 40px rgba(0,245,176,0.15)',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent" />

      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  )
}

function planColorClass(planName: string) {
  const name = (planName || "").toLowerCase()
  if (name.includes("silver")) return "text-slate-300"
  if (name.includes("premium")) return "text-amber-400"
  if (name.includes("gold")) return "text-yellow-400"
  if (name.includes("vip")) return "text-fuchsia-400"
  if (name.includes("elite")) return "text-cyan-400"
  if (name.includes("starter")) return "text-emerald-400"
  return "text-emerald-400"
}

function planConfig(planName: string, amount: number) {
  const key = (planName || "").toLowerCase()
  if (key.includes("starter")) return { roi: 8, duration: 30 }
  if (key.includes("silver")) return { roi: 9, duration: 30 }
  if (key.includes("premium")) return { roi: 10, duration: 30 }
  if (key.includes("gold")) return { roi: 12, duration: 30 }
  if (key.includes("elite")) return { roi: 14, duration: 30 }
  if (amount >= 10000) return { roi: 14, duration: 30 }
  if (amount >= 5000) return { roi: 12, duration: 30 }
  if (amount >= 2500) return { roi: 10, duration: 30 }
  if (amount >= 1000) return { roi: 9, duration: 30 }
  return { roi: 8, duration: 30 }
}

function generateShortId(id: string) {
  return id
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 6)
    .toUpperCase()
    .padEnd(6, "X")
}

export default function DashboardPage() {
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState("")
  const [timeLeft, setTimeLeft] = useState("")
  const [withdrawEnabled, setWithdrawEnabled] = useState(false)

  const [walletBalance, setWalletBalance] = useState(0)
  const [planDetails, setPlanDetails] = useState<PlanDetail[]>([])
  const [totalProfit, setTotalProfit] = useState(0)
  const [totalLoss] = useState(0)
  const [roi, setRoi] = useState(0)
  const [dailyProfitValue, setDailyProfitValue] = useState(0)
  const [withdrawableProfit, setWithdrawableProfit] = useState(0)

  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [userId, setUserId] = useState("")
  const [uniqueId, setUniqueId] = useState("")
  const [activePlan, setActivePlan] = useState("No Active Plan")
  const [selectedPlan, setSelectedPlan] = useState("No Plan")
  const [depositAmount, setDepositAmount] = useState(0)
  const [depositStatus, setDepositStatus] = useState("No Deposit")
  const [verificationStatus, setVerificationStatus] = useState("Inactive")
  const [daysCompleted, setDaysCompleted] = useState(0)
  const [durationDays, setDurationDays] = useState(30)
  const [remainingDays, setRemainingDays] = useState(0)
  const [progressPercent, setProgressPercent] = useState(0)
  const [expectedDailyProfit, setExpectedDailyProfit] = useState(0)
  const [expectedTotalProfit, setExpectedTotalProfit] = useState(0)
  const [unlockDate, setUnlockDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const { plans: availablePlans } = usePlans()

  // Notifications state for dashboard header
  const [notifications, setNotifications] = useState<Array<{id:number; type:string; title:string; message:string; time:string; read:boolean;}>>([])
  const [showNotifications, setShowNotifications] = useState(false)

  const [transactions, setTransactions] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [totalDays, setTotalDays] = useState(0)
  const [totalBonus, setTotalBonus] = useState(0)
  const [tradesPerDay, setTradesPerDay] = useState(0)
  const [portfolioValue, setPortfolioValue] = useState(0)

  useEffect(() => {
    loadDashboard()

    const clock = setInterval(() => {
      setCurrentTime(new Date().toLocaleString())
    }, 1000)

    return () => clearInterval(clock)
  }, [])

  // subscribe to deposit changes so dashboard updates instantly after admin actions
  useEffect(() => {
    let channel: any = null
    async function setup() {
      try {
        channel = supabase
          .channel('public:deposits')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, () => {
            loadDashboard()
          })
          .subscribe()
      } catch (e) {
        console.warn('Failed to subscribe to deposits changes', e)
      }
    }
    setup()
    return () => {
      if (channel && typeof channel.unsubscribe === 'function') channel.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!unlockDate) {
      return
    }

    const updateCountdown = () => {
      const now = new Date()
      const difference = unlockDate.getTime() - now.getTime()

      if (difference <= 0) {
        setWithdrawEnabled(true)
        setTimeLeft("Withdrawal Available")
        return
      }

      setWithdrawEnabled(false)
      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((difference / (1000 * 60)) % 60)
      const seconds = Math.floor((difference / 1000) % 60)

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [unlockDate])

  const loadDashboard = async (): Promise<void> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.log("No user logged in")
        setLoading(false)
        return
      }

      setUserEmail(user.email || "")
      setUserId(user.id)
      const storedFull = typeof window !== "undefined" ? sessionStorage.getItem("apex_full_name") : null
      setUserName(
        storedFull || user.user_metadata?.full_name || user.email || "Investor"
      )

      const { data: profileData } = await supabase
        .from("users")
        .select("*")
        .eq("email", user.email)
        .single()

      if (profileData) {
        const storedFull2 = typeof window !== "undefined" ? sessionStorage.getItem("apex_full_name") : null
        setUserName(
          storedFull2 || profileData.full_name || user.user_metadata?.full_name || user.email || "Investor"
        )
        setUniqueId(
          profileData.unique_id || generateShortId(user.id)
        )
      } else {
        setUniqueId(generateShortId(user.id))
      }

      const [{ data: deposits }, { data: plans }, { data: withdrawals }]: any = await Promise.all<any>([
        supabase
          .from("deposits")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("user_plans")
          .select("*")
          .ilike("user_email", user.email)
          .order("created_at", { ascending: true }),
        supabase
          .from("withdrawals")
          .select("*")
          .eq("email", user.email)
          .order("created_at", { ascending: true }),
      ])

      console.log("USER ID", user.id)
      console.log("USER EMAIL", user.email)
      console.log("DEPOSITS (by user_id query)", deposits)
      console.log("USER_PLANS", plans)

      let plansData: any[] = plans || []

      // Resolve deposits: if none found by user_id, try by email
      let depositsResolved: any[] = deposits || []
      if ((!depositsResolved || depositsResolved.length === 0) && user.email) {
        try {
            const { data: depositsByEmail } = await supabase
            .from('deposits')
            .select('*')
            .eq('email', user.email)
            .order('created_at', { ascending: true })
          if (depositsByEmail && depositsByEmail.length > 0) {
            depositsResolved = depositsByEmail
            console.log('DEPOSITS (by email query)', depositsResolved)
          }
        } catch (e) {
          // ignore
        }
      }

      // Use `user_plans` (plansData) as the primary source for active/approved plans.
      // Accept both 'active' and 'approved' statuses to ensure plans created
      // by different flows are all considered.
      console.log('Dashboard current user email', user.email)
      let activePlans: any[] = (plansData || []).filter((item: any) => {
        const s = String(item.status || '').toLowerCase()
        return s === 'active' || s === 'approved'
      })

      // Do NOT set planDetails from `user_plans` here — dashboard must be
      // built from approved deposits only to ensure one card per deposit.

      // Also fetch ALL approved deposits for this user (oldest first). We'll merge with user_plans so
      // every approved deposit remains visible as a plan in chronological order.
      let approvedDeposits: any[] = []
      try {
        // Try fetching approved deposits by user_id first
        let approvedRows: any = null
        let approvedErr: any = null
        try {
          const res = await supabase
            .from('deposits')
            .select('*')
            .eq('user_id', user.id)
            .ilike('status', '%approved%')
            .order('created_at', { ascending: true })
          approvedRows = res.data
          approvedErr = res.error
        } catch (inner) {
          approvedRows = null
          approvedErr = inner
        }

        // If none found by user_id, try by email field
        if ((!approvedRows || approvedRows.length === 0)) {
          try {
            const res2 = await supabase
              .from('deposits')
              .select('*')
              .eq('email', user.email)
              .ilike('status', '%approved%')
              .order('created_at', { ascending: true })
            if (res2.data && res2.data.length > 0) {
              approvedRows = res2.data
              approvedErr = res2.error
            }
          } catch (inner2) {
            // ignore
          }
        }

        console.log('USER ID:', user?.id)
        console.log('deposits (raw) user_ids:', (deposits || []).map((d: any) => d.user_id))
        console.log('ERROR (approvedRows query):', approvedErr)
        console.log('APPROVED ROWS RAW:', approvedRows)

        if (approvedErr) {
          console.warn('Failed to fetch approved deposits', approvedErr)
          approvedDeposits = []
        } else if (approvedRows && approvedRows.length > 0) {
          approvedDeposits = approvedRows
          console.log('Approved deposits count', approvedRows.length)
        } else {
          approvedDeposits = []
          console.log('No approved deposits returned for user', user?.id)
        }

        // Debug: show deposit user_ids for verification
        try {
          console.log('Deposit User IDs:', (approvedRows || []).map((x: any) => x.user_id))
        } catch (inner) {
          // ignore
        }

        // DO NOT set planDetails here (debug fallback removed) — planDetails will be set from computedPlanDetails below
        console.log('APPROVED DEPOSITS', approvedDeposits)
      } catch (e) {
        console.warn('Error fetching approved deposits', e)
        approvedDeposits = []
      }

      // NOTE: do NOT merge approvedDeposits into activePlans here — `user_plans`
      // is the canonical source. We still fetched approvedDeposits earlier for
      // diagnostics, but dashboard rendering and totals are derived from
      // `activePlans` (from `user_plans`).

      const latestDeposit = (depositsResolved && depositsResolved[0]) || null

      // If there's an approved deposit but no active plan, create one automatically.
      if (latestDeposit && String(latestDeposit.status || '').toLowerCase().includes('approved') && (activePlans.length === 0)) {
        try {
          const amt = Number(latestDeposit.amount || 0)
          // derive plan name from deposit.plan_name or amount
          let planName = (latestDeposit.plan_name || '').toString() || ''
          if (!planName) {
            if (amt >= 10000) planName = 'ELITE INFINITY'
            else if (amt >= 5000) planName = 'GOLD'
            else if (amt >= 2500) planName = 'PREMIUM'
            else if (amt >= 1000) planName = 'SILVER'
            else planName = 'STARTER'
          }

          // roi mapping
          let roi = 8
          if (amt >= 10000) roi = 14
          else if (amt >= 5000) roi = 12
          else if (amt >= 2500) roi = 10
          else if (amt >= 1000) roi = 9
          else roi = 8

          const monthlyProfit = (amt * roi) / 100
          const dailyProfit = monthlyProfit / 30

          // create plan server-side via admin endpoint to respect RLS
          try {
            if (latestDeposit?.id) {
              await fetch('/api/admin/approve-deposit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: latestDeposit.id, status: 'approved' }),
              })

              // refresh plans variable
              const { data: refreshedPlans } = await supabase.from('user_plans').select('*').ilike('user_email', user.email).order('created_at', { ascending: true })
              if (refreshedPlans) {
                plansData = refreshedPlans || []
                // recompute activePlans after refresh
                activePlans = plansData?.filter((item: any) => item.status === 'active') || []
              }
            }
          } catch (e) {
            console.warn('Failed to request server plan creation', e)
          }
        } catch (e) {
          console.error('Failed to auto-create user plan for approved deposit', e)
        }
      }

      // Build enriched plan details from ALL approved deposits (primary source).
      // This ensures one dashboard card per approved deposit (oldest -> newest).
      const approvedOnly = (approvedDeposits || []).filter((d: any) => String(d.status || '').toLowerCase() === 'approved')
      let computedPlanDetails: PlanDetail[] = (approvedOnly || []).map((item: any) => {
        const amountValue = Number(item.amount || 0)
        // try to find plan definition from investment_plans
        const found = (availablePlans || []).find((p: any) => ((p.title || '').toLowerCase() === (item.plan_name || '').toLowerCase()) || ((p.raw?.plan_name || '').toLowerCase() === (item.plan_name || '').toLowerCase()))
        const config = found ? { roi: Number(found.raw?.roi_percentage ?? found.raw?.roi_percent ?? found.raw?.monthly_profit ?? 0), duration: Number(found.raw?.duration_days ?? found.raw?.duration ?? 30) } : planConfig(item.plan_name || "", amountValue)

        // Compute totalROI and dailyProfit per requirements
        const roiPercent = Number(config.roi || 0)
        const duration = Number(config.duration || 30)
        // total ROI amount
        const totalProfitForPlan = Number(((amountValue * roiPercent) / 100).toFixed(2))
        // daily profit must be totalROI / 30
        const dailyProfit = Number((totalProfitForPlan / 30).toFixed(2))

        // days passed since deposit created_at (never negative)
        const daysPassed = Math.max(0, Math.floor((Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24)))
        // current profit accumulates daily
        let earnedForItem = Number((dailyProfit * daysPassed).toFixed(2))
        // do not exceed total ROI
        if (earnedForItem > totalProfitForPlan) earnedForItem = totalProfitForPlan

        const start = item.created_at ? new Date(item.created_at) : new Date()

        return {
          ...item,
          amountValue,
          planRoi: roiPercent,
          planDuration: duration,
          dailyProfit,
          total_profit: totalProfitForPlan,
          start,
          daysElapsedForItem: daysPassed,
          completedDaysForItem: Math.min(daysPassed, duration),
          earnedForItem,
        }
      })

      // Ensure chronological order: oldest first
      computedPlanDetails.sort((a: any, b: any) => new Date(a.created_at || a.start).getTime() - new Date(b.created_at || b.start).getTime())

      // Debug logs for verification
      try {
        console.log('activePlans', activePlans)
        console.log('approvedDeposits', approvedDeposits)
        console.log('computedPlanDetails (before fallback)', computedPlanDetails)
      } catch (e) {
        // ignore logging errors
      }

      // Fallback: if we have approved deposits but no active/user_plans representation,
      // build plan details directly from approvedDeposits so the dashboard is never empty.
      if ((computedPlanDetails || []).length === 0 && (approvedDeposits || []).length > 0) {
        computedPlanDetails = (approvedDeposits || []).map((item: any) => {
          const amountValue = Number(item.amount || 0)
          const found = (availablePlans || []).find((p: any) => ((p.title || '').toLowerCase() === (item.plan_name || '').toLowerCase()) || ((p.raw?.plan_name || '').toLowerCase() === (item.plan_name || '').toLowerCase()))
          const config = found ? { roi: Number(found.raw?.roi_percentage ?? found.raw?.roi_percent ?? found.raw?.monthly_profit ?? 0), duration: Number(found.raw?.duration_days ?? found.raw?.duration ?? 30) } : planConfig(item.plan_name || "", amountValue)

          const roiPercent = Number(config.roi || 0)
          const duration = Number(config.duration || 30)
          const totalProfitForPlan = Number(((amountValue * roiPercent) / 100).toFixed(2))
          let dailyProfit = Number(item.daily_profit ?? (found?.raw?.daily_profit ?? 0))
          if (!dailyProfit || dailyProfit <= 0) {
            dailyProfit = Number((totalProfitForPlan / Math.max(duration, 1)).toFixed(2))
          }

          const start = item.created_at ? new Date(item.created_at) : new Date()
          let daysElapsedForItem = Math.floor((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
          if (daysElapsedForItem < 0) daysElapsedForItem = 0
          const completedDaysForItem = Math.min(daysElapsedForItem, duration)
          let earnedForItem = Number((dailyProfit * completedDaysForItem).toFixed(2))
          if (earnedForItem > totalProfitForPlan) earnedForItem = totalProfitForPlan

          return {
            ...item,
            amountValue,
            planRoi: roiPercent,
            planDuration: duration,
            dailyProfit,
            total_profit: totalProfitForPlan,
            start,
            daysElapsedForItem,
            completedDaysForItem,
            earnedForItem,
          }
        })

        // sort oldest-first
        computedPlanDetails.sort((a: any, b: any) => new Date(a.created_at || a.start).getTime() - new Date(b.created_at || b.start).getTime())

        console.log('computedPlanDetails (from approvedDeposits fallback)', computedPlanDetails)
      }

      try {
        console.log('PLAN DETAILS', computedPlanDetails)
        console.log('PLAN OBJECT', computedPlanDetails && computedPlanDetails[0])
        console.log('DEPOSITS', depositsResolved)
        console.log('USER_PLANS', plansData)
        console.log('activePlans', activePlans)
        console.log('plansData', plansData)
        console.log('computedPlanDetails', computedPlanDetails)
      } catch (e) {}

      // Ensure we always have a fallback: prefer computedPlanDetails (from approved deposits),
      // otherwise fall back to activePlans (from user_plans). This prevents hiding plans
      // when profit computation didn't produce any items.
      const plansForView = (computedPlanDetails && computedPlanDetails.length > 0) ? computedPlanDetails : (activePlans || [])

      // Persist selected plan list for rendering (restore previous behavior if needed)
      try {
        setPlanDetails(plansForView)
      } catch (e) {
        console.warn('Failed to set planDetails fallback', e)
      }

      // Totals and aggregates must be computed from the selected plansForView.
      const totalDepositSum = (plansForView || []).reduce((sum, item) => sum + Number(item.amountValue || item.investment || item.amount || 0), 0)

      const dailyProfitSum = (plansForView || []).reduce((sum, item) => sum + Number(item.dailyProfit || item.daily_profit || 0), 0)

      const totalEarned = (plansForView || []).reduce((sum, item) => sum + Number(item.earnedForItem || 0), 0)

      const totalTradesPerDay = (plansForView || []).reduce((sum, item) => {
        const amountValue = Number(item.amountValue || item.investment || item.amount || 0)
        if (amountValue >= 10000) return sum + 10
        if (amountValue >= 5000) return sum + 5
        if (amountValue >= 3000) return sum + 3
        if (amountValue >= 1000) return sum + 2
        if (amountValue >= 500) return sum + 1
        return sum
      }, 0)

      const totalDaysElapsed = (plansForView || []).reduce((max, item) => Math.max(max, item.daysElapsedForItem || 0), 0)

      let totalBonusAmount = 0
      try {
        const { data: bonuses } = await supabase
          .from("bonuses")
          .select("amount")
          .eq("user_id", user.id)

        if (bonuses) {
          totalBonusAmount = bonuses.reduce((s: number, b: any) => s + Number(b.amount || 0), 0)
        }
      } catch (e) {
        totalBonusAmount = 0
      }

      const totalWithdrawAmount =
        withdrawals?.reduce((sum, item) => {
          if (item.status === "rejected") return sum
          return sum + Number(item.amount || 0)
        }, 0) || 0

      // Per requirements: Withdrawable Profit = sum(current profits)
      const withdrawable = Number(totalEarned || 0)
      // Portfolio Value = sum of all investments
      const portfolioVal = Number(totalDepositSum || 0)

      // Average ROI across visible plans
      const avgRoi = (plansForView && plansForView.length > 0) ? Math.round((plansForView.reduce((s: number, p: any) => s + Number(p.planRoi || p.roi || 0), 0) / plansForView.length)) : 0

      const currentActivePlan = (plansForView && plansForView.length > 0) ? plansForView[0] : null
      const selectedPlanName = currentActivePlan?.plan_name || latestDeposit?.plan_name || "Starter"
      const selectedAmountValue = Number(currentActivePlan?.amountValue || currentActivePlan?.investment || currentActivePlan?.amount || latestDeposit?.amount || 0)
      // try to get plan details from investment_plans
      const selectedFound = (availablePlans || []).find((p: any) => ((p.title || '').toLowerCase() === (selectedPlanName || '').toLowerCase()) || ((p.raw?.plan_name || '').toLowerCase() === (selectedPlanName || '').toLowerCase()))
      const selectedPlanRoi = currentActivePlan?.planRoi || (selectedFound ? Number(selectedFound.raw?.roi_percentage ?? selectedFound.raw?.monthly_profit ?? 0) : planConfig(selectedPlanName, selectedAmountValue).roi)
      const selectedDuration = currentActivePlan?.planDuration || (selectedFound ? Number(selectedFound.raw?.duration_days ?? selectedFound.raw?.duration ?? 30) : planConfig(selectedPlanName, selectedAmountValue).duration)
      const selectedDaily = currentActivePlan?.dailyProfit || currentActivePlan?.daily_profit || Number(((selectedAmountValue * selectedPlanRoi) / 100 / selectedDuration).toFixed(2))
      const selectedTotal = Number((selectedDaily * selectedDuration).toFixed(2))

      setTotalDays(totalDaysElapsed)
      setTotalBonus(totalBonusAmount)
      setTradesPerDay(totalTradesPerDay)

      setSelectedPlan(selectedPlanName)
      setDepositAmount(selectedAmountValue)
      setDepositStatus(latestDeposit?.status || (activePlans.length > 0 ? "approved" : "No Deposit"))
      setVerificationStatus(
        latestDeposit?.status === "approved" || activePlans.length > 0
          ? "Verified"
          : latestDeposit?.status === "pending"
          ? "Pending"
          : "Inactive"
      )
      setDurationDays(selectedDuration)
      setExpectedDailyProfit(selectedDaily)
      setExpectedTotalProfit(selectedTotal)
      setDaysCompleted(currentActivePlan?.completedDaysForItem || 0)
      setRemainingDays(currentActivePlan ? Math.max(currentActivePlan.planDuration - currentActivePlan.completedDaysForItem, 0) : selectedDuration)
      setProgressPercent(currentActivePlan ? Math.round(((currentActivePlan.completedDaysForItem || 0) / selectedDuration) * 100) : 0)
      setActivePlan(currentActivePlan?.plan_name || "No Active Plan")

      // Derive email verification status from the email_verification_requests table
      try {
        const { data: evData } = await supabase
          .from("verification_requests")
          .select("*")
          .eq("email", user.email)
          .order("id", { ascending: false })
          .limit(1)

        const latestEv = (evData && evData[0]) || null
        let verStatus = "Not Verified"
        if (latestEv) {
          const s = (latestEv.status || "").toLowerCase()
          if (s === "pending") verStatus = "Pending"
          else if (s === "verified" || s === "approved") verStatus = "Verified"
          else if (s === "rejected") verStatus = "Rejected"
        }
        setVerificationStatus(verStatus)
      } catch (e) {
        // ignore and keep previous verification state
      }
      if (currentActivePlan) {
        setUnlockDate(
          new Date(new Date(currentActivePlan.start || currentActivePlan.start_date || new Date()).setDate(new Date(currentActivePlan.start || currentActivePlan.start_date || new Date()).getDate() + 20))
        )
      } else {
        setUnlockDate(null)
        setTimeLeft("No active approved deposit")
        setWithdrawEnabled(false)
      }

      setPortfolioValue(portfolioVal)
      // persist computed plan details to state for rendering — only overwrite
      // if we have computed/enriched details; otherwise keep the earlier
      // `activePlans` value to avoid emptying the dashboard.
      if (computedPlanDetails && computedPlanDetails.length > 0) {
        setPlanDetails(computedPlanDetails)
      }
      setWalletBalance(totalDepositSum)
      setTotalProfit(totalEarned)
      setDailyProfitValue(dailyProfitSum || selectedDaily)
      setRoi(avgRoi || selectedPlanRoi)
      setWithdrawableProfit(withdrawable)

      console.log('transactions source counts: deposits=', (depositsResolved || []).length, 'withdrawals=', (withdrawals || []).length)
      const txs: any[] = []

      ;(depositsResolved || []).forEach((item: any) => {
        txs.push({
          type: "Deposit",
          amount: `+$${item.amount}`,
          status: item.status,
          method: item.network || "USDT (TRC20)",
          date: new Date(item.created_at).toLocaleString(),
          color: "text-emerald-400",
        })
      })

      ;(withdrawals || []).forEach((item: any) => {
        txs.push({
          type: "Withdraw",
          amount: `-$${item.amount}`,
          status: item.status,
          method: item.network || "Wallet",
          date: new Date(item.created_at).toLocaleString(),
          color: "text-red-400",
        })
      })

      const { data: bonusRecords } = await supabase
        .from("bonuses")
        .select("amount, created_at")
        .eq("user_id", user.id)

      if (bonusRecords) {
        bonusRecords.forEach((bonus: any) => {
          txs.push({
            type: "Bonus",
            amount: `+$${Number(bonus.amount || 0).toFixed(2)}`,
            status: "Completed",
            method: "Admin Bonus",
            date: new Date(bonus.created_at).toLocaleString(),
            color: "text-yellow-400",
          })
        })
      }

      // Inject generated daily profit transactions for each plan (one per completed day).
      // Each profit entry: type=Profit, status=Completed, method=Daily ROI, date=generated day.
      try {
        const profitTxs: any[] = []
        ;(plansForView || []).forEach((plan: any) => {
          const daily = Number(plan.dailyProfit || plan.daily_profit || 0)
          const days = Number(plan.completedDaysForItem || 0)
          const startDate = plan.start ? new Date(plan.start) : null
          for (let i = 1; i <= days; i++) {
            // date for this profit entry: startDate + i days
            const d = startDate ? new Date(startDate) : new Date()
            d.setDate(d.getDate() + i)
            profitTxs.push({
              type: "Profit",
              amount: `+$${Number(daily).toFixed(2)}`,
              status: "Completed",
              method: "Daily ROI",
              date: d.toLocaleString(),
              color: "text-emerald-400",
              plan_name: plan.plan_name || "",
            })
          }
        })

        // add profit transactions so they appear together with deposits; we'll sort later
        profitTxs.forEach((p) => txs.push(p))
      } catch (e) {
        console.warn('Failed to generate profit transactions', e)
      }

      // Transaction history MUST be raw deposits and withdrawals (plus bonuses).
      // Do NOT inject generated Daily ROI entries here — keep history strictly
      // from recorded transactions.

      txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setTransactions(txs)

      setChartData([
        {
          day: "Mon",
          profit: totalEarned * 0.1,
          loss: 0,
        },
        {
          day: "Tue",
          profit: totalEarned * 0.2,
          loss: 0,
        },
        {
          day: "Wed",
          profit: totalEarned * 0.35,
          loss: 0,
        },
        {
          day: "Thu",
          profit: totalEarned * 0.5,
          loss: 0,
        },
        {
          day: "Fri",
          profit: totalEarned * 0.7,
          loss: 0,
        },
        {
          day: "Sat",
          profit: totalEarned * 0.9,
          loss: 0,
        },
        {
          day: "Sun",
          profit: totalEarned,
          loss: 0,
        },
      ])
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  // load notifications
    useEffect(() => {
      let mounted = true
      async function loadNotifications() {
        try {
          const { data: authData } = await supabase.auth.getUser()
          const currentUser = authData?.user ?? null
          if (!currentUser) return
          // load notifications for this user (including broadcasts where user_id = null)
          const { data } = await supabase
            .from('notifications')
            .select('*')
            .or(`user_id.eq.${currentUser.id},user_id.is.null`)
            .order('created_at', { ascending: false })

          if (!mounted) return
          setNotifications((data || []).map((n: any) => ({ id: n.id, type: n.type || 'info', title: n.title, message: n.message, time: n.created_at ? new Date(n.created_at).toLocaleString() : '', read: !!n.read })))
        } catch (err) {
          console.error('Failed to load notifications', err)
        }
      }
      loadNotifications()
      const channel = supabase
        .channel('public:notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => loadNotifications())
        .subscribe()

      return () => { mounted = false; channel.unsubscribe && channel.unsubscribe() }
    }, [])

    const markAllRead = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser()
        const currentUser = authData?.user ?? null
        if (!currentUser) return
        await supabase.from('notifications').update({ read: true }).eq('user_id', currentUser.id).eq('read', false)
        setNotifications((prev) => prev.map((p) => ({ ...p, read: true })))
      } catch (err) {
        console.error('Failed to mark all read', err)
      }
    }

    const markRead = async (id: number) => {
      try {
        await supabase.from('notifications').update({ read: true }).eq('id', id)
        setNotifications((prev) => prev.map((p) => p.id === id ? { ...p, read: true } : p))
      } catch (err) {
        console.error('Failed to mark read', err)
      }
    }

  const overviewData = [
    {
      name: "Profit",
      value: totalProfit,
    },
    {
      name: "Loss",
      value: totalLoss,
    },
    {
      name: "Bonus",
      value: totalBonus,
    },
  ]

  return (
    <div className="min-h-screen text-white overflow-hidden" style={{background: 'linear-gradient(180deg, #050816 0%, #07111D 30%, #06171B 60%, #050816 100%)'}}>
      <div className="glow-orb" style={{width: 260, height: 260, background: 'radial-gradient(circle,#00F5B0 0%, transparent 40%)', top: '8%', left: '4%'}} />
      <div className="glow-orb" style={{width: 320, height: 320, background: 'radial-gradient(circle,#00D084 0%, transparent 35%)', bottom: '6%', right: '6%'}} />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.15),transparent_40%)]" />

      <div className="relative z-10 p-3 sm:p-4 md:p-6 lg:p-8">

        {/* HEADER */}

        <div className="flex flex-col lg:flex-row justify-between gap-4 sm:gap-5 items-start lg:items-center mb-6 sm:mb-8">

          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight">
              APEX{" "}
              <span className="text-emerald-400 drop-shadow-[0_0_15px_#10b981]">
                MULTIPLIER
              </span>
            </h1>

            <p className="text-zinc-400 mt-2 text-sm sm:text-base">
              Premium AI Trading Dashboard
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 w-full lg:w-auto flex-wrap justify-end lg:justify-end self-end">
            <div className="flex flex-col items-end gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications((s) => !s)}
                    aria-label="Notifications"
                    className="w-9 h-9 sm:w-12 sm:h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0"
                  >
                    <Bell size={20} style={{color: 'var(--primary-emerald-1)', filter: 'drop-shadow(0 6px 18px rgba(0,245,176,0.12))'}} />
                  </button>
                  {notifications.filter((n) => !n.read).length > 0 ? (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] sm:px-2 sm:text-[10px] font-bold rounded-full bg-amber-500 text-black shadow-[0_0_8px_rgba(255,200,60,0.14)]">
                      {notifications.filter((n) => !n.read).length}
                    </span>
                  ) : null}

                  {showNotifications ? (
                    <div className="absolute right-2 sm:right-0 mt-3 w-80 sm:w-96 max-w-[calc(100vw-32px)] max-h-80 overflow-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-50">
                      <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <h4 className="font-bold">Notifications</h4>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => markAllRead()}
                            className="text-sm text-zinc-400 hover:text-white transition"
                          >
                            Mark all read
                          </button>
                          <button onClick={() => setShowNotifications(false)} className="text-zinc-400 hover:text-white">Close</button>
                        </div>
                      </div>
                      <div className="p-2">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-zinc-400">No notifications</div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className={`p-3 rounded-lg mb-2 ${n.read ? "opacity-60" : "bg-white/3"}`}> 
                              <button onClick={() => markRead(n.id)} className="w-full text-left">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="font-semibold">{n.title}</div>
                                    <div className="text-sm text-zinc-400 mt-1">{n.message}</div>
                                  </div>
                                  <div className="text-xs text-zinc-400 ml-4">{n.time}</div>
                                </div>
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                <Link href="/dashboard/profile" className="group min-w-0">
                  <div
                    onClick={() => {
                      try {
                        console.log('Current profile route:', window.location.pathname)
                        console.log('Target profile route:', '/dashboard/profile')
                      } catch (e) {}
                    }}
                    className="flex items-center gap-2 sm:gap-3 rounded-2xl px-2 sm:px-3 py-1.5 sm:py-2 bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_0_20px_rgba(0,255,174,0.06)]"
                  >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <User className="text-emerald-400 scale-90 sm:scale-100" size={16} />
                    </div>
                    <div className="min-w-0 text-right">
                      <div className="text-sm font-bold leading-tight truncate">{userName || "Investor"}</div>
                      <div className="text-[11px] sm:text-xs text-zinc-400 truncate">UID: {uniqueId || "N/A"}</div>
                    </div>
                  </div>
                </Link>
              </div>

              <Link href="/deposit/select" className="neon-btn">
                Deposit Now
              </Link>
            </div>

          </div>

        </div>

        {/* WITHDRAWABLE PROFIT CARD */}

        <div className="mt-4">
          <GlassCard className="p-5 hover:scale-105 transition-transform">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-zinc-400 text-sm">Withdrawable Profit</p>
                <h2 className="text-2xl sm:text-3xl font-black mt-3 break-words text-emerald-400">
                  ${withdrawableProfit.toFixed(2)}
                </h2>
              </div>

              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-400 opacity-20 border border-white/10 flex items-center justify-center flex-shrink-0`}>
                <Wallet className="text-white" size={24} />
              </div>
            </div>
          </GlassCard>
        </div>



        {/* ACTIVE PLANS: render one card per active plan in chronological order (first approved = top) */}
        {planDetails && planDetails.length > 0 ? (
          planDetails.map((plan, idx) => {
            const theme = getPlanTheme(plan.plan_name)
            const Icon = theme.icon
            const ordinal = (n: number) => {
              if (n === 1) return '1st'
              if (n === 2) return '2nd'
              if (n === 3) return '3rd'
              return `${n}th`
            }
            const remainingDays = Math.max((plan.planDuration || 0) - (plan.completedDaysForItem || 0), 0)
            const unlockDateForPlan = plan.start ? new Date(new Date(plan.start).setDate(new Date(plan.start).getDate() + 20)) : null
            const isUnlocked = unlockDateForPlan ? (new Date().getTime() >= unlockDateForPlan.getTime()) : false

            return (
              <GlassCard key={plan.id || idx} className={`p-4 sm:p-6 ${theme.border} bg-white/10 mb-6 ${theme.cardGlow}`}>
                <div className="flex flex-col xl:flex-row justify-between gap-4 sm:gap-6">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-zinc-400 text-sm">{ordinal(idx + 1)} Plan</div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 flex-wrap">
                      <div className={`rounded-2xl ${theme.iconBg} ${theme.iconBorder} flex items-center justify-center flex-shrink-0 w-9 h-9 sm:w-11 sm:h-11`}>
                        <Icon className={theme.accent} size={20} />
                      </div>
                      <h2 className={`text-2xl sm:text-3xl font-black ${theme.accent} break-words fin-heading neon-text`}>
                        {plan.plan_name}
                      </h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-5">
                      <div>
                        <p className="text-zinc-400 text-xs sm:text-sm">Investment</p>
                        <h3 className="text-xl sm:text-2xl font-bold mt-2">${Number(plan.amountValue || plan.investment || plan.amount || 0).toFixed(2)}</h3>
                      </div>

                      <div>
                        <p className="text-zinc-400 text-xs sm:text-sm">Daily Profit</p>
                        <h3 className="text-emerald-400 text-xl sm:text-2xl font-bold mt-2">${Number(plan.dailyProfit || plan.daily_profit || 0).toFixed(2)}/day</h3>
                      </div>

                      <div>
                        <p className="text-zinc-400 text-xs sm:text-sm">ROI</p>
                        <h3 className="text-xl sm:text-2xl font-bold mt-2">{Number(plan.planRoi || 0)}%</h3>
                      </div>

                      {/* Current Profit removed per requirements: not shown on plan card */}

                      <div>
                        <p className="text-zinc-400 text-xs sm:text-sm">Deposit Status</p>
                        <h3 className={`text-xl sm:text-2xl font-bold mt-2 ${plan.status === 'approved' ? 'text-emerald-400' : plan.status === 'pending' ? 'text-amber-300' : 'text-zinc-300'}`}>{plan.status || 'approved'}</h3>
                      </div>

                      <div>
                        <p className="text-zinc-400 text-xs sm:text-sm">Remaining Duration</p>
                        <h3 className="text-xl sm:text-2xl font-bold mt-2">{remainingDays} days</h3>
                      </div>

                      <div>
                        <p className="text-zinc-400 text-xs sm:text-sm">Withdraw Locked</p>
                        <h3 className="text-xl sm:text-2xl font-bold mt-2">
                          {isUnlocked ? 'Unlocked' : (() => {
                            if (!unlockDateForPlan) return 'Locked'
                            const now = new Date(currentTime || new Date())
                            const diff = unlockDateForPlan.getTime() - now.getTime()
                            if (diff <= 0) return 'Unlocked'
                            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
                            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
                            const minutes = Math.floor((diff / (1000 * 60)) % 60)
                            const seconds = Math.floor((diff / 1000) % 60)
                            return `${days}d ${hours}h ${minutes}m ${seconds}s`
                          })()}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center items-center self-center xl:self-auto gap-3 sm:gap-4 w-full xl:w-auto">
                    <button onClick={() => router.push('/dashboard/withdraw')} disabled={!isUnlocked} className={`px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold transition w-full xl:w-auto ${isUnlocked ? 'neon-btn' : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'}`}>
                      {isUnlocked ? 'Withdraw Now' : 'Withdraw Locked'}
                    </button>
                  </div>
                </div>
              </GlassCard>
            )
          })
        ) : null}

        {/* STATS */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

          {[
            {
              title: "Portfolio Value",
              value: `$${portfolioValue.toFixed(0)}`,
              icon: Wallet,
              color: "from-emerald-500 to-emerald-400",
            },
            {
              title: "Total Profit",
              value: `$${totalProfit.toFixed(0)}`,
              icon: TrendingUp,
              color: "from-blue-500 to-blue-400",
            },
            {
              title: "Total Bonus",
              value: `$${totalBonus.toFixed(0)}`,
              icon: Gem,
              color: "from-yellow-500 to-yellow-400",
            },
            {
              title: "Daily Profit",
              value: `$${dailyProfitValue.toFixed(2)}/day`,
              icon: Activity,
              color: "from-purple-500 to-purple-400",
            },
          ].map((item, i) => (
            <GlassCard key={i} className="p-5 hover:scale-105 transition-transform">

              <div className="flex justify-between items-start">

                <div className="flex-1">

                  <p className="text-zinc-400 text-sm">
                    {item.title}
                  </p>

                  <h2 className="text-2xl sm:text-3xl font-black mt-3 break-words">
                    {item.value}
                  </h2>

                </div>

                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${item.color} opacity-20 border border-white/10 flex items-center justify-center flex-shrink-0`}>
                  <item.icon className="text-white" size={24} />
                </div>

              </div>

            </GlassCard>
          ))}

        </div>

        {/* OVERVIEW */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-6">

          <GlassCard className="p-6 xl:col-span-2">

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">

              <h2 className="text-2xl sm:text-3xl font-bold fin-heading">
                Performance Overview
              </h2>

              <Gem className="text-yellow-400" size={32} />

            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-3xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 p-4 sm:p-5">
                <p className="text-zinc-400 text-xs sm:text-sm">Total Profit</p>
                <h3 className="mt-2 text-2xl sm:text-3xl font-black text-emerald-400">
                  ${totalProfit.toFixed(2)}
                </h3>
              </div>

              <div className="rounded-3xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 p-4 sm:p-5">
                <p className="text-zinc-400 text-xs sm:text-sm">Days Progress</p>
                <h3 className="mt-2 text-2xl sm:text-3xl font-black text-blue-400">
                  {daysCompleted}/{durationDays}
                </h3>
              </div>

              <div className="rounded-3xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-yellow-500/30 p-4 sm:p-5">
                <p className="text-zinc-400 text-xs sm:text-sm">Total Bonus</p>
                <h3 className="mt-2 text-2xl sm:text-3xl font-black text-yellow-400">
                  ${totalBonus.toFixed(2)}
                </h3>
              </div>

              <div className="rounded-3xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 p-4 sm:p-5">
                <p className="text-zinc-400 text-xs sm:text-sm">Daily Profit</p>
                <h3 className="mt-2 text-2xl sm:text-3xl font-black text-purple-400">
                  ${dailyProfitValue.toFixed(2)}
                </h3>
              </div>

              <div className="rounded-3xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 border border-pink-500/30 p-4 sm:p-5">
                <p className="text-zinc-400 text-xs sm:text-sm">Trades/Day</p>
                <h3 className="mt-2 text-2xl sm:text-3xl font-black text-pink-400">
                  {tradesPerDay}
                </h3>
              </div>

              <div className="rounded-3xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/30 p-4 sm:p-5">
                <p className="text-zinc-400 text-xs sm:text-sm">ROI %</p>
                <h3 className="mt-2 text-2xl sm:text-3xl font-black text-cyan-400">
                  {roi}%
                </h3>
              </div>

              <div className="rounded-3xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/30 p-4 sm:p-5">
                <p className="text-zinc-400 text-xs sm:text-sm">Portfolio</p>
                <h3 className="mt-2 text-2xl sm:text-3xl font-black text-orange-400">
                  ${portfolioValue.toFixed(0)}
                </h3>
              </div>

              <div className="rounded-3xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 border border-indigo-500/30 p-4 sm:p-5">
                <p className="text-zinc-400 text-xs sm:text-sm">Withdrawal</p>
                <h3 className="mt-2 text-2xl sm:text-3xl font-black text-indigo-400">
                  {withdrawEnabled ? "✓ Open" : "🔒 Locked"}
                </h3>
              </div>
            </div>

          </GlassCard>

          {/* GRAPH */}

          <GlassCard className="xl:col-span-1 p-6">

            <div className="flex flex-col gap-4">

              <div>

                <h2 className="text-2xl font-bold">
                  Stats & Activity
                </h2>

                <p className="text-zinc-400 mt-1 text-sm">
                  Trading performance
                </p>

              </div>

              <div className="space-y-3">
                <div className="rounded-2xl bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 p-4 border border-emerald-500/20">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Win Rate</span>
                    <span className="text-emerald-400 font-bold">95%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-700 rounded-full mt-2">
                    <div className="h-full w-[95%] bg-emerald-500 rounded-full"></div>
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-r from-blue-500/20 to-blue-500/5 p-4 border border-blue-500/20">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Uptime</span>
                    <span className="text-blue-400 font-bold">99.9%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-700 rounded-full mt-2">
                    <div className="h-full w-[99%] bg-blue-500 rounded-full"></div>
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-r from-yellow-500/20 to-yellow-500/5 p-4 border border-yellow-500/20">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Security</span>
                    <span className="text-yellow-400 font-bold">100%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-700 rounded-full mt-2">
                    <div className="h-full w-full bg-yellow-500 rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="text-right pt-2">
                <p className="text-zinc-400 text-xs">
                  Live Time
                </p>
                <p className="text-emerald-400 font-semibold text-sm">
                  {currentTime}
                </p>
              </div>

            </div>

          </GlassCard>

        </div>

        {/* ANALYTICS CHART */}

        <GlassCard className="p-6 mt-6">

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">

            <div>
              <h2 className="text-2xl sm:text-3xl font-bold fin-heading">
                Profit & Loss Analytics
              </h2>
              <p className="text-zinc-400 mt-1 text-sm">
                Real-time trading performance
              </p>
            </div>

          </div>

          <div className="w-full overflow-x-auto">
            <div className="h-[300px] sm:h-[350px] min-w-full">

              <ResponsiveContainer width="100%" height="100%">

                <LineChart data={chartData}>

                  <CartesianGrid stroke="#1f2937" />

                  <XAxis
                    dataKey="day"
                    stroke="#71717a"
                    tick={{ fontSize: 12 }}
                  />

                  <YAxis stroke="#71717a" tick={{ fontSize: 12 }} />

                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #10b981' }} />

                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#10b981"
                    strokeWidth={4}
                    dot={{ fill: '#10b981', r: 5 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="loss"
                    stroke="#ef4444"
                    strokeWidth={4}
                    dot={{ fill: '#ef4444', r: 5 }}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>
          </div>

        </GlassCard>

        {/* TRANSACTIONS */}

        <GlassCard className="p-4 sm:p-6 mt-6 w-full">

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 flex-wrap">

            <h2 className="text-2xl sm:text-3xl font-black fin-heading">
              Transaction History
            </h2>

            <div className="px-4 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs sm:text-sm whitespace-nowrap">
              Live Updates
            </div>

          </div>

          <div className="w-full overflow-x-auto">

            <table className="w-full text-xs sm:text-sm md:text-base">

              <thead>

                <tr className="border-b border-white/10 text-zinc-400 text-left">

                  <th className="pb-3 sm:pb-4 px-2 sm:px-3">
                    Type
                  </th>

                  <th className="pb-3 sm:pb-4 px-2 sm:px-3">
                    Amount
                  </th>

                  <th className="pb-3 sm:pb-4 px-2 sm:px-3 hidden sm:table-cell">
                    Status
                  </th>

                  <th className="pb-3 sm:pb-4 px-2 sm:px-3 hidden md:table-cell">
                    Method
                  </th>

                  <th className="pb-3 sm:pb-4 px-2 sm:px-3">
                    Date
                  </th>

                </tr>

              </thead>

              <tbody>

                {transactions.map((item, i) => (

                  <tr
                    key={i}
                    className="border-b border-white/5 hover:bg-white/5 transition"
                  >

                    <td className="py-3 sm:py-4 px-2 sm:px-3">
                      {item.type}
                    </td>

                    <td
                      className={`py-3 sm:py-4 px-2 sm:px-3 font-bold ${item.color}`}
                    >
                      {item.amount}
                    </td>

                    <td className="py-3 sm:py-4 px-2 sm:px-3 hidden sm:table-cell">

                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 whitespace-nowrap">
                        {item.status}
                      </span>

                    </td>

                    <td className="py-3 sm:py-4 px-2 sm:px-3 hidden md:table-cell text-zinc-400">
                      {item.method || "USDT (TRC20)"}
                    </td>

                    <td className="py-3 sm:py-4 px-2 sm:px-3 text-zinc-400">
                      {item.date}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </GlassCard>

        {/* FOOTER */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">

          {[
            {
              title: "AI Automated Trading",
              icon: Bot,
            },
            {
              title: "Bank Grade Security",
              icon: ShieldCheck,
            },
            {
              title: "24/7 Live Support",
              icon: CalendarDays,
            },
          ].map((item, i) => (

            <GlassCard
              key={i}
              className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4"
            >

              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <item.icon className="text-emerald-400" size={24} />
              </div>

              <div className="min-w-0">

                <h3 className="text-lg sm:text-xl font-semibold">
                  {item.title}
                </h3>

                <p className="text-zinc-400 text-xs sm:text-sm mt-1">
                  Secure • Premium • Fast
                </p>

              </div>

            </GlassCard>

          ))}

        </div>

      </div>

    </div>
  )
}

interface PlanDetail {
  id?: string
  plan_name?: string
  amount?: number
  amountValue?: number
  planRoi?: number
  planDuration?: number
  dailyProfit?: number
  total_profit?: number
  earnedForItem?: number
  status?: string
  created_at?: string
  start?: Date
  completedDaysForItem?: number
  daysElapsedForItem?: number
}