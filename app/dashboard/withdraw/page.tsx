"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

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

export default function WithdrawPage() {

  const [amount, setAmount] = useState("")
  const [wallet, setWallet] = useState("")
  const [network, setNetwork] = useState("TRC20")
  const [loading, setLoading] = useState(false)
  const [totalProfit, setTotalProfit] = useState(0)
  const [withdrawableProfit, setWithdrawableProfit] = useState(0)
  const [lockedPrincipal, setLockedPrincipal] = useState(0)
  const [availableBalance, setAvailableBalance] = useState(0)
  const [withdrawEnabled, setWithdrawEnabled] = useState(false)
  const [countdown, setCountdown] = useState("Loading…")

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null

    async function loadWithdrawalData() {
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

      const activePlan = plans?.[0] || null
      const planAmount = Number(activePlan?.amount || 0)
      const planInfo = activePlan
        ? {
            duration: planConfig(activePlan.plan_name || "", planAmount).duration,
            dailyProfit: Number(activePlan.daily_profit || 0),
            startDate: activePlan.created_at ? new Date(activePlan.created_at) : new Date(),
          }
        : null

      const principalSum = plans?.reduce((sum, item) => sum + Number(item.amount || 0), 0) || 0

      const earnedSum = (plans || []).reduce((sum, item) => {
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
      const totalWithdraw = withdrawals?.reduce((sum, item) => {
        if (item.status === "rejected") return sum
        return sum + Number(item.amount || 0)
      }, 0) || 0

      const available = Math.max(Number((earnedSum + totalBonus - totalWithdraw).toFixed(2)), 0)
      setTotalProfit(earnedSum)
      setWithdrawableProfit(available)
      setLockedPrincipal(principalSum)
      setAvailableBalance(available)

      if (planInfo) {
        const unlockDate = new Date(planInfo.startDate)
        unlockDate.setDate(unlockDate.getDate() + 20)

        const updateCountdown = () => {
          const now = new Date()
          const difference = unlockDate.getTime() - now.getTime()

          if (difference <= 0) {
            setWithdrawEnabled(true)
            setCountdown("Available now")
            return
          }

          setWithdrawEnabled(false)
          const days = Math.floor(difference / (1000 * 60 * 60 * 24))
          const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
          const minutes = Math.floor((difference / (1000 * 60)) % 60)
          const seconds = Math.floor((difference / 1000) % 60)
          setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`)
        }

        updateCountdown()
        timer = setInterval(updateCountdown, 1000)
        return
      }

      setCountdown("No active approved deposit")
      setWithdrawEnabled(false)
    }

    loadWithdrawalData()

    return () => {
      if (timer) {
        clearInterval(timer)
      }
    }
  }, [])

  const submitWithdraw = async () => {
    const requestAmount = Number(amount)

    if (!amount || !wallet) {
      alert("Please fill all fields")
      return
    }

    if (!withdrawEnabled) {
      alert("Withdrawal is locked until the unlock period completes.")
      return
    }

    if (isNaN(requestAmount) || requestAmount <= 0) {
      alert("Enter a valid amount")
      return
    }

    if (requestAmount > withdrawableProfit) {
      alert("You cannot withdraw more than your available profit.")
      return
    }

    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert("Please login first")
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from("withdrawals")
      .insert([
        {
          email: user.email,
          amount: requestAmount,
          wallet,
          network,
          status: "pending",
        },
      ])

    if (error) {
      console.log(error)
      alert(error.message)
      setLoading(false)
      return
    }

    alert("Withdrawal Request Submitted")
    setAmount("")
    setWallet("")
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#030507] text-white p-6">

      <div className="max-w-2xl mx-auto">

        {/* HEADER */}

        <div className="mb-8">

          <h1 className="text-4xl font-black">
            Withdraw Funds
          </h1>

          <p className="text-zinc-400 mt-2">
            Request Crypto Withdrawal
          </p>

        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-zinc-400 text-sm">Total Profit</p>
              <p className="text-2xl font-black text-emerald-400 mt-3">${totalProfit.toFixed(2)}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-zinc-400 text-sm">Withdrawable Profit</p>
              <p className="text-2xl font-black text-emerald-400 mt-3">${withdrawableProfit.toFixed(2)}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-zinc-400 text-sm">Locked Principal</p>
              <p className="text-2xl font-black text-zinc-100 mt-3">${lockedPrincipal.toFixed(2)}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-zinc-400 text-sm">Available Balance</p>
              <p className="text-2xl font-black text-emerald-400 mt-3">${availableBalance.toFixed(2)}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-4 mb-6">
            <p className="text-zinc-400 text-sm">Withdrawal Lock</p>
            <p className="text-2xl font-black mt-3">{countdown}</p>
          </div>

          <div>
            <p className="text-zinc-400 mb-3">Withdraw Amount</p>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter Amount"
              className="w-full rounded-2xl bg-black/40 border border-white/10 p-4 outline-none"
            />
          </div>

          <div className="mt-6">
            <p className="text-zinc-400 mb-3">Select Network</p>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full rounded-2xl bg-black/40 border border-white/10 p-4 outline-none"
            >
              <option value="TRC20">TRC20</option>
              <option value="BEP20">BEP20</option>
              <option value="ERC20">ERC20</option>
            </select>
          </div>

          <div className="mt-6">
            <p className="text-zinc-400 mb-3">Your Wallet Address</p>
            <textarea
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="Enter Your Wallet Address"
              className="w-full min-h-[120px] rounded-2xl bg-black/40 border border-white/10 p-4 outline-none"
            />
          </div>

          <button
            onClick={submitWithdraw}
            disabled={loading || !withdrawEnabled}
            className={`mt-8 w-full rounded-2xl py-4 font-black text-lg transition ${withdrawEnabled ? "bg-emerald-500 text-black hover:bg-emerald-400" : "bg-zinc-700 text-zinc-400 cursor-not-allowed"}`}
          >
            {loading ? "Processing..." : withdrawEnabled ? "Submit Withdrawal" : "Withdraw Locked"}
          </button>
        </div>

      </div>

    </div>
  )
}