"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../../lib/supabase"

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    activeInvestors: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    newUsersThisMonth: 0,
  })

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    setLoading(true)
    try {
      const [{ data: users }, { data: deposits }, { data: withdrawals }, { data: userPlans }] = await Promise.all([
        supabase.from("users").select("id,kyc_status,created_at"),
        supabase.from("deposits").select("amount,status,created_at"),
        supabase.from("withdrawals").select("amount,status,created_at"),
        supabase.from("user_plans").select("user_email,status"),
      ])

      const userList = users || []
      const depositList = (deposits || []).map((d: any) => ({ ...d, amount: Number(d.amount || 0) }))
      const withdrawalList = (withdrawals || []).map((w: any) => ({ ...w, amount: Number(w.amount || 0) }))
      const plans = userPlans || []

      const totalUsers = userList.length
      const verifiedUsers = userList.filter((u: any) => u.kyc_status === "Verified").length
      const activeInvestors = new Set(plans.filter((p: any) => p.status === "active").map((p: any) => p.user_email)).size

      const totalDeposits = depositList.reduce((s: number, it: any) => s + Number(it.amount || 0), 0)
      const totalWithdrawals = withdrawalList.reduce((s: number, it: any) => s + Number(it.amount || 0), 0)
      const pendingDeposits = depositList.filter((d: any) => d.status === "pending").length
      const pendingWithdrawals = withdrawalList.filter((w: any) => w.status === "pending").length

      // revenue = deposits - withdrawals
      const totalRevenue = totalDeposits - totalWithdrawals

      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthlyRevenue = depositList.filter((d: any) => new Date(d.created_at) >= monthStart).reduce((s: number, it: any) => s + Number(it.amount || 0), 0) - withdrawalList.filter((w: any) => new Date(w.created_at) >= monthStart).reduce((s: number, it: any) => s + Number(it.amount || 0), 0)

      const newUsersThisMonth = userList.filter((u: any) => new Date(u.created_at) >= monthStart).length

      setMetrics({
        totalUsers,
        verifiedUsers,
        activeInvestors,
        totalDeposits,
        totalWithdrawals,
        pendingDeposits,
        pendingWithdrawals,
        totalRevenue,
        monthlyRevenue,
        newUsersThisMonth,
      })
    } catch (e) {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const Card = ({ title, value }: { title: string; value: any }) => (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
      <p className="text-zinc-400">{title}</p>
      <h3 className="mt-3 text-2xl font-black">{value}</h3>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black">Analytics</h1>
          <p className="text-zinc-400 mt-1">Platform statistics and key metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <Card title="Total Users" value={loading ? "Loading..." : metrics.totalUsers} />
        <Card title="Verified Users" value={loading ? "Loading..." : metrics.verifiedUsers} />
        <Card title="Active Investors" value={loading ? "Loading..." : metrics.activeInvestors} />
        <Card title="Total Deposits" value={loading ? "Loading..." : `$${metrics.totalDeposits.toFixed(2)}`} />
        <Card title="Total Withdrawals" value={loading ? "Loading..." : `$${metrics.totalWithdrawals.toFixed(2)}`} />
        <Card title="Pending Deposits" value={loading ? "Loading..." : metrics.pendingDeposits} />
        <Card title="Pending Withdrawals" value={loading ? "Loading..." : metrics.pendingWithdrawals} />
        <Card title="Total Revenue" value={loading ? "Loading..." : `$${metrics.totalRevenue.toFixed(2)}`} />
        <Card title="Monthly Revenue" value={loading ? "Loading..." : `$${metrics.monthlyRevenue.toFixed(2)}`} />
        <Card title="New Users This Month" value={loading ? "Loading..." : metrics.newUsersThisMonth} />
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-zinc-400">Notes</p>
        <p className="mt-3 text-sm text-zinc-300">Values are calculated from existing users, deposits, withdrawals and user_plans tables.</p>
      </div>
    </div>
  )
}
