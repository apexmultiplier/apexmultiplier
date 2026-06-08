"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

const NOTIF_TYPES = [
  "Deposit Approved",
  "Withdrawal Approved",
  "Ticket Updated",
  "KYC Approved",
  "Announcement",
]

export default function AdminNotifications() {
  const router = useRouter()
  const [type, setType] = useState(NOTIF_TYPES[0])
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [target, setTarget] = useState("") // email or unique id
  const [sendToAll, setSendToAll] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const validate = () => {
    if (!title.trim()) return "Title is required"
    if (!message.trim()) return "Message is required"
    if (!sendToAll && !target.trim()) return "Target email or UID is required when not sending to all"
    return null
  }

  const handleSend = async () => {
    const err = validate()
    if (err) { setStatus(err); return }
    setLoading(true)
    setStatus(null)

    try {
      if (sendToAll) {
        // fetch all users
        const { data: users, error: uErr } = await supabase.from('users').select('id')
        if (uErr) throw uErr
        const payload = (users || []).map((u: any) => ({ user_id: u.id, type, title, message, read: false }))
        if (payload.length === 0) {
          setStatus('No users found to send to')
          setLoading(false)
          return
        }
        const { error: insertErr } = await supabase.from('notifications').insert(payload)
        if (insertErr) throw insertErr
        setStatus(`Sent to ${payload.length} users`)
      } else {
        // lookup user by email or unique_id
        const isEmail = target.includes('@')
        let q = supabase.from('users').select('id').limit(1)
        if (isEmail) q = q.eq('email', target)
        else q = q.eq('unique_id', target)
        const { data: found, error: findErr } = await q
        if (findErr) throw findErr
        if (!found || found.length === 0) {
          setStatus('No user found with that identifier')
          setLoading(false)
          return
        }
        const uid = found[0].id
        const { error: insertErr } = await supabase.from('notifications').insert([{ user_id: uid, type, title, message, read: false }])
        if (insertErr) throw insertErr
        setStatus('Notification sent')
      }

      setTitle('')
      setMessage('')
      setTarget('')
    } catch (e: any) {
      console.error(e)
      setStatus(e?.message || 'Failed to send notification')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Admin Notification Center</h1>

      <div className="max-w-2xl">
        <div className="mb-3">
          <label className="block text-sm text-zinc-300 mb-1">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2 rounded bg-white/5 border border-white/10">
            {NOTIF_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="mb-3">
          <label className="block text-sm text-zinc-300 mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 rounded bg-white/5 border border-white/10" />
        </div>

        <div className="mb-3">
          <label className="block text-sm text-zinc-300 mb-1">Message</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full p-2 rounded bg-white/5 border border-white/10" />
        </div>

        <div className="mb-3 flex items-center gap-3">
          <input id="sendAll" type="checkbox" checked={sendToAll} onChange={(e) => setSendToAll(e.target.checked)} />
          <label htmlFor="sendAll" className="text-sm text-zinc-300">Send to all users</label>
        </div>

        {!sendToAll && (
          <div className="mb-3">
            <label className="block text-sm text-zinc-300 mb-1">Target (email or UID)</label>
            <input value={target} onChange={(e) => setTarget(e.target.value)} className="w-full p-2 rounded bg-white/5 border border-white/10" />
          </div>
        )}

        <div className="flex items-center gap-3 mt-4">
          <button onClick={handleSend} disabled={loading} className="bg-emerald-500 text-black px-4 py-2 rounded font-bold">{loading ? 'Sending...' : 'Send'}</button>
          <button onClick={() => router.back()} className="text-zinc-300">Cancel</button>
        </div>

        {status ? <div className="mt-3 text-sm text-zinc-200">{status}</div> : null}
      </div>
    </div>
  )
}
