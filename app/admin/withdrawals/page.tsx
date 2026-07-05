"use client"

import { useEffect, useState } from "react"
import { Copy } from "lucide-react"
import { supabase } from "@/lib/supabase"

type Withdrawal = {
  id: number
  email: string
  amount: number
  wallet: string
  network: string
  status: string
  created_at?: string | null
  admin_note?: string | null
  fee?: number | null
  receive_amount?: number | null
  withdrawal_type?: string | null
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usersMap, setUsersMap] = useState<Record<string, any>>({})
  const [adminNotes, setAdminNotes] = useState<Record<number, string>>({})
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({})
  const [copiedWalletId, setCopiedWalletId] = useState<number | null>(null)

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  useEffect(() => {
    if (copiedWalletId === null) return

    const timer = window.setTimeout(() => setCopiedWalletId(null), 2000)
    return () => window.clearTimeout(timer)
  }, [copiedWalletId])

  const fetchWithdrawals = async () => {
    setLoading(true)
    setError(null)
    try {
      const [{ data: wData, error: wErr }, { data: usersData, error: uErr }] = await Promise.all([
        supabase.from("withdrawals").select("*").order("created_at", { ascending: true }),
        supabase.from("users").select("id,email,unique_id,full_name").order("created_at", { ascending: false }),
      ])

      if (wErr) throw wErr
      if (uErr) console.warn("Users fetch warning:", uErr)

      const userMap: Record<string, any> = {}
      ;(usersData || []).forEach((u: any) => {
        userMap[u.email] = u
        userMap[u.id] = u
      })

      setUsersMap(userMap)
      setWithdrawals(wData || [])
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to load withdrawals")
    } finally {
      setLoading(false)
    }
  }

  const formatUsd = (value: number | string | null | undefined) => {
    const numericValue = Number(value || 0)
    if (!Number.isFinite(numericValue)) return "—"
    return `$${numericValue.toFixed(2)}`
  }

  const getTypeBadge = (value?: string | null) => {
    const normalized = (value || "").toLowerCase()
    if (normalized.includes("principal")) {
      return {
        label: "Principal Withdrawal",
        className: "border border-sky-400/20 bg-sky-500/15 text-sky-300",
      }
    }
    if (normalized.includes("profit")) {
      return {
        label: "Profit Withdrawal",
        className: "border border-emerald-400/20 bg-emerald-500/15 text-emerald-300",
      }
    }
    return {
      label: "Withdrawal",
      className: "border border-white/10 bg-white/10 text-zinc-200",
    }
  }

  const getStatusBadge = (value?: string | null) => {
    const normalized = (value || "pending").toLowerCase()
    if (normalized === "approved") {
      return "border border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
    }
    if (normalized === "rejected") {
      return "border border-red-400/20 bg-red-500/15 text-red-300"
    }
    return "border border-amber-400/20 bg-amber-500/15 text-amber-300"
  }

  const formatWallet = (wallet?: string | null) => {
    if (!wallet) return "—"
    if (wallet.length <= 16) return wallet
    return `${wallet.slice(0, 10)}...${wallet.slice(-8)}`
  }

  const copyWalletAddress = async (wallet?: string | null, id?: number) => {
    if (!wallet || !id) return

    try {
      await navigator.clipboard.writeText(wallet)
      setCopiedWalletId(id)
    } catch (err) {
      console.error(err)
    }
  }

  const updateStatus = async (id: number, statusValue: string) => {
    setActionLoading((s) => ({ ...s, [id]: true }))
    try {
      const withdraw = withdrawals.find((w) => w.id === id)
      if (!withdraw) throw new Error("Withdrawal not found")

      const updatePayload: any = { status: statusValue }
      if (adminNotes[id]) updatePayload.admin_note = adminNotes[id]

      const { error: updErr } = await supabase.from("withdrawals").update(updatePayload).eq("id", id)
      if (updErr) throw updErr

      // notify user (best-effort)
      const userId = usersMap[withdraw.email]?.id || null
      const notify = {
        user_id: userId,
        title: `Withdrawal ${statusValue}`,
        message: `Your withdrawal request of $${Number(withdraw.amount || 0).toFixed(2)} has been ${statusValue}.`,
        read: false,
      }
      const { error: notifyErr } = await supabase.from("notifications").insert([notify])
      if (notifyErr) console.warn("Notification insert warning:", notifyErr)

      await fetchWithdrawals()
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to update withdrawal")
    } finally {
      setActionLoading((s) => ({ ...s, [id]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-[#030507] text-white p-6">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <div className="mb-8">

          <h1 className="text-4xl font-black">
            Admin Withdrawals
          </h1>

          <p className="text-zinc-400 mt-2">
            Manage User Withdraw Requests
          </p>

        </div>

        {/* LOADING */}

        {loading ? (

          <p>Loading...</p>

        ) : (
          <div className="space-y-6">
            {error && <div className="text-red-400 p-4 rounded-lg">{error}</div>}

            {['pending','approved','rejected'].map((st: string) => {
              const list = withdrawals.filter((w: Withdrawal) => (w.status || 'pending').toLowerCase() === st)
              return (
                <div key={st}>
                  <h2 className="text-2xl font-bold mb-3">{st.charAt(0).toUpperCase() + st.slice(1)} Withdrawals ({list.length})</h2>
                  {list.length === 0 ? (
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-zinc-400">No {st} withdrawals</div>
                  ) : (
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 overflow-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-zinc-400 border-b border-white/10">
                            <th className="text-left py-3 px-3">User</th>
                            <th className="text-left py-3 px-3">UID</th>
                            <th className="text-left py-3 px-3">Type</th>
                            <th className="text-left py-3 px-3">Requested</th>
                            <th className="text-left py-3 px-3">Fee</th>
                            <th className="text-left py-3 px-3">Payable</th>
                            <th className="text-left py-3 px-3">Wallet</th>
                            <th className="text-left py-3 px-3">Network</th>
                            <th className="text-left py-3 px-3">Request Date</th>
                            <th className="text-left py-3 px-3">Status</th>
                            <th className="text-left py-3 px-3">Admin Note</th>
                            <th className="text-left py-3 px-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {list.map((w: Withdrawal) => (
                            <tr key={w.id} className="border-b border-white/5 hover:bg-white/5 transition">
                              <td className="py-3 px-3">
                                <div className="text-sm font-medium">{usersMap[w.email]?.full_name || w.email}</div>
                                <div className="text-xs text-zinc-400">{w.email}</div>
                              </td>
                              <td className="py-3 px-3 text-xs text-zinc-400">{usersMap[w.email]?.unique_id || usersMap[w.email]?.id || '—'}</td>
                              <td className="py-3 px-3">
                                <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getTypeBadge(w.withdrawal_type).className}`}>
                                  {getTypeBadge(w.withdrawal_type).label}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-white font-medium">{formatUsd(w.amount)}</td>
                              <td className="py-3 px-3 text-orange-300 font-medium">{formatUsd(w.fee)}</td>
                              <td className="py-3 px-3 text-emerald-400 font-semibold">{formatUsd(w.receive_amount)}</td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <span className="break-all text-sm text-zinc-100">{formatWallet(w.wallet)}</span>
                                  <button
                                    type="button"
                                    title="Copy Wallet Address"
                                    aria-label="Copy Wallet Address"
                                    onClick={() => copyWalletAddress(w.wallet, w.id)}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-500/10 text-emerald-300 transition hover:border-emerald-400/40 hover:bg-emerald-500/20 hover:shadow-[0_0_18px_rgba(0,255,174,0.16)]"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                {copiedWalletId === w.id && (
                                  <div className="mt-1 text-[11px] font-medium text-emerald-300">✅ Wallet Address Copied</div>
                                )}
                              </td>
                              <td className="py-3 px-3 text-sm text-cyan-300">{w.network || '—'}</td>
                              <td className="py-3 px-3 text-zinc-400 text-xs">{w.created_at ? new Date(w.created_at).toLocaleString() : '—'}</td>
                              <td className="py-3 px-3">
                                <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusBadge(w.status)}`}>
                                  {(w.status || 'pending').toLowerCase() === 'approved' ? 'Approved' : (w.status || 'pending').toLowerCase() === 'rejected' ? 'Rejected' : 'Pending'}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <input value={adminNotes[w.id] || (w.admin_note || '')} onChange={(e) => setAdminNotes((s) => ({ ...s, [w.id]: e.target.value }))} className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none" placeholder="Add admin note" />
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex gap-2">
                                  <button disabled={actionLoading[w.id]} onClick={() => updateStatus(w.id, 'approved')} className="px-3 py-2 rounded-md bg-emerald-500/20 text-emerald-400 text-sm">{actionLoading[w.id] ? '...' : 'Approve'}</button>
                                  <button disabled={actionLoading[w.id]} onClick={() => updateStatus(w.id, 'rejected')} className="px-3 py-2 rounded-md bg-red-500/20 text-red-400 text-sm">{actionLoading[w.id] ? '...' : 'Reject'}</button>
                                  <button disabled={actionLoading[w.id]} onClick={async () => {
                                    setActionLoading((s) => ({ ...s, [w.id]: true }))
                                    try {
                                      const note = adminNotes[w.id]
                                      const { error: noteErr } = await supabase.from('withdrawals').update({ admin_note: note || null }).eq('id', w.id)
                                      if (noteErr) throw noteErr
                                      alert('Note saved')
                                      await fetchWithdrawals()
                                    } catch (err: any) {
                                      console.error(err)
                                      alert(err.message || 'Failed to save note')
                                    } finally {
                                      setActionLoading((s) => ({ ...s, [w.id]: false }))
                                    }
                                  }} className="px-3 py-2 rounded-md bg-white/5 text-zinc-200 text-sm">Save Note</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

      </div>

    </div>
  )
}