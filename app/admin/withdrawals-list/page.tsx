"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, Check, X } from "lucide-react"

interface WithdrawalRecord {
  id: number
  email: string
  amount: number
  wallet: string
  network: string
  status: string
  created_at: string
}

export default function WithdrawalsPage() {
  const router = useRouter()
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  useEffect(() => {
    loadWithdrawals()
    const subscription = supabase
      .channel("withdrawals")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "withdrawals" },
        () => loadWithdrawals()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadWithdrawals = async () => {
    const { data } = await supabase
      .from("withdrawals")
      .select("*")
      .order("created_at", { ascending: false })

    setWithdrawals(data || [])
    setLoading(false)
  }

  const updateWithdrawalStatus = async (id: number, status: string) => {
    setUpdatingId(id)
    const { error } = await supabase
      .from("withdrawals")
      .update({ status })
      .eq("id", id)

    if (error) {
      alert(error.message)
      setUpdatingId(null)
      return
    }

    loadWithdrawals()
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
          <h1 className="text-4xl font-black">Withdrawals Management</h1>
          <p className="text-zinc-400 mt-2">Review and manage all withdrawal requests</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-zinc-400">Loading withdrawals...</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400">
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-right py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Wallet Address</th>
                  <th className="text-left py-3 px-4">Network</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Time</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((withdrawal) => {
                  const { date, time } = formatDate(withdrawal.created_at)
                  return (
                    <tr
                      key={withdrawal.id}
                      className="border-b border-white/5 hover:bg-white/5 transition"
                    >
                      <td className="py-4 px-4 text-emerald-400">{withdrawal.email}</td>
                      <td className="py-4 px-4 text-right font-bold">${withdrawal.amount}</td>
                      <td className="py-4 px-4 text-xs text-zinc-400 max-w-xs truncate">
                        {withdrawal.wallet}
                      </td>
                      <td className="py-4 px-4 text-xs">{withdrawal.network}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs ${
                            withdrawal.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : withdrawal.status === "pending"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {withdrawal.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-zinc-400 text-xs">{date}</td>
                      <td className="py-4 px-4 text-zinc-400 text-xs">{time}</td>
                      <td className="py-4 px-4">
                        {withdrawal.status === "pending" ? (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() =>
                                updateWithdrawalStatus(withdrawal.id, "approved")
                              }
                              disabled={updatingId === withdrawal.id}
                              className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 transition disabled:opacity-50"
                            >
                              <Check size={16} className="text-emerald-400" />
                            </button>
                            <button
                              onClick={() =>
                                updateWithdrawalStatus(withdrawal.id, "rejected")
                              }
                              disabled={updatingId === withdrawal.id}
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

            {withdrawals.length === 0 && (
              <div className="text-center py-12 text-zinc-400">
                No withdrawals found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
