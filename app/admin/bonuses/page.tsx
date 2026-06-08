"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, Plus, Search, X } from "lucide-react"

type Bonus = {
  id: string
  user_id: string
  user_name?: string
  user_email?: string
  amount: number
  reason?: string
  status: string
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

export default function BonusesPage() {
  const router = useRouter()
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [amount, setAmount] = useState<number | string>("")
  const [reason, setReason] = useState("")
  const [status, setStatus] = useState("Active")
  const [adding, setAdding] = useState(false)

  // filters
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadBonuses()
    loadUsers()

    const channel = supabase
      .channel("bonuses")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bonuses" },
        () => loadBonuses()
      )
      .subscribe()

    return () => channel.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadBonuses = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from("bonuses")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setBonuses((data || []) as Bonus[])
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to load bonuses. If the 'bonuses' table is missing, create it in Supabase with the columns: id, user_id, user_name, user_email, amount, reason, status, created_at.")
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const { data } = await supabase.from("users").select("id, email, full_name, balance").order("created_at", { ascending: false })
      setUsers(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = useMemo(() => {
    if (!searchTerm) return bonuses
    return bonuses.filter((b) => (b.user_email || "").toLowerCase().includes(searchTerm.toLowerCase()) || (b.user_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (b.reason || "").toLowerCase().includes(searchTerm.toLowerCase()))
  }, [bonuses, searchTerm])

  const handleAddBonus = async () => {
    if (!selectedUserId) return alert("Select a user")
    if (!amount || Number(amount) <= 0) return alert("Enter a valid amount")

    setAdding(true)
    try {
      const user = users.find((u) => u.id === selectedUserId)
      const user_email = user?.email || null
      const user_name = user?.full_name || null

      // insert bonus
      const { error: insertErr } = await supabase.from("bonuses").insert([{
        user_id: selectedUserId,
        user_name,
        user_email,
        amount: Number(amount),
        reason,
        status,
      }])

      if (insertErr) throw insertErr

      // if active, update user balance
      if (status === "Active") {
        const newBalance = (Number(user?.balance || 0) + Number(amount))
        await supabase.from("users").update({ balance: newBalance }).eq("id", selectedUserId)
      }

      // insert transaction
      const { error: txErr } = await supabase.from("transactions").insert([{
        user_id: selectedUserId,
        type: "Bonus",
        amount: Number(amount),
        status: status === "Active" ? "Completed" : status,
        network: null,
      }])

      if (txErr) console.error("Transaction insert error:", txErr)

      setShowModal(false)
      setAmount("")
      setReason("")
      setSelectedUserId(null)
      loadBonuses()
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to add bonus")
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => router.push('/admin')} className="flex items-center gap-2 mb-6 text-emerald-400 hover:text-emerald-300 transition"><ArrowLeft size={20} />Back to Dashboard</button>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black">Bonuses</h1>
            <p className="text-zinc-400 mt-2">Manage bonus allocations to users and review history.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative mr-2">
              <Search className="absolute left-3 top-3 text-zinc-400" size={18} />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by user, email or reason..." className="pl-10 pr-4 py-3 rounded-2xl bg-black/40 border border-white/10 outline-none" />
            </div>

            <button onClick={() => setShowModal(true)} className="rounded-2xl bg-emerald-500 px-4 py-3 font-bold text-black hover:bg-emerald-400 transition flex items-center gap-2"><Plus size={16} />Add Bonus</button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 overflow-x-auto">
          {loading ? (
            <div className="text-center py-12"><div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : error ? (
            <div className="text-center py-12 text-red-400">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">No bonuses found</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400">
                  <th className="text-left py-3 px-4">User Name</th>
                  <th className="text-left py-3 px-4">User Email</th>
                  <th className="text-right py-3 px-4">Bonus Amount</th>
                  <th className="text-left py-3 px-4">Reason</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="py-4 px-4">{b.user_name || '—'}</td>
                    <td className="py-4 px-4 text-emerald-400">{b.user_email || '—'}</td>
                    <td className="py-4 px-4 text-right font-bold">${Number(b.amount || 0).toFixed(2)}</td>
                    <td className="py-4 px-4">{b.reason || '—'}</td>
                    <td className="py-4 px-4"><span className={`px-3 py-1 rounded-full text-xs ${b.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : b.status === 'Pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>{b.status}</span></td>
                    <td className="py-4 px-4 text-zinc-400 text-xs">{formatDateDisplay(b.created_at)}</td>
                    <td className="py-4 px-4 text-zinc-400 text-xs">{formatTimeDisplay(b.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Add Bonus</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white"><X /></button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-zinc-400 text-sm">Select User</label>
                <select value={selectedUserId || ""} onChange={(e) => setSelectedUserId(e.target.value || null)} className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 outline-none mt-2">
                  <option value="">Select a user</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.full_name ? `${u.full_name} — ${u.email}` : u.email}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-zinc-400 text-sm">Bonus Amount</label>
                <input type="number" value={amount as any} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 outline-none mt-2" />
              </div>

              <div>
                <label className="text-zinc-400 text-sm">Bonus Reason</label>
                <input value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 outline-none mt-2" />
              </div>

              <div>
                <label className="text-zinc-400 text-sm">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 outline-none mt-2">
                  <option>Active</option>
                  <option>Pending</option>
                  <option>Removed</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button onClick={() => setShowModal(false)} className="rounded-2xl bg-white/5 px-4 py-3 font-bold">Cancel</button>
                <button onClick={handleAddBonus} disabled={adding} className="rounded-2xl bg-emerald-500 px-4 py-3 font-bold text-black">{adding ? 'Adding...' : 'Add Bonus'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
