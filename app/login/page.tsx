"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    router.push("/dashboard")
  }

  async function loginWithGoogle() {
    try {
      const redirectTo = (typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || '') + '/dashboard'
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      })

      console.log('Google OAuth start:', { data, error })

      if (error) {
        console.error('Google OAuth Error:', error)
        const msg = (error.message || '').toLowerCase()
        if (msg.includes('missing oauth secret') || (error as any)?.error_code === 'validation_failed') {
          alert('Google sign-in is not configured for this environment. Please use Email/Password login or contact support.')
        } else {
          alert('Unable to start Google sign-in. Please try again or use Email/Password login.')
        }
      }
    } catch (err: any) {
      console.error('Unexpected error during Google sign-in:', err)
      alert('Unable to start Google sign-in. Please try again or use Email/Password login.')
    }
  }

  return (
    <div className="min-h-screen text-white flex items-center justify-center p-6" style={{background: 'linear-gradient(180deg, #050816 0%, #07111D 30%, #06171B 60%, #050816 100%)'}}>

      <Link
        href="/"
        aria-label="Home"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30 flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#00F5B0] hover:bg-white/8 transition-shadow backdrop-blur-md shadow-sm"
      >
        <ArrowLeft size={16} />
        <span className="text-sm font-medium">Home</span>
      </Link>

      <div className="glow-orb" style={{width: 300, height: 300, background: 'radial-gradient(circle,#00F5B0 0%, transparent 40%)', top: '6%', left: '6%'}} />

      <div className="w-full max-w-md rounded-3xl glass-panel p-8">

        <h1 className="text-4xl font-black text-center fin-heading neon-text">
          APEX MULTIPLIER
        </h1>

        <p className="text-zinc-400 text-center mt-3">
          Welcome back to Apex Multiplier
        </p>

        <div className="mt-8 space-y-5">

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full input-glass"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full input-glass"
          />
          <div className="w-full text-right">
            <a href="/forgot-password" className="text-sm text-zinc-400 hover:text-[#00ffae]">Forgot Password?</a>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full neon-btn"
          >
            {loading ? "Loading..." : "Login"}
          </button>

          <button
            onClick={loginWithGoogle}
            className="w-full btn-outline-neon"
          >
            Continue With Google
          </button>

        </div>

      </div>
    </div>
  )
}