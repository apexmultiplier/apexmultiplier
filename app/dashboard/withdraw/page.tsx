"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Lock, Wallet, Sparkles, DollarSign } from "lucide-react"
import { supabase } from "@/lib/supabase"

import { getPlanConfigFromNameOrAmount } from '@/lib/planDefinitions'

function planConfig(planName: string, amount: number) {
  return getPlanConfigFromNameOrAmount(planName, amount)
}

type UserPlan = {
  id: string | number
  plan_name?: string | null
  amount?: string | number | null
  created_at?: string | null
  status?: string | null
  daily_profit?: number | null
}

type UserWithdrawal = {
  id: number
  email: string
  amount: number
  wallet: string
  network: string
  status: string
  created_at?: string | null
  withdrawal_type?: string | null
  package_id?: string | number | null
  package_name?: string | null
  fee?: number | null
  receive_amount?: number | null
}

type PackageStatus = "Locked" | "Available" | "Withdrawal Requested" | "Completed" | "Cancelled"

type PackageStatusDetails = {
  status: PackageStatus
  unlockDate?: Date
  badge: string
  selectable: boolean
}

export default function WithdrawPage() {
  const router = useRouter()
  const [wallet, setWallet] = useState("")
  const [network, setNetwork] = useState("TRC20")
  const [loadingProfit, setLoadingProfit] = useState(false)
  const [loadingPrincipal, setLoadingPrincipal] = useState(false)
  const [totalProfit, setTotalProfit] = useState(0)
  const [withdrawableProfit, setWithdrawableProfit] = useState(0)
  const [lockedPrincipal, setLockedPrincipal] = useState(0)
  const [availableBalance, setAvailableBalance] = useState(0)
  const [withdrawEnabled, setWithdrawEnabled] = useState(false)
  const [countdown, setCountdown] = useState("Loading…")
  const [userPlans, setUserPlans] = useState<UserPlan[]>([])
  const [userWithdrawals, setUserWithdrawals] = useState<UserWithdrawal[]>([])
  const [selectedPackageId, setSelectedPackageId] = useState<string | number | null>(null)
  const [profitInput, setProfitInput] = useState("0")
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadWithdrawalData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setCountdown("Please login to view withdraw details")
      return
    }

    const [{ data: plans }, { data: withdrawals }, { data: bonuses }] = await Promise.all([
      supabase
        .from("user_plans")
        .select("*")
        .eq("user_email", user.email)
        .eq("status", "active")
        .order("id", { ascending: false }),
      supabase
        .from("withdrawals")
        .select("*")
        .eq("email", user.email)
        .order("id", { ascending: false }),
      supabase
        .from("bonuses")
        .select("amount")
        .eq("user_id", user.id),
    ])

    const planList = plans || []
    const withdrawalList = (withdrawals || []) as UserWithdrawal[]

    setUserPlans(planList)
    setUserWithdrawals(withdrawalList)

    const principalSum = planList?.reduce((sum, item) => sum + Number(item.amount || 0), 0) || 0

    const earnedSum = (planList || []).reduce((sum, item) => {
      const start = item.created_at ? new Date(item.created_at) : new Date()
      const now = new Date()
      const duration = planConfig(item.plan_name || "", Number(item.amount || 0)).duration
      const daysElapsed = Math.max(
        0,
        Math.min(
          Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
          duration
        )
      )
      return sum + Number((Number(item.daily_profit || 0) * daysElapsed).toFixed(2))
    }, 0)

    const totalBonus = bonuses?.reduce((sum, item) => sum + Number(item.amount || 0), 0) || 0
    const totalProfitWithdrawn = withdrawalList?.reduce((sum, item) => {
      const isPrincipal = item.withdrawal_type === "principal" || item.package_id != null || item.package_name != null
      if (item.status === "rejected") return sum
      return isPrincipal ? sum : sum + Number(item.amount || 0)
    }, 0) || 0

    const available = Math.max(Number((earnedSum + totalBonus - totalProfitWithdrawn).toFixed(2)), 0)
    setTotalProfit(earnedSum)
    setWithdrawableProfit(available)
    setLockedPrincipal(principalSum)
    setAvailableBalance(available)

    // load user's saved wallet/network from profile table
    try {
      const { data: profile } = await supabase.from('users').select('wallet_address,withdraw_network').eq('user_id', user.id).single()
      if (profile) {
        if (profile.wallet_address) setWallet(String(profile.wallet_address))
        if (profile.withdraw_network) setNetwork(String(profile.withdraw_network))
      }
    } catch (e) {
      // ignore profile fetch errors
    }

    const packageDetails = planList.map((plan) => getPackageStatus(plan, withdrawalList))
    const availablePackages = packageDetails.filter((item) => item.status === "Available")
    const nextUnlockPackage = packageDetails.filter((item) => item.status === "Locked" && item.unlockDate).sort((a, b) => (a.unlockDate!.getTime() - b.unlockDate!.getTime()))[0]

    setWithdrawEnabled(availablePackages.length > 0)

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (availablePackages.length > 0) {
      setCountdown("Principal packages are available for withdrawal.")
    } else if (nextUnlockPackage?.unlockDate) {
      const updateCountdown = () => {
        const now = new Date()
        const diff = nextUnlockPackage.unlockDate!.getTime() - now.getTime()
        if (diff <= 0) {
          setCountdown("Principal packages are available for withdrawal.")
          setWithdrawEnabled(true)
          return
        }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
        const minutes = Math.floor((diff / (1000 * 60)) % 60)
        const seconds = Math.floor((diff / 1000) % 60)
        setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`)
      }
      updateCountdown()
      timerRef.current = setInterval(updateCountdown, 1000)
    } else {
      setCountdown("No active approved deposit")
    }
  }

  useEffect(() => {
    void loadWithdrawalData()

    const onProfileUpdated = (e: any) => {
      try {
        const d = e?.detail || {}
        if (d.walletAddress) setWallet(d.walletAddress)
        if (d.withdrawNetwork) setNetwork(d.withdrawNetwork)
      } catch (err) {}
    }

    window.addEventListener('apex:profile_updated', onProfileUpdated)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      window.removeEventListener('apex:profile_updated', onProfileUpdated)
    }
  }, [])

  const getPackageUnlockDate = (plan: UserPlan) => {
    const createdAt = plan.created_at ? new Date(plan.created_at) : null
    if (!createdAt) return null
    const unlockDate = new Date(createdAt)
    unlockDate.setDate(unlockDate.getDate() + 20)
    return unlockDate
  }

  const getPackageStatus = (plan: UserPlan, withdrawalsList: UserWithdrawal[]) => {
    const unlockDate = getPackageUnlockDate(plan)
    const isUnlocked = unlockDate ? Date.now() >= unlockDate.getTime() : false

    const relatedWithdrawals = withdrawalsList.filter((item) => {
      if (item.withdrawal_type === "principal") {
        if (item.package_id && String(item.package_id) === String(plan.id)) return true
        if (item.package_name && item.package_name === plan.plan_name) return true
      }
      if (item.package_id && String(item.package_id) === String(plan.id)) return true
      if (item.package_name && item.package_name === plan.plan_name) return true
      return false
    })

    const hasApproved = relatedWithdrawals.some((item) => item.status === "approved")
    const hasPending = relatedWithdrawals.some((item) => item.status === "pending")
    const hasRejected = relatedWithdrawals.some((item) => item.status === "rejected")

    if (hasApproved) {
      return { status: "Completed" as PackageStatus, unlockDate, badge: "Principal Withdrawn", selectable: false }
    }
    if (hasPending) {
      return { status: "Withdrawal Requested" as PackageStatus, unlockDate, badge: "Request Pending", selectable: false }
    }
    if (!isUnlocked) {
      return { status: "Locked" as PackageStatus, unlockDate, badge: "Locked", selectable: false }
    }
    if (hasRejected) {
      return { status: "Cancelled" as PackageStatus, unlockDate, badge: "Cancelled", selectable: false }
    }
    return { status: "Available" as PackageStatus, unlockDate, badge: "Available", selectable: true }
  }

  const renderUnlockText = (date?: Date) => {
    if (!date) return "—"
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    if (diff <= 0) return "Available now"
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
    const minutes = Math.floor((diff / (1000 * 60)) % 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const maxProfitAmount = Math.min(withdrawableProfit, 10000)
  const profitAmount = Number(profitInput) || 0
  const profitFee = Number((profitAmount * 0.05).toFixed(2))
  const profitReceive = Number((profitAmount - profitFee).toFixed(2))
  const profitReady = profitAmount >= 50 && profitAmount <= withdrawableProfit && profitAmount <= 10000 && profitAmount > 0
  const profitMessage = withdrawableProfit === 0
    ? "No withdrawable profit available."
    : withdrawableProfit < 50
    ? "Minimum withdrawal is 50 USDT."
    : profitAmount < 50
    ? "Enter at least 50 USDT."
    : profitAmount > withdrawableProfit
    ? "Cannot exceed available profit."
    : profitAmount > 10000
    ? "Maximum withdrawal amount is 10,000 USDT."
    : "Ready to request profit withdrawal."

  useEffect(() => {
    const defaultAmount = maxProfitAmount.toFixed(2)
    setProfitInput(defaultAmount)
  }, [maxProfitAmount])

  const selectedPackage = userPlans.find((plan) => String(plan.id) === String(selectedPackageId))
  const selectedPackageAmount = Number(selectedPackage?.amount || 0)
  const principalFee = Number((selectedPackageAmount * 0.05).toFixed(2))
  const principalReceive = Number((selectedPackageAmount - principalFee).toFixed(2))

  const submitProfitWithdrawal = async () => {
    if (!wallet) {
      alert("Please fill all fields")
      return
    }

    if (!profitReady) {
      alert("Please enter a valid profit amount between 50 USDT and your available balance.")
      return
    }

    setLoadingProfit(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert("Please login first")
      setLoadingProfit(false)
      return
    }

    const { error } = await supabase
      .from("withdrawals")
      .insert([
        {
          email: user.email,
          amount: profitAmount,
          wallet,
          network,
          status: "pending",
          withdrawal_type: "profit",
          fee: profitFee,
          receive_amount: profitReceive,
        },
      ])

    if (error) {
      console.log(error)
      alert(error.message)
      setLoadingProfit(false)
      return
    }

    alert("Profit Withdrawal Request Submitted")
    setWithdrawableProfit((prev) => Math.max(prev - profitAmount, 0))
    setAvailableBalance((prev) => Math.max(prev - profitAmount, 0))
    if (typeof window !== "undefined") {
      sessionStorage.setItem("apex_dashboard_refresh", Date.now().toString())
    }
    window.dispatchEvent(new CustomEvent("dashboard:refresh"))
    setLoadingProfit(false)
    await loadWithdrawalData()
  }

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push("/dashboard")
    }
  }

  const submitPrincipalWithdrawal = async () => {
    if (!selectedPackage) {
      alert("Please select an available package")
      return
    }

    if (!wallet) {
      alert("Please fill all fields")
      return
    }

    const statusData = getPackageStatus(selectedPackage, userWithdrawals)
    if (statusData.status !== "Available") {
      alert("Selected package is not available for withdrawal.")
      return
    }

    setLoadingPrincipal(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert("Please login first")
      setLoadingPrincipal(false)
      return
    }

    const { error } = await supabase
      .from("withdrawals")
      .insert([
        {
          email: user.email,
          amount: selectedPackageAmount,
          wallet,
          network,
          status: "pending",
          withdrawal_type: "principal",
          package_id: selectedPackage.id,
          package_name: selectedPackage.plan_name || null,
          fee: principalFee,
          receive_amount: principalReceive,
        },
      ])

    if (error) {
      console.log(error)
      alert(error.message)
      setLoadingPrincipal(false)
      return
    }

    alert("Principal Withdrawal Request Submitted")
    setSelectedPackageId(null)
    setLoadingPrincipal(false)
    await loadWithdrawalData()
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-20%] h-72 w-72 rounded-full bg-emerald-400/10 blur-[120px]" />
        <div className="absolute right-[-8%] top-[20%] h-80 w-80 rounded-full bg-cyan-400/10 blur-[140px]" />
        <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-400/8 blur-[140px]" />
      </div>

      <button
        type="button"
        onClick={handleBack}
        className="absolute top-4 left-4 z-30 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.18)] backdrop-blur-xl transition hover:bg-white/20 hover:shadow-[0_0_30px_rgba(16,185,129,0.28)]"
      >
        <ArrowLeft size={16} />
        Back
      </button>
      <div className="relative z-10 mx-auto max-w-[1500px] px-4 pt-20 pb-6 sm:px-6 lg:px-8 lg:pt-24 lg:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6 rounded-[32px] border border-emerald-400/15 bg-[rgba(8,16,24,0.72)] p-6 shadow-[0_0_70px_rgba(0,255,174,0.12)] backdrop-blur-[24px]"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.34em] text-emerald-200">
                <Sparkles className="h-3.5 w-3.5" />
                Withdraw Funds
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-[-0.03em] text-white sm:text-4xl">Request Crypto Withdrawal</h1>
              <p className="mt-3 max-w-2xl text-sm text-zinc-400 sm:text-base">Withdraw your available profit or unlocked principal securely with the same premium experience as the dashboard.</p>
            </div>

          </div>
        </motion.div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Profit", value: totalProfit, accent: "text-emerald-400", icon: DollarSign },
            { label: "Available Balance", value: availableBalance, accent: "text-emerald-400", icon: Wallet },
            { label: "Principal Balance", value: lockedPrincipal, accent: "text-zinc-100", icon: Lock },
          ].map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="glass-panel p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.34em] text-zinc-400">{item.label}</p>
                    <p className={`mt-4 text-3xl font-black tracking-[-0.03em] ${item.accent}`}>${item.value.toFixed(2)}</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-2.5 text-emerald-300">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }} className="glass-panel p-5">
            <p className="text-[11px] uppercase tracking-[0.34em] text-zinc-400">Withdrawal Status</p>
            <p className="mt-3 text-lg font-semibold text-white">Principal Withdrawal Available</p>
            <p className="mt-2 text-sm text-zinc-400">20 Day lock has completed for eligible packages.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }} className="glass-panel p-5">
            <p className="text-[11px] uppercase tracking-[0.34em] text-zinc-400">Withdrawal Fee</p>
            <p className="mt-3 text-lg font-semibold text-emerald-400">5%</p>
            <p className="mt-2 text-sm text-zinc-400">Principal withdrawals carry a standard fee.</p>
          </motion.div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="glass-panel p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-zinc-400">Profit Withdrawal</p>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-white">Withdraw Profit</h2>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/15 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-200">Profit</span>
            </div>

            <div className="mt-6 grid gap-5">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-400">Available Profit</p>
                <p className="mt-2 text-3xl font-black text-emerald-400">${withdrawableProfit.toFixed(2)}</p>
              </div>

              <div>
                <label className="text-xs uppercase tracking-[0.28em] text-zinc-400" htmlFor="profitAmount">Profit Amount</label>
                <input
                  id="profitAmount"
                  type="number"
                  step="0.01"
                  min={50}
                  max={maxProfitAmount}
                  value={profitInput}
                  onChange={(e) => {
                    const value = e.target.value
                    if (/^\d*\.?\d*$/.test(value)) {
                      setProfitInput(value)
                    }
                  }}
                  className="input-glass mt-2 w-full px-4 py-4 text-2xl font-semibold"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-[0.28em] text-zinc-400">Network</label>
                  <select
                    value={network}
                    onChange={(e) => setNetwork(e.target.value)}
                    className="input-glass mt-2 w-full px-4 py-4 text-sm"
                  >
                    <option value="TRC20">TRC20</option>
                    <option value="BEP20">BEP20</option>
                    <option value="ERC20">ERC20</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.28em] text-zinc-400">Wallet Address</label>
                  <textarea
                    value={wallet}
                    onChange={(e) => setWallet(e.target.value)}
                    placeholder="Enter your wallet address"
                    className="input-glass mt-2 h-28 w-full resize-none px-4 py-4 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="glass-card mt-6 p-5">
              <div className="grid gap-3 text-sm text-zinc-300">
                <div className="flex justify-between gap-3"><span>Withdrawal Amount</span><span className="text-white">${profitAmount.toFixed(2)}</span></div>
                <div className="flex justify-between gap-3"><span>Fee (5%)</span><span className="text-white">${profitFee.toFixed(2)}</span></div>
                <div className="flex justify-between gap-3"><span>Receive Amount</span><span className="text-emerald-400">${profitReceive.toFixed(2)}</span></div>
                <div className="flex justify-between gap-3"><span>Minimum</span><span className="text-white">50 USDT</span></div>
                <div className="flex justify-between gap-3"><span>Maximum</span><span className="text-white">10,000 USDT</span></div>
                <div className="flex justify-between gap-3"><span>Processing</span><span className="text-white">1-3 Business Days</span></div>
              </div>
            </div>

            <motion.button
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={submitProfitWithdrawal}
              disabled={!profitReady || loadingProfit}
              className={`neon-btn mt-6 w-full justify-center py-4 text-base ${!profitReady || loadingProfit ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {loadingProfit ? "Processing..." : "Request Profit Withdrawal"}
            </motion.button>

            <p className="mt-3 text-sm text-zinc-400">{profitMessage}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 }} className="glass-panel p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-zinc-400">Principal Withdrawal</p>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-white">Withdraw Principal</h2>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/15 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-200">Principal</span>
            </div>

            <p className="mt-6 text-sm text-zinc-400">Choose an available package to withdraw its principal balance. Locked packages remain disabled until unlocked.</p>

            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
              {userPlans.length === 0 ? (
                <div className="glass-card p-4 text-sm text-zinc-400">No active packages found.</div>
              ) : (
                userPlans.map((plan) => {
                  const statusData = getPackageStatus(plan, userWithdrawals)
                  const selected = String(plan.id) === String(selectedPackageId)
                  const unlockDate = getPackageUnlockDate(plan)
                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -3, scale: 1.01 }}
                      role="button"
                      tabIndex={0}
                      onClick={() => statusData.selectable && setSelectedPackageId(plan.id)}
                      onKeyDown={(e) => {
                        if ((e.key === "Enter" || e.key === " ") && statusData.selectable) {
                          e.preventDefault()
                          setSelectedPackageId(plan.id)
                        }
                      }}
                      className={`h-full min-h-[140px] rounded-[22px] border p-4 text-left transition ${selected ? "border-emerald-400/40 bg-emerald-400/10 shadow-[0_0_30px_rgba(0,255,174,0.12)]" : "border-white/10 bg-[rgba(8,16,24,0.84)] hover:border-emerald-400/25 hover:bg-[rgba(11,23,32,0.92)]"} ${!statusData.selectable ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <div className="flex h-full flex-col justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">Plan</p>
                              <p className="mt-1 text-sm font-semibold leading-snug text-white break-words">{plan.plan_name || "Package"}</p>
                            </div>
                            <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] ${selected ? "border border-emerald-400/30 bg-emerald-400/25 text-emerald-200" : statusData.selectable ? "border border-emerald-400/20 bg-emerald-500/15 text-emerald-300" : "border border-white/10 bg-white/10 text-zinc-300"}`}>
                              {selected ? "Selected" : statusData.status === "Available" ? "Available" : statusData.status}
                            </span>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">Investment</p>
                            <p className="mt-1 text-base font-semibold text-white">${Number(plan.amount || 0).toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="rounded-[16px] border border-white/10 bg-black/20 p-3 text-[12px] text-zinc-400">
                          <div className="flex items-center justify-between gap-2">
                            <span>Purchase</span>
                            <span className="text-right font-medium text-white">{plan.created_at ? new Date(plan.created_at).toLocaleDateString() : "—"}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span>Unlock</span>
                            <span className="text-right font-medium text-white">{unlockDate ? unlockDate.toLocaleDateString() : "—"}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span>Status</span>
                            <span className={`text-right font-medium ${statusData.status === "Available" ? "text-emerald-300" : "text-zinc-200"}`}>{statusData.status}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end">
                          {selected ? (
                            <span className="inline-flex items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/25 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200">
                              ✓ Selected
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (statusData.selectable) {
                                  setSelectedPackageId(plan.id)
                                }
                              }}
                              disabled={!statusData.selectable}
                              className={`rounded-[14px] bg-gradient-to-r from-[#00ffae] via-[#00e5ff] to-[#10f2c1] px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-black shadow-[0_0_20px_rgba(0,255,174,0.18)] transition ${!statusData.selectable ? "opacity-70" : ""}`}
                            >
                              Select
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>

            <div className="glass-card mt-6 p-5">
              <div className="grid gap-3 text-sm text-zinc-300">
                <div className="flex justify-between gap-3"><span>Selected Package</span><span className="text-white">{selectedPackage?.plan_name || "None"}</span></div>
                <div className="flex justify-between gap-3"><span>Principal</span><span className="text-white">${selectedPackageAmount.toFixed(2)}</span></div>
                <div className="flex justify-between gap-3"><span>Principal Fee</span><span className="text-white">${principalFee.toFixed(2)}</span></div>
                <div className="flex justify-between gap-3"><span>Receive</span><span className="text-emerald-400">${principalReceive.toFixed(2)}</span></div>
                <div className="flex justify-between gap-3"><span>Network Fee</span><span className="text-white">Varies</span></div>
                <div className="flex justify-between gap-3"><span>Processing</span><span className="text-white">1-3 Business Days</span></div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.28em] text-zinc-400">Network</label>
                <select
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="input-glass mt-2 w-full px-4 py-4 text-sm"
                >
                  <option value="TRC20">TRC20</option>
                  <option value="BEP20">BEP20</option>
                  <option value="ERC20">ERC20</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.28em] text-zinc-400">Wallet Address</label>
                <textarea
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                  placeholder="Enter your wallet address"
                  className="input-glass mt-2 h-28 w-full resize-none px-4 py-4 text-sm"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={submitPrincipalWithdrawal}
              disabled={!selectedPackage || !withdrawEnabled || loadingPrincipal}
              className={`neon-btn mt-6 w-full justify-center py-4 text-base ${(!selectedPackage || !withdrawEnabled || loadingPrincipal) ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {loadingPrincipal ? "Processing..." : "Request Principal Withdrawal"}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
