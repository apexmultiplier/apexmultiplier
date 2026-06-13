"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Deposit = {
  id: number
  email: string
  amount: number | string
  status: string
  network?: string | null
  payment_method?: string | null
  method?: string | null
  screenshot_url?: string | null
  screenshot?: string | null
  created_at?: string | null
  admin_note?: string | null
}

type UserData = {
  email: string
  balance?: number | string | null
}

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usersMap, setUsersMap] = useState<Record<string, any>>({})
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({})
  const [adminNotes, setAdminNotes] = useState<Record<number, string>>({})

  useEffect(() => {
    fetchDeposits()
  }, [])

  const fetchDeposits = async () => {
    setLoading(true)
    setError(null)
    try {
      const [{ data: depositsData, error: dErr }, { data: usersData, error: uErr }] = await Promise.all([
        supabase.from("deposits").select("*").order("id", { ascending: false }),
        supabase.from("users").select("id,email,unique_id,full_name,balance").order("created_at", { ascending: false }),
      ])

      if (dErr) throw dErr;
      if (uErr) console.warn("Users fetch warning:", uErr);

      const userMap: Record<string, any> = {};
      ;(usersData || []).forEach((u: any) => {
        userMap[u.email] = u;
        userMap[u.id] = u;
      });

      setUsersMap(userMap)
      setDeposits(depositsData || [])
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to load deposits. Ensure the 'deposits' table exists.")
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (
    id: number,
    statusValue: string
  ) => {
    setActionLoading((s) => ({ ...s, [id]: true }))
    try {
      const deposit = deposits.find((item) => item.id === id)
      if (!deposit) throw new Error("Deposit not found")

      // update deposit status and optional admin_note
      const updatePayload: any = { status: statusValue }
      if (adminNotes[id]) updatePayload.admin_note = adminNotes[id]

      // Call server API to perform approval actions with service role privileges
      const res = await fetch('/api/admin/approve-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: statusValue, admin_note: adminNotes[id] || null }),
      })

      const body = await res.json()
      if (!res.ok) {
        throw new Error(body?.error || 'Failed to approve deposit via server')
      }

      // refresh
      await fetchDeposits()
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to update deposit status")
    } finally {
      setActionLoading((s) => ({ ...s, [id]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-[#030507] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black">Admin Deposits</h1>
          <p className="text-zinc-400 mt-2">
            Manage user deposit requests and approve payments.
          </p>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : deposits.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
            <h2 className="text-2xl font-bold">No Deposits Found</h2>
          </div>
        ) : (
          <div className="space-y-6">
            {error && <div className="text-red-400 p-4 rounded-lg">{error}</div>}

            {['pending','approved','rejected'].map((st) => {
              const list = deposits.filter((d) => (d.status || 'pending').toLowerCase() === st)
              return (
                <div key={st}>
                  <h2 className="text-2xl font-bold mb-3">{st.charAt(0).toUpperCase() + st.slice(1)} Deposits ({list.length})</h2>
                  {list.length === 0 ? (
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-zinc-400">No {st} deposits</div>
                  ) : (
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 overflow-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-zinc-400 border-b border-white/10">
                            <th className="text-left py-3 px-3">User</th>
                            <th className="text-left py-3 px-3">UID</th>
                            <th className="text-left py-3 px-3">Amount</th>
                            <th className="text-left py-3 px-3">Payment Method</th>
                            <th className="text-left py-3 px-3">Screenshot</th>
                            <th className="text-left py-3 px-3">Date</th>
                            <th className="text-left py-3 px-3">Admin Note</th>
                            <th className="text-left py-3 px-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {list.map((deposit) => (
                            <tr key={deposit.id} className="border-b border-white/5 hover:bg-white/5 transition">
                              <td className="py-3 px-3">
                                <div className="text-sm font-medium">{usersMap[deposit.email]?.full_name || deposit.email}</div>
                                <div className="text-xs text-zinc-400">{deposit.email}</div>
                              </td>
                              <td className="py-3 px-3 text-xs text-zinc-400">{usersMap[deposit.email]?.unique_id || usersMap[deposit.email]?.id || '—'}</td>
                              <td className="py-3 px-3">${Number(deposit.amount || 0).toFixed(2)}</td>
                              <td className="py-3 px-3 text-zinc-400">{(deposit.payment_method || deposit.method || deposit.network) || '—'}</td>
                              <td className="py-3 px-3">
                                {deposit.screenshot_url || deposit.screenshot ? (
                                  <a href={deposit.screenshot_url || deposit.screenshot || "#"} target="_blank" rel="noreferrer" className="text-emerald-400 underline">View</a>
                                ) : (
                                  <span className="text-zinc-400">—</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-zinc-400 text-xs">{deposit.created_at ? new Date(deposit.created_at).toLocaleString() : '—'}</td>
                              <td className="py-3 px-3">
                                <input value={adminNotes[deposit.id] || (deposit.admin_note || '')} onChange={(e) => setAdminNotes((s) => ({ ...s, [deposit.id]: e.target.value }))} className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none" placeholder="Add admin note" />
                                <div className="mt-2 text-xs text-zinc-400">Existing: {deposit.admin_note || '—'}</div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex gap-2">
                                  <button disabled={actionLoading[deposit.id]} onClick={() => updateStatus(deposit.id, 'approved')} className="px-3 py-2 rounded-md bg-emerald-500/20 text-emerald-400 text-sm">{actionLoading[deposit.id] ? '...' : 'Approve'}</button>
                                  <button disabled={actionLoading[deposit.id]} onClick={() => updateStatus(deposit.id, 'rejected')} className="px-3 py-2 rounded-md bg-red-500/20 text-red-400 text-sm">{actionLoading[deposit.id] ? '...' : 'Reject'}</button>
                                  <button disabled={actionLoading[deposit.id]} onClick={async () => {
                                    setActionLoading((s) => ({ ...s, [deposit.id]: true }))
                                    try {
                                      const note = adminNotes[deposit.id]
                                      const { error: noteErr } = await supabase.from('deposits').update({ admin_note: note || null }).eq('id', deposit.id)
                                      if (noteErr) throw noteErr
                                      alert('Note saved')
                                      await fetchDeposits()
                                    } catch (err: any) {
                                      console.error(err)
                                      alert(err.message || 'Failed to save note')
                                    } finally {
                                      setActionLoading((s) => ({ ...s, [deposit.id]: false }))
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

