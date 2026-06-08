"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  async function handleSend() {
    setLoading(true)
    setError("")
    try {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : '/reset-password'
      const { error } = await supabase.auth.resetPasswordForEmail(String(email), { redirectTo })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('If an account exists for this email, a reset link has been sent.')
      }
    } catch (e: any) {
      setError(e?.message || 'Unable to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen text-white flex items-center justify-center p-6" style={{background: 'linear-gradient(180deg, #050816 0%, #07111D 30%, #06171B 60%, #050816 100%)'}}>
      <div className="w-full max-w-md rounded-3xl glass-panel p-8">
        <h2 className="text-2xl font-black text-center neon-text">Forgot Password</h2>
        <p className="text-zinc-400 text-center mt-2">Enter your account email and we'll send a password reset link.</p>

        <div className="mt-6 space-y-4">
          <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full input-glass" />

          {error ? <div className="text-sm text-red-400">{error}</div> : null}
          {success ? <div className="text-sm text-emerald-300">{success}</div> : null}

          <button onClick={handleSend} disabled={loading} className="w-full neon-btn">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <div className="text-center text-sm text-zinc-400">
            <a href="/login" className="hover:text-[#00ffae]">Back to Login</a>
          </div>
        </div>
      </div>
    </div>
  )
}
