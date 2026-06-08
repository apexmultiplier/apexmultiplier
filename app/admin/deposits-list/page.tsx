"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, Check, X } from "lucide-react"

interface DepositRecord {
  id: number
  email: string
  amount: number
  network: string
  txhash: string
  status: string
  plan_name?: string
  created_at: string
  user_id: string
}

export default function DepositsPage() {
  const router = useRouter()
  const [deposits, setDeposits] = useState<DepositRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  useEffect(() => {
    loadDeposits()
    const subscription = supabase
      .channel("deposits")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deposits" },
        () => loadDeposits()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadDeposits = async () => {
    const { data } = await supabase
      .from("deposits")
      .select("*")
      .order("created_at", { ascending: false })

    setDeposits(data || [])
    setLoading(false)
  }

  const updateDepositStatus = async (id: number, status: string) => {
    setUpdatingId(id)
    const deposit = deposits.find((d) => d.id === id)
    if (!deposit) return

    const { error } = await supabase
      .from("deposits")
      .update({ status })
      .eq("id", id)

    if (error) {
      alert(error.message)
      setUpdatingId(null)
      return
    }

    if (status === "approved") {
      // Create user_plans record (updated plan mapping)
      const planMapping: Record<string, { roi: number; duration: number }> = {
        STARTER: { roi: 8, duration: 30 },
        SILVER: { roi: 9, duration: 30 },
        PREMIUM: { roi: 10, duration: 30 },
        GOLD: { roi: 12, duration: 30 },
        ELITE: { roi: 14, duration: 30 },
        "ELITE INFINITY": { roi: 14, duration: 30 },
      }

      const planName = deposit.plan_name || "STARTER"
      const planData = planMapping[planName] || planMapping.STARTER
      const monthlyProfit = (deposit.amount * planData.roi) / 100
      const dailyProfit = monthlyProfit / planData.duration

      await supabase.from("user_plans").insert([
        {
          user_email: deposit.email,
          plan_name: planName,
          amount: deposit.amount,
          roi: planData.roi,
          duration: planData.duration,
          daily_profit: dailyProfit,
          total_profit: monthlyProfit,
          status: "active",
        },
      ])
    }

    loadDeposits()
    setUpdatingId(null)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.push("/admin")}
          className="flex items-center gap-2 mb-6 text-emerald-400 hover:text-emerald-300 transition"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 mb-6">
          <h1 className="text-4xl font-black">Deposits Management</h1>
          <p className="text-zinc-400 mt-2">Review and manage all deposit requests</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-zinc-400">Loading deposits...</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400">
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Plan</th>
                  <th className="text-right py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Network</th>
                  <th className="text-left py-3 px-4">TX Hash</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Time</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((deposit) => {
                  const { date, time } = formatDate(deposit.created_at)
                  return (
                    <tr
                      key={deposit.id}
                      className="border-b border-white/5 hover:bg-white/5 transition"
                    >
                      <td className="py-4 px-4 text-emerald-400">{deposit.email}</td>
                      <td className="py-4 px-4">{deposit.plan_name || "—"}</td>
                      <td className="py-4 px-4 text-right font-bold">${deposit.amount}</td>
                      <td className="py-4 px-4 text-xs">{deposit.network}</td>
                      <td className="py-4 px-4 text-xs text-zinc-400 max-w-xs truncate">
                        {deposit.txhash}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs ${
                            deposit.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : deposit.status === "pending"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {deposit.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-zinc-400 text-xs">{date}</td>
                      <td className="py-4 px-4 text-zinc-400 text-xs">{time}</td>
                      <td className="py-4 px-4">
                        {deposit.status === "pending" ? (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => updateDepositStatus(deposit.id, "approved")}
                              disabled={updatingId === deposit.id}
                              className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 transition disabled:opacity-50"
                            >
                              <Check size={16} className="text-emerald-400" />
                            </button>
                            <button
                              onClick={() => updateDepositStatus(deposit.id, "rejected")}
                              disabled={updatingId === deposit.id}
                              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition disabled:opacity-50"
                            >
                              <X size={16} className="text-red-400" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-500 text-xs">Completed</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {deposits.length === 0 && (
              <div className="text-center py-12 text-zinc-400">
                No deposits found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
