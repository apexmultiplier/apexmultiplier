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
    console.log('Login Started')
    console.log('Login email:', email)
    setLoading(true)
    try {
      const authResult = await supabase.auth.signInWithPassword({ email, password })
      console.log('Auth Result:', authResult)

      const sess = await supabase.auth.getSession()
      console.log('Session:', sess)

      const user = authResult?.data?.user || sess?.data?.session?.user || null
      console.log('User:', user)

      const redirectTarget = '/admin'
      console.log('Redirect Target:', redirectTarget)

      if (authResult.error) {
        alert(authResult.error.message)
        return
      }

      // Ensure session exists
      const { data: sessionData } = await supabase.auth.getSession()
      console.log('Session Exists:', !!sessionData?.session)
      if (!sessionData?.session) {
        alert('Login failed: session not established.')
        return
      }


      // Verify role
      const emailVal = user?.email || email
      console.log('Logged in email:', emailVal)
      let role = null
      if (emailVal) {
        const { data: roleData, error: roleErr } = await supabase.from('users').select('role').eq('email', emailVal).single()
        console.log('User table record:', roleData)
        if (roleErr) console.log('Role lookup error:', roleErr.message)
        role = roleData?.role
        console.log('Detected role:', role)
        if (!roleData) {
          alert('Admin user record not found.')
          await supabase.auth.signOut()
          return
        }
      } else {
        console.log('No email available to lookup role')
        alert('Admin user record not found.')
        await supabase.auth.signOut()
        return
      }

      if (role !== 'admin') {
        alert('Access denied. Admin account required.')
        await supabase.auth.signOut()
        return
      }

      console.log('Redirecting to:', redirectTarget)
      router.push(redirectTarget)
    } catch (e) {
      console.error('Login error', e)
      alert('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/40 p-8">
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
