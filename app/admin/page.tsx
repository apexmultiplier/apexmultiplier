"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  Wallet,
  ArrowUpRight,
  DollarSign,
  ShieldCheck,
  Clock3,
  Activity,
  Menu,
  X,
  LogOut,
  BarChart3,
  Settings,
} from "lucide-react"
import { supabase } from "../../lib/supabase"

function formatDate(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  return date.toLocaleString()
}

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [totalUsers, setTotalUsers] = useState(0)
  const [totalDeposits, setTotalDeposits] = useState(0)
  const [totalWithdrawals, setTotalWithdrawals] = useState(0)
  const [totalKyc, setTotalKyc] = useState(0)
  const [pendingEmailVerifications, setPendingEmailVerifications] = useState(0)
  const [pendingKyc, setPendingKyc] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [deposits, setDeposits] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<string[]>([])
  const [lastUpdated, setLastUpdated] = useState("Loading...")

  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [sessionActive, setSessionActive] = useState<boolean | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [selectedTab, setSelectedTab] = useState<"deposits" | "withdrawals">("deposits")

  useEffect(() => {
    checkAdminSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!sessionActive) return
    loadAdminData()

    const channels = [
      supabase
        .channel("public:users")
        .on("postgres_changes", { event: "*", schema: "public", table: "users" }, () => loadAdminData())
        .subscribe(),
      supabase
        .channel("public:deposits")
        .on("postgres_changes", { event: "*", schema: "public", table: "deposits" }, () => loadAdminData())
        .subscribe(),
      supabase
        .channel("public:withdrawals")
        .on("postgres_changes", { event: "*", schema: "public", table: "withdrawals" }, () => loadAdminData())
        .subscribe(),
    ]

    return () => {
      channels.forEach((c) => c.unsubscribe && c.unsubscribe())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionActive])

  const checkAdminSession = async () => {
    const { data } = await supabase.auth.getSession()
    const active = !!data.session
    setSessionActive(active)
    setAuthLoading(false)

    if (active) loadAdminData()
  }

  const handleAdminLogin = async () => {
    setAuthLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    })
    if (error) {
      alert(error.message)
      setAuthLoading(false)
      return
    }
    setSessionActive(true)
    setAuthLoading(false)
    loadAdminData()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSessionActive(false)
  }

  const loadAdminData = async () => {
    setLoading(true)

    const [usersRes, depositsRes, withdrawalsRes] = await Promise.all([
      supabase.from("users").select("id,email,kyc_status,created_at,balance,full_name"),
      supabase.from("deposits").select("*").order("created_at", { ascending: false }),
      supabase.from("withdrawals").select("*").order("created_at", { ascending: false }),
    ])

    const userList = usersRes.data || []
    const depositList = (depositsRes.data || []).map((d: any) => ({ ...d, amount: Number(d.amount || 0) }))
    const withdrawalList = (withdrawalsRes.data || []).map((w: any) => ({ ...w, amount: Number(w.amount || 0) }))

    setTotalUsers(userList.length)
    setTotalDeposits(depositList.reduce((s: number, it: any) => s + Number(it.amount || 0), 0))
    setTotalWithdrawals(withdrawalList.reduce((s: number, it: any) => s + Number(it.amount || 0), 0))

    const kycList = userList.filter((u: any) => u.govt_id_number || u.kyc_status)
    setTotalKyc(kycList.length)

    // pending email verifications
    try {
      const { data: ev } = await supabase
        .from('email_verification_requests')
        .select('id')
        .eq('status', 'pending')

      setPendingEmailVerifications((ev && ev.length) || 0)
    } catch (e) {
      setPendingEmailVerifications(0)
    }

    const pending = userList.filter((u: any) => (u.kyc_status === "Pending" || (!u.kyc_status && u.govt_id_number)))
    setPendingKyc(pending.slice(0, 5))

    setDeposits(depositList.slice(0, 8))
    setWithdrawals(withdrawalList.slice(0, 8))

    const activity: string[] = []
    depositList.slice(0, 8).forEach((item: any) => {
      activity.push(`${formatDate(item.created_at)} — Deposit $${item.amount} by ${item.email}`)
    })
    withdrawalList.slice(0, 8).forEach((item: any) => {
      activity.push(`${formatDate(item.created_at)} — Withdrawal $${item.amount} by ${item.email}`)
    })

    setRecentActivity(activity.slice(0, 12))
    setLastUpdated(new Date().toLocaleString())
    setLoading(false)
  }

  const updateDepositStatus = async (id: number, status: string) => {
    const deposit = deposits.find((d) => d.id === id)
    if (!deposit) return

    // Use server API so inserts run with service role privileges
    try {
      const res = await fetch('/api/admin/approve-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      const body = await res.json()
      if (!res.ok) {
        alert(body?.error || 'Failed to update deposit')
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update deposit')
    } finally {
      loadAdminData()
    }
  }

  const updateWithdrawalStatus = async (id: number, status: string) => {
    const w = withdrawals.find((it) => it.id === id)
    if (!w) return
    await supabase.from("withdrawals").update({ status }).eq("id", id)
    if (status === "approved") {
      // deduct user balance
      const { data: user } = await supabase.from("users").select("*").eq("email", w.email).single()
      const newBalance = Math.max(0, (user?.balance || 0) - Number(w.amount || 0))
      await supabase.from("users").update({ balance: newBalance }).eq("email", w.email)
    }
    loadAdminData()
  }

  const updateKycStatus = async (id: string, status: string) => {
    await supabase.from("users").update({ kyc_status: status }).eq("id", id)
    loadAdminData()
  }

  const pendingDeposits = deposits.filter((d: any) => d.status === "pending")
  const pendingWithdrawals = withdrawals.filter((w: any) => w.status === "pending")

  const NavItem = ({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) => (
    <button onClick={onClick} className="w-full text-left px-6 py-3 rounded-xl flex items-center gap-3 text-zinc-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition group">
      <Icon size={20} className="group-hover:text-emerald-400" />
      <span className="font-medium">{label}</span>
    </button>
  )

  return (
    <>
      {authLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <h1 className="text-3xl font-bold">Checking admin session…</h1>
            <p className="text-zinc-400 mt-3">Please wait while we verify your access.</p>
          </div>
        </div>
      ) : !sessionActive ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="rounded-3xl border border-white/10 bg-black/40 p-8 max-w-md w-full mx-6">
            <h1 className="text-4xl font-black text-center">Admin Login</h1>
            <p className="text-zinc-400 text-center mt-2">Sign in to access the admin dashboard.</p>
            <div className="mt-8 space-y-5">
              <input type="email" placeholder="Admin email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-4 outline-none text-white placeholder-zinc-500" />
              <input type="password" placeholder="Password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-4 outline-none text-white placeholder-zinc-500" />
              <button onClick={handleAdminLogin} disabled={authLoading} className="w-full rounded-2xl bg-emerald-500 py-4 font-bold text-black hover:bg-emerald-400 transition disabled:opacity-50">{authLoading ? "Signing in..." : "Login"}</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
            <div>
              <h1 className="text-4xl font-black">Admin Dashboard</h1>
              <p className="text-zinc-400 mt-2">Manage users, deposits, withdrawals, and KYC verifications.</p>
            </div>

            <div className="rounded-3xl bg-white/5 border border-white/10 px-5 py-4 text-zinc-200">
              <div className="flex items-center gap-3">
                <Clock3 className="text-emerald-400" size={18} />
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated</p>
                  <p className="text-sm">{lastUpdated}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            <div onClick={() => router.push('/admin/users')} className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 hover:bg-white/10 transition cursor-pointer">
              <div className="flex items-center justify-between"><p className="text-zinc-400">Total Users</p><Users className="text-emerald-400" size={24} /></div>
              <h2 className="mt-4 text-4xl font-black">{totalUsers}</h2>
            </div>

            <div onClick={() => router.push('/admin/deposits-list')} className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 hover:bg-white/10 transition cursor-pointer">
              <div className="flex items-center justify-between"><p className="text-zinc-400">Total Deposits</p><Wallet className="text-emerald-400" size={24} /></div>
              <h2 className="mt-4 text-4xl font-black">${totalDeposits.toFixed(2)}</h2>
            </div>

            <div onClick={() => router.push('/admin/withdrawals-list')} className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 hover:bg-white/10 transition cursor-pointer">
              <div className="flex items-center justify-between"><p className="text-zinc-400">Total Withdrawals</p><ArrowUpRight className="text-emerald-400" size={24} /></div>
              <h2 className="mt-4 text-4xl font-black">${totalWithdrawals.toFixed(2)}</h2>
            </div>

            <div onClick={() => router.push('/admin/kyc')} className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 hover:bg-white/10 transition cursor-pointer">
              <div className="flex items-center justify-between"><p className="text-zinc-400">KYC Requests</p><ShieldCheck className="text-emerald-400" size={24} /></div>
              <h2 className="mt-4 text-4xl font-black">{totalKyc}</h2>
            </div>
              <div onClick={() => router.push('/admin/email-verifications')} className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 hover:bg-white/10 transition cursor-pointer">
                <div className="flex items-center justify-between"><p className="text-zinc-400">Pending Email Verifications</p><ShieldCheck className="text-emerald-400" size={24} /></div>
                <h2 className="mt-4 text-4xl font-black">{pendingEmailVerifications}</h2>
              </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Recent Deposits</h2>
                  <p className="text-zinc-400 mt-1">Latest deposit transactions</p>
                </div>
                <Activity className="text-emerald-400" size={24} />
              </div>

              <div className="space-y-4">
                {deposits.length === 0 ? (
                  <p className="text-zinc-400 text-center py-8">No deposits yet</p>
                ) : (
                  deposits.map((deposit) => (
                    <div key={deposit.id} className="rounded-2xl border border-white/5 bg-black/20 p-4 flex items-center justify-between hover:bg-black/40 transition">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{deposit.email}</p>
                        <p className="text-xs text-zinc-400 mt-1">{formatDate(deposit.created_at)}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-emerald-400">${deposit.amount}</p>
                        <span className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${deposit.status === "approved" ? "bg-emerald-500/20 text-emerald-400" : deposit.status === "pending" ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"}`}>{deposit.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Pending KYC</h2>
                  <p className="text-zinc-400 mt-1">Awaiting verification</p>
                </div>
                <ShieldCheck className="text-amber-400" size={24} />
              </div>

              <div className="space-y-3">
                {pendingKyc.length === 0 ? (
                  <p className="text-zinc-400 text-center py-8">No pending requests</p>
                ) : (
                  pendingKyc.map((kyc) => (
                    <div key={kyc.id} className="rounded-2xl border border-white/5 bg-black/20 p-4 hover:bg-black/40 transition">
                      <p className="font-medium text-sm truncate">{kyc.email}</p>
                      <p className="text-xs text-zinc-400 mt-2">{kyc.full_name || "—"}</p>
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 inline-block mt-2">Pending</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
