"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function SupportTicketDetail() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const load = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("support_tickets").select("*").eq("id", Number(id)).single()
      if (error) throw error
      setTicket(data)
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to load ticket")
    } finally {
      setLoading(false)
    }
  }

  const sendReply = async () => {
    if (!reply || reply.trim().length === 0) return alert('Reply cannot be empty')
    setActionLoading(true)
    try {
      const { error } = await supabase.from('support_tickets').update({ admin_reply: reply.trim(), status: 'In Progress' }).eq('id', Number(id))
      if (error) throw error
      // notify user
      const notify = { user_id: ticket?.user_id || null, title: `Reply to ticket #${id}`, message: `Admin replied: ${reply.trim().slice(0,200)}`, read: false }
      const { error: nErr } = await supabase.from('notifications').insert([notify])
      if (nErr) console.warn('Notification insert warning:', nErr)
      setReply("")
      await load()
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Failed to reply')
    } finally {
      setActionLoading(false)
    }
  }

  const changeStatus = async (status: string) => {
    setActionLoading(true)
    try {
      const { error } = await supabase.from('support_tickets').update({ status }).eq('id', Number(id))
      if (error) throw error
      const notify = { user_id: ticket?.user_id || null, title: `Ticket ${status}`, message: `Your ticket #${id} status changed to ${status}.`, read: false }
      const { error: nErr } = await supabase.from('notifications').insert([notify])
      if (nErr) console.warn('Notification insert warning:', nErr)
      await load()
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Failed to change status')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-[#020406] text-white p-6">Loading…</div>
  if (!ticket) return <div className="min-h-screen bg-[#020406] text-white p-6">Ticket not found</div>

  return (
    <div className="min-h-screen bg-[#020406] text-white p-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.push('/admin/support-tickets')} className="text-emerald-400 mb-4">Back to tickets</button>

        <div className="rounded-[12px] border border-white/8 bg-white/6 p-6">
          <h1 className="text-2xl font-bold">#{ticket.id} — {ticket.subject}</h1>
          <p className="text-zinc-400">{ticket.category} • {ticket.full_name} • {ticket.email}</p>
          <div className="mt-4 text-zinc-300">{ticket.message}</div>
          {ticket.screenshot_url && <div className="mt-3"><a href={ticket.screenshot_url} target="_blank" rel="noreferrer" className="text-[#00ffae]">View Screenshot</a></div>}

          {ticket.admin_reply && <div className="mt-4 rounded-md bg-white/5 p-3 text-zinc-200">Admin: {ticket.admin_reply}</div>}

          <div className="mt-4 flex gap-2">
            <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write reply..." className="flex-1 rounded-md bg-black/30 px-3 py-2" />
            <button disabled={actionLoading} onClick={sendReply} className="px-3 py-2 bg-[#00e5ff] text-black rounded-md">{actionLoading ? '...' : 'Reply'}</button>
            <button disabled={actionLoading} onClick={() => changeStatus('Resolved')} className="px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-md">Resolve</button>
          </div>
        </div>
      </div>
    </div>
  )
}
