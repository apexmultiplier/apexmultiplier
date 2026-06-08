"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, Search } from "lucide-react"

type Tx = {
  id: string
  user_id: string
  type: string
  amount: number
  status: string
  network?: string
  created_at?: string | null
}

type TxRow = {
  id: string
  user_id: string
  user_email?: string
  user_name?: string
  type: string
  amount: number
  status: string
  network?: string
  created_at?: string | null
}

function formatDateDisplay(value?: string | null) {
  if (!value) return "—"
  const d = new Date(value)
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
}

function formatTimeDisplay(value?: string | null) {
  if (!value) return "—"
  const d = new Date(value)
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
}

export default function TransactionsPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<TxRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // filters
  const [searchEmail, setSearchEmail] = useState("")
  const [searchUser, setSearchUser] = useState("")
  const [typeFilter, setTypeFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState<string | null>(null)

  useEffect(() => {
    loadTransactions()

    const channel = supabase
      .channel("transactions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => loadTransactions()
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadTransactions = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from<Tx>("transactions")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      const txs = data || []
      const userIds = Array.from(new Set(txs.map((t) => t.user_id))).filter(Boolean)

      let usersMap: Record<string, { email?: string; name?: string }> = {}
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from("users")
          .select("id,email,full_name")
          .in("id", userIds)

        usersMap = (users || []).reduce((acc: any, u: any) => {
          acc[u.id] = { email: u.email, name: u.full_name }
          return acc
        }, {})
      }

      const rows: TxRow[] = txs.map((t) => ({
        id: String(t.id),
        user_id: t.user_id,
        user_email: usersMap[t.user_id]?.email,
        user_name: usersMap[t.user_id]?.name,
        type: t.type,
        amount: Number(t.amount || 0),
        status: t.status,
        network: t.network,
        created_at: t.created_at,
      }))

      setTransactions(rows)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to load transactions")
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (searchEmail && !(t.user_email || "").toLowerCase().includes(searchEmail.toLowerCase())) return false
      if (searchUser && !(t.user_name || "").toLowerCase().includes(searchUser.toLowerCase())) return false
      if (typeFilter !== "All" && t.type !== typeFilter) return false
      if (statusFilter !== "All" && t.status !== statusFilter) return false
      if (dateFrom) {
        const from = new Date(dateFrom)
        const txDate = t.created_at ? new Date(t.created_at) : null
        if (!txDate || txDate < from) return false
      }
      if (dateTo) {
        const to = new Date(dateTo)
        const txDate = t.created_at ? new Date(t.created_at) : null
        if (!txDate || txDate > to) return false
      }
      return true
    })
  }, [transactions, searchEmail, searchUser, typeFilter, statusFilter, dateFrom, dateTo])

  return (
    <div className="min-h-screen bg-[#050816] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => router.push('/admin')} className="flex items-center gap-2 mb-6 text-emerald-400 hover:text-emerald-300 transition"><ArrowLeft size={20} />Back to Dashboard</button>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 mb-6">
          <h1 className="text-4xl font-black">Transactions</h1>
          <p className="text-zinc-400 mt-2">All transaction history: deposits, withdrawals, ROI, bonuses and referrals.</p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-3 text-zinc-400" size={18} />
              <input value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} placeholder="Search by email..." className="w-full pl-12 pr-4 py-3 rounded-2xl bg-black/40 border border-white/10 outline-none" />
            </div>

            <div className="relative">
              <input value={searchUser} onChange={(e) => setSearchUser(e.target.value)} placeholder="Search by user name..." className="w-full pl-4 pr-4 py-3 rounded-2xl bg-black/40 border border-white/10 outline-none" />
            </div>

            <div className="flex gap-2">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-1/2 rounded-2xl bg-black/40 border border-white/10 px-3 py-3 outline-none">
                <option>All</option>
                <option>Deposit</option>
                <option>Withdrawal</option>
                <option>ROI Profit</option>
                <option>Bonus</option>
                <option>Referral Reward</option>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-1/2 rounded-2xl bg-black/40 border border-white/10 px-3 py-3 outline-none">
                <option>All</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
                <option>Completed</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="date" onChange={(e) => setDateFrom(e.target.value || null)} className="rounded-2xl bg-black/40 border border-white/10 px-3 py-3 outline-none" />
            <input type="date" onChange={(e) => setDateTo(e.target.value || null)} className="rounded-2xl bg-black/40 border border-white/10 px-3 py-3 outline-none" />
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">No transactions found</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400">
                  <th className="text-left py-3 px-4">Transaction ID</th>
                  <th className="text-left py-3 px-4">User Name</th>
                  <th className="text-left py-3 px-4">User Email</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-right py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Network</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="py-4 px-4 text-emerald-400">{row.id}</td>
                    <td className="py-4 px-4">{row.user_name || '—'}</td>
                    <td className="py-4 px-4 text-zinc-300">{row.user_email || '—'}</td>
                    <td className="py-4 px-4">{row.type}</td>
                    <td className="py-4 px-4 text-right font-bold">${row.amount.toFixed(2)}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${row.status === 'Approved' || row.status === 'approved' || row.status === 'Completed' || row.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : row.status === 'Pending' || row.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>{row.status}</span>
                    </td>
                    <td className="py-4 px-4 text-xs">{row.network || '—'}</td>
                    <td className="py-4 px-4 text-zinc-400 text-xs">{formatDateDisplay(row.created_at)}</td>
                    <td className="py-4 px-4 text-zinc-400 text-xs">{formatTimeDisplay(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
