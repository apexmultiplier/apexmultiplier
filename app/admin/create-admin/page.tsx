"use client"

import { useState } from "react"
import { supabase } from "../../../lib/supabase"
import { useRouter } from "next/navigation"

export default function CreateAdminPage() {
  const [email, setEmail] = useState("")
  const [confirmEmail, setConfirmEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCreate = async () => {
    if (email !== confirmEmail) return alert('Emails do not match')
    if (password !== confirmPassword) return alert('Passwords do not match')
    if (password.length < 8) return alert('Password must be at least 8 characters')

    setLoading(true)

    // Create user via Supabase Admin API on server
    const res = await fetch('/api/admin/create-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    setLoading(false)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return alert(body?.error || 'Failed to create admin')
    }

    alert('Admin created')
    router.push('/admin/login')
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="rounded-3xl border border-white/10 bg-black/40 p-8 max-w-lg w-full mx-6">
        <h1 className="text-3xl font-bold text-center">Create Admin</h1>
        <p className="text-zinc-400 text-center mt-2">Create a new admin account.</p>
        <div className="mt-6 space-y-4">
          <input type="email" placeholder="Admin email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-3 outline-none text-white placeholder-zinc-500" />
          <input type="email" placeholder="Confirm email" value={confirmEmail} onChange={(e)=>setConfirmEmail(e.target.value)} className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-3 outline-none text-white placeholder-zinc-500" />
          <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-3 outline-none text-white placeholder-zinc-500" />
          <input type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-3 outline-none text-white placeholder-zinc-500" />
          <button onClick={handleCreate} disabled={loading} className="w-full rounded-2xl bg-emerald-500 py-3 font-bold text-black hover:bg-emerald-400 transition disabled:opacity-50">{loading ? 'Creating...' : 'Create Admin'}</button>
        </div>
      </div>
    </div>
  )
}
