"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../../lib/supabase"
import Link from "next/link"

export default function DashboardSupport() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setErrorMessage(null)
        const { data: authData, error: authError } = await supabase.auth.getUser()
        if (authError) console.error("auth.getUser error:", authError)
        const user = authData?.user ?? null
        console.log("Dashboard: current user id:", user?.id ?? null)

        let q = supabase.from("support_tickets").select("*").order("created_at", { ascending: false })
        if (user?.id) q = q.eq("user_id", user.id)
        const { data, error } = await q
        console.log("Select result:", data, "Select error:", error)
        if (error) {
          console.error("Error fetching tickets:", error)
          if (mounted) setErrorMessage(error.message || "Failed to load tickets")
        } else {
          if (mounted) setTickets(data ?? [])
        }
      } catch (err) {
        console.error(err)
        if (mounted) setErrorMessage((err as any).message || "Failed to load tickets")
      }
      if (mounted) setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <main className="min-h-screen bg-[#020406] text-white py-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
          <h1 className="text-2xl font-black">My Support Tickets</h1>
          <p className="mt-2 text-zinc-300">View the tickets you submitted and track status.</p>

          <div className="mt-6">
            {loading ? (
              <p className="text-zinc-400">Loading…</p>
            ) : errorMessage ? (
              <p className="text-rose-400">{errorMessage}</p>
            ) : (
              <div className="space-y-4">
                {tickets.length === 0 ? <p className="text-zinc-400">No tickets found.</p> : tickets.map((t) => (
                  <div key={t.id} className="rounded-[12px] border border-white/8 bg-white/6 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold">{t.subject}</p>
                        <p className="text-sm text-zinc-400">{t.category} • {new Date(t.created_at).toLocaleString()}</p>
                      </div>
                      <div className="text-sm text-zinc-300">{t.status}</div>
                    </div>
                    <div className="mt-3 text-zinc-300">{t.message}</div>
                    {t.admin_reply ? <div className="mt-3 rounded-md bg-white/5 p-3 text-zinc-200">Admin: {t.admin_reply}</div> : null}
                    {t.screenshot_url ? <div className="mt-3"><a href={t.screenshot_url} target="_blank" rel="noreferrer" className="text-[#00ffae]">View Attachment</a></div> : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 text-right">
            <Link href="/support" className="text-[#00ffae]">Submit a new ticket</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
