"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../../lib/supabase"
import { ChevronRight } from "lucide-react"

export default function AdminSupportTickets() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("All")
  const [search, setSearch] = useState<string>("")
  const [adminReplies, setAdminReplies] = useState<Record<number, string>>({})
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({})

  async function load() {
    setLoading(true)
    let q: any = supabase.from("support_tickets").select("*").order("created_at", { ascending: false })
    if (filter !== "All") q = q.eq("status", filter)
    if (search) {
      const trimmed = search.trim()
      if (/^\d+$/.test(trimmed)) {
        q = q.eq("id", Number(trimmed))
      } else {
        const term = `%${trimmed.replace(/%/g, "\\%")}%`
        q = q.or(`email.ilike.${term},full_name.ilike.${term},subject.ilike.${term},category.ilike.${term}`)
      }
    }
    const { data, error } = await q
    if (error) console.error(error)
    setTickets(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  async function updateStatus(id: number, status: string) {
    setActionLoading((s) => ({ ...s, [id]: true }))
    try {
      const { error } = await supabase.from("support_tickets").update({ status }).eq("id", id)
      if (error) throw error
      // notify user
      const ticket = tickets.find((t) => t.id === id)
      if (ticket) {
        const notify = { user_id: ticket.user_id || null, title: `Ticket ${status}`, message: `Your support ticket #${id} status changed to ${status}.`, read: false }
        const { error: nErr } = await supabase.from("notifications").insert([notify])
        if (nErr) console.warn("Notification insert warning:", nErr)
      }
      await load()
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to update status")
    } finally {
      setActionLoading((s) => ({ ...s, [id]: false }))
    }
  }

  async function replyToTicket(id: number, reply: string) {
    if (!reply || reply.trim().length === 0) {
      alert('Reply cannot be empty')
      return
    }
    if (reply.length > 2000) {
      alert('Reply is too long')
      return
    }
    setActionLoading((s) => ({ ...s, [id]: true }))
    try {
      const { error } = await supabase.from("support_tickets").update({ admin_reply: reply.trim(), status: 'In Progress' }).eq("id", id)
      if (error) throw error
      const ticket = tickets.find((t) => t.id === id)
      if (ticket) {
        const notify = { user_id: ticket.user_id || null, title: `Reply to ticket #${id}`, message: `Admin replied: ${reply.trim().slice(0, 200)}`, read: false }
        const { error: nErr } = await supabase.from("notifications").insert([notify])
        if (nErr) console.warn("Notification insert warning:", nErr)
      }
      await load()
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to send reply")
    } finally {
      setActionLoading((s) => ({ ...s, [id]: false }))
    }
  }

  return (
    <main className="min-h-screen bg-[#020406] text-white py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
          <h1 className="text-2xl font-black">Support Tickets (Admin)</h1>
          <div className="mt-4 flex gap-3 items-center">
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="p-2 bg-[#03121c] border border-white/6 rounded-md">
              <option>All</option>
              <option>Open</option>
              <option>In Progress</option>
              <option>Resolved</option>
              <option>Closed</option>
            </select>
            <input placeholder="Search by email or ticket ID" value={search} onChange={(e) => setSearch(e.target.value)} className="p-2 bg-[#03121c] border border-white/6 rounded-md flex-1" />
            <button onClick={load} className="px-4 py-2 bg-[#00ffae] rounded-md text-black font-bold">Search</button>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? <p className="text-zinc-400">Loading…</p> : tickets.map((t) => (
              <div key={t.id} className="rounded-[12px] border border-white/8 bg-white/6 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">#{t.id} — {t.subject}</p>
                    <p className="text-sm text-zinc-400">{t.category || 'General'} • {t.full_name} • {t.email} • {new Date(t.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select defaultValue={t.status} onChange={(e) => updateStatus(t.id, e.target.value)} className="p-2 bg-[#03121c] border border-white/6 rounded-md">
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Resolved</option>
                      <option>Closed</option>
                    </select>
                    <button onClick={() => { if (t.screenshot_url) window.open(t.screenshot_url, '_blank') }} className="px-3 py-2 bg-[#00ffae] rounded-md text-black font-bold">View Screenshot</button>
                    <button onClick={() => { /* Open detail view */ window.location.href = `/admin/support-tickets/${t.id}` }} className="px-3 py-2 bg-[#ffffff14] rounded-md text-zinc-200">Open</button>
                  </div>
                </div>
                <div className="mt-3 text-zinc-300">{t.message}</div>
                {t.admin_reply ? <div className="mt-3 rounded-md bg-white/5 p-3 text-zinc-200">Admin: {t.admin_reply}</div> : null}

                <div className="mt-3 flex gap-2 items-start">
                  <input value={adminReplies[t.id] ?? ''} onChange={(e) => setAdminReplies((s) => ({ ...s, [t.id]: e.target.value }))} placeholder="Write a reply..." className="flex-1 rounded-md bg-black/30 px-3 py-2 outline-none" />
                  <button disabled={actionLoading[t.id]} onClick={() => replyToTicket(t.id, adminReplies[t.id] ?? '')} className="px-3 py-2 bg-[#00e5ff] rounded-md text-black font-bold">{actionLoading[t.id] ? '...' : 'Reply'}</button>
                  <button disabled={actionLoading[t.id]} onClick={() => updateStatus(t.id, 'Resolved')} className="px-3 py-2 bg-emerald-500/20 rounded-md text-emerald-400">Resolve</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
