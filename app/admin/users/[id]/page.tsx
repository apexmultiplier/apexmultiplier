"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ArrowLeft } from "lucide-react"

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [deposits, setDeposits] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>([])

  useEffect(() => {
    if (!id) return
    loadUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const loadUser = async () => {
    setLoading(true)
    const { data: userData, error: userErr } = await supabase.from("users").select("*").eq("id", id).single()
    if (userErr) {
      console.error(userErr)
      alert("Failed to load user")
      setLoading(false)
      return
    }
    setUser(userData)

    const [{ data: depData }, { data: wdrData }, { data: ticketsData }] = await Promise.all([
      supabase.from("deposits").select("*").eq("email", userData.email).order("created_at", { ascending: false }),
      supabase.from("withdrawals").select("*").eq("email", userData.email).order("created_at", { ascending: false }),
      supabase.from("support_tickets").select("*").eq("user_id", id).order("created_at", { ascending: false }),
    ])

    setDeposits(depData || [])
    setWithdrawals(wdrData || [])
    setTickets(ticketsData || [])

    setLoading(false)
  }

  const updateUserStatus = async (newStatus: string) => {
    if (!user) return
    try {
      const { error } = await supabase.from("users").update({ status: newStatus }).eq("id", user.id)
      if (error) {
        alert("Failed to update status: " + error.message)
        return
      }
      alert("Status updated")
      loadUser()
    } catch (err) {
      console.error(err)
      alert("Unexpected error")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] text-white p-6">
        <div className="max-w-5xl mx-auto text-center py-12">Loading user...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050816] text-white p-6">
        <div className="max-w-5xl mx-auto text-center py-12">User not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => router.push("/admin/users")} className="flex items-center gap-2 mb-6 text-emerald-400 hover:text-emerald-300 transition">
          <ArrowLeft size={20} /> Back to Users
        </button>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 mb-6">
          <h1 className="text-2xl font-bold">{user.full_name || user.email}</h1>
          <p className="text-zinc-400 mt-1">UID: {user.unique_id || user.id}</p>
          <p className="text-zinc-400 mt-1">Email: {user.email}</p>
          <p className="text-zinc-400 mt-1">Joined: {user.created_at ? new Date(user.created_at).toLocaleString() : "—"}</p>

          <div className="mt-4 flex items-center gap-2">
            <button onClick={() => updateUserStatus("active")} className="px-3 py-2 rounded-md bg-emerald-500/20 text-emerald-400">Activate</button>
            <button onClick={() => updateUserStatus("suspended")} className="px-3 py-2 rounded-md bg-amber-500/20 text-amber-400">Suspend</button>
            <button onClick={() => updateUserStatus("banned")} className="px-3 py-2 rounded-md bg-red-500/20 text-red-400">Ban</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 rounded-3xl border border-white/10 bg-white/5 p-4">
            <h2 className="font-bold">Profile Details</h2>
            <div className="mt-2 text-sm text-zinc-300">
              <p><strong>Full name:</strong> {user.full_name || "—"}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Unique ID:</strong> {user.unique_id || user.id}</p>
              <p><strong>Balance:</strong> ${Number(user.balance || 0).toFixed(2)}</p>
              <p><strong>KYC:</strong> {user.kyc_status || (user.govt_id_number ? "Pending" : "Not Started")}</p>
            </div>
          </div>

          <div className="lg:col-span-1 rounded-3xl border border-white/10 bg-white/5 p-4">
            <h2 className="font-bold">Deposits</h2>
            <div className="mt-2 text-sm text-zinc-300 space-y-2 max-h-60 overflow-auto">
              {deposits.length === 0 ? <p className="text-zinc-400">No deposits</p> : deposits.map((d) => (
                <div key={d.id} className="p-2 border-b border-white/5">
                  <div className="flex justify-between">
                    <div>${Number(d.amount || 0).toFixed(2)} <span className="text-xs text-zinc-400">{d.plan_name || ""}</span></div>
                    <div className="text-xs text-zinc-400">{d.status}</div>
                  </div>
                  <div className="text-xs text-zinc-500">{d.created_at ? new Date(d.created_at).toLocaleString() : ""}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1 rounded-3xl border border-white/10 bg-white/5 p-4">
            <h2 className="font-bold">Withdrawals</h2>
            <div className="mt-2 text-sm text-zinc-300 space-y-2 max-h-60 overflow-auto">
              {withdrawals.length === 0 ? <p className="text-zinc-400">No withdrawals</p> : withdrawals.map((w) => (
                <div key={w.id} className="p-2 border-b border-white/5">
                  <div className="flex justify-between">
                    <div>${Number(w.amount || 0).toFixed(2)}</div>
                    <div className="text-xs text-zinc-400">{w.status}</div>
                  </div>
                  <div className="text-xs text-zinc-500">{w.created_at ? new Date(w.created_at).toLocaleString() : ""}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
          <h2 className="font-bold">Support Tickets</h2>
          <div className="mt-2 space-y-3 text-sm text-zinc-300">
            {tickets.length === 0 ? (
              <p className="text-zinc-400">No support tickets</p>
            ) : (
              tickets.map((t) => (
                <div key={t.id} className="p-3 border-b border-white/5">
                  <div className="flex justify-between">
                    <div>{t.subject || "Support"}</div>
                    <div className="text-xs text-zinc-400">{t.status}</div>
                  </div>
                  <div className="text-xs text-zinc-500">{t.created_at ? new Date(t.created_at).toLocaleString() : ""}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
