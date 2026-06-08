"use client"

import { useEffect, useState } from "react"
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
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usersMap, setUsersMap] = useState<Record<string, any>>({})
  const [adminNotes, setAdminNotes] = useState<Record<number, string>>({})
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({})

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  const fetchWithdrawals = async () => {
    setLoading(true)
    setError(null)
    try {
      const [{ data: wData, error: wErr }, { data: usersData, error: uErr }] = await Promise.all([
        supabase.from("withdrawals").select("*").order("id", { ascending: false }),
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

            {['pending','approved','rejected'].map((st) => {
              const list = withdrawals.filter((w) => (w.status || 'pending').toLowerCase() === st)
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
                            <th className="text-left py-3 px-3">Amount</th>
                            <th className="text-left py-3 px-3">Wallet</th>
                            <th className="text-left py-3 px-3">Request Date</th>
                            <th className="text-left py-3 px-3">Admin Note</th>
                            <th className="text-left py-3 px-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {list.map((w) => (
                            <tr key={w.id} className="border-b border-white/5 hover:bg-white/5 transition">
                              <td className="py-3 px-3">
                                <div className="text-sm font-medium">{usersMap[w.email]?.full_name || w.email}</div>
                                <div className="text-xs text-zinc-400">{w.email}</div>
                              </td>
                              <td className="py-3 px-3 text-xs text-zinc-400">{usersMap[w.email]?.unique_id || usersMap[w.email]?.id || '—'}</td>
                              <td className="py-3 px-3">${Number(w.amount || 0).toFixed(2)}</td>
                              <td className="py-3 px-3 break-all text-sm">{w.wallet}</td>
                              <td className="py-3 px-3 text-zinc-400 text-xs">{w.created_at ? new Date(w.created_at).toLocaleString() : '—'}</td>
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