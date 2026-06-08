"use client"

import { useState } from "react"
import { supabase } from "../../../lib/supabase"
import { useRouter } from "next/navigation"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      alert(error.message)
      return
    }
    router.push('/admin')
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="rounded-3xl border border-white/10 bg-black/40 p-8 max-w-md w-full mx-6">
        <h1 className="text-4xl font-black text-center">Admin Login</h1>
        <p className="text-zinc-400 text-center mt-2">Sign in to access the admin dashboard.</p>
        <div className="mt-8 space-y-5">
          <input type="email" placeholder="Admin email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-4 outline-none text-white placeholder-zinc-500" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-4 outline-none text-white placeholder-zinc-500" />
          <button onClick={handleLogin} disabled={loading} className="w-full rounded-2xl bg-emerald-500 py-4 font-bold text-black hover:bg-emerald-400 transition disabled:opacity-50">{loading ? 'Signing in...' : 'Login'}</button>
        </div>
      </div>
    </div>
  )
}
