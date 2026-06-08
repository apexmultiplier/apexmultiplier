"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function AdminEmailVerificationsPage() {
  const [sessionActive, setSessionActive] = useState<boolean | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkAdminSession()
  }, [])

  useEffect(() => {
    if (sessionActive) loadRequests()
  }, [sessionActive])

  const checkAdminSession = async () => {
    const { data } = await supabase.auth.getSession()
    const active = !!data.session
    setSessionActive(active)
    setAuthLoading(false)
  }

  const loadRequests = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from("email_verification_requests")
        .select("*")
        .order("created_at", { ascending: false })

      setRequests(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const approve = async (id: number) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const adminEmail = sessionData?.session?.user?.email || "admin"

      await supabase.from("email_verification_requests").update({ status: "verified", verified_at: new Date().toISOString(), verified_by: adminEmail }).eq("id", id)
      // also update users table for quick lookup
      const { data: req } = await supabase.from("email_verification_requests").select("*").eq("id", id).single()
      if (req && req.email) {
        await supabase.from("users").upsert({ email: req.email, email_verification_status: "verified", email_verified_at: new Date().toISOString(), email_verified_by: adminEmail }, { onConflict: "email" })
      }
      loadRequests()
    } catch (e) {
      console.error(e)
      alert("Unable to approve request")
    }
  }

  const reject = async (id: number) => {
    try {
      await supabase.from("email_verification_requests").update({ status: "rejected" }).eq("id", id)
      loadRequests()
    } catch (e) {
      console.error(e)
      alert("Unable to reject request")
    }
  }

  if (authLoading) return <div className="p-6">Checking admin session...</div>
  if (!sessionActive) return <div className="p-6">Please sign in to access this page.</div>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Email Verification Requests</h1>
          <p className="text-zinc-400 mt-1">Review and manage user email verification requests.</p>
        </div>
        <Link href="/admin" className="text-sm text-zinc-400">Back to admin</Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        {loading ? (
          <div className="p-6 text-center">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-6 text-center text-zinc-400">No verification requests found.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-zinc-400 text-sm">
                  <th className="p-3">User</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Request Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-t border-white/6">
                    <td className="p-3">{r.user_id || '—'}</td>
                    <td className="p-3 break-words">{r.email}</td>
                    <td className="p-3">{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${r.status === 'verified' ? 'bg-emerald-500/15 text-emerald-300' : r.status === 'pending' ? 'bg-amber-500/15 text-amber-300' : 'bg-red-500/15 text-red-300'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {r.status !== 'verified' ? (
                          <button onClick={() => approve(r.id)} className="px-3 py-2 rounded-md bg-emerald-500 text-black font-semibold">Approve</button>
                        ) : null}
                        {r.status !== 'rejected' ? (
                          <button onClick={() => reject(r.id)} className="px-3 py-2 rounded-md bg-red-500 text-black font-semibold">Reject</button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
