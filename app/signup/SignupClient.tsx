"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { usePlans } from "@/lib/plans"

export default function SignupClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const planParam = searchParams.get("plan")
  const selectedPlan = planParam || ""
  const { plans: availablePlans } = usePlans()

  const selectedAmountFromQuery = searchParams.get("amount") || ""

  // Derive a safe `selectedAmount` for rendering and redirecting.
  // Prefer explicit query amount, otherwise lookup by plan title in availablePlans.
  let selectedAmount = selectedAmountFromQuery || ""
  if (!selectedAmount && selectedPlan) {
    const found = (availablePlans || []).find((p: any) => (p.title || '').toLowerCase() === selectedPlan.toLowerCase() || (p.raw?.plan_name || '').toLowerCase() === selectedPlan.toLowerCase())
    if (found) selectedAmount = String(found.amount ?? '')
  }
  // ensure it's defined (fallback to '0' to avoid runtime template errors)
  selectedAmount = selectedAmount || '0'

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [availablePlansState, setAvailablePlansState] = useState<Array<any>>([])
  const [plansLoadError, setPlansLoadError] = useState<string | null>(null)
  const lastAttemptRef = useRef<number | null>(null)
  const redirectedRef = useRef(false)
  const mountedRef = useRef(true)
  const pendingPromiseRef = useRef<Promise<any> | null>(null)
  const lastClickRef = useRef<number | null>(null)
  const failedCooldownUntilRef = useRef<number | null>(null)

  const COOLDOWN_MS = 60_000 // general cooldown (ms) to avoid rapid retries
  const FAILED_COOLDOWN_MS =
    process.env.NODE_ENV === "development" ? 3_000 : 30_000 // shorter cooldown in dev for testing

  useEffect(() => {
    // mirror provider plans into local state shape used by signup UI
    setAvailablePlansState((availablePlans || []).map((p: any) => ({ title: p.title, amount: p.amount, raw: p.raw })))
  }, [availablePlans])

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push("/")
    }
  }

  const loginWithGoogle = async () => {
    setOauthLoading(true)
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
          alert('Google sign-in is not configured for this environment. Please use Email/Password signup or contact support.')
        } else {
          alert('Unable to start Google sign-up. Please try again or use Email/Password signup.')
        }
      }
    } catch (err: any) {
      console.error('Unexpected error during Google sign-in:', err)
      alert('Unable to start Google sign-up. Please try again or use Email/Password signup.')
    } finally {
      setOauthLoading(false)
    }
  }

  const validate = () => {
    // basic email format validation
    const emailTrim = email.trim()
    if (!emailTrim) {
      setError("Email address is required")
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailTrim)) {
      setError("Please enter a valid email address")
      return false
    }
    if (!password) {
      setError("Password is required")
      return false
    }
    if (!confirmPassword) {
      setError("Confirm password is required")
      return false
    }
    if (password !== confirmPassword) {
      setError("Passwords must match")
      return false
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return false
    }
    setError("")
    return true
  }

  const handleSignup = async () => {
    if (!validate()) return

    // debounce rapid clicks
    const lastClick = lastClickRef.current
    if (lastClick && Date.now() - lastClick < 500) return
    lastClickRef.current = Date.now()

    // global lock to avoid duplicate attempts across mounts
    const globalLock = (window as any).__apex_signup_lock
    if (globalLock) {
      setError("Signup is already in progress. Please wait.")
      return
    }

    // check failed cooldown
    const failedUntil = failedCooldownUntilRef.current
    if (failedUntil && Date.now() < failedUntil) {
      const secs = Math.ceil((failedUntil - Date.now()) / 1000)
      setError(`Please wait ${secs} seconds before retrying.`)
      return
    }

    if (loading) return

    // prevent duplicate promise execution
    if (pendingPromiseRef.current) return pendingPromiseRef.current

    setError("")
    setLoading(true)
    ;(window as any).__apex_signup_lock = true

    const promise = (async () => {
      try {
        // record attempt time to help debounce
        lastAttemptRef.current = Date.now()

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (signUpError) {
          const msg = signUpError.message || String(signUpError)
          const lowered = msg.toLowerCase()
          if (lowered.includes("rate limit") || lowered.includes("too many" ) || (signUpError.status === 429)) {
            // set failed cooldown
            failedCooldownUntilRef.current = Date.now() + FAILED_COOLDOWN_MS
            const waitSecs = Math.ceil(FAILED_COOLDOWN_MS / 1000)
            setError(`Too many signup attempts detected. Please wait ${waitSecs} seconds before trying again.`)
          } else {
            setError(msg)
          }
          return
        }

        // success: clear failed cooldown
        failedCooldownUntilRef.current = null

        // persist signup email for the deposit flow and subsequent pages
        try {
          sessionStorage.setItem("apex_signup_email", email)
          sessionStorage.setItem("apex_signup_time", String(Date.now()))
        } catch (e) {
          // ignore storage errors
        }

        // guard against duplicate redirects
        if (!redirectedRef.current) {
          redirectedRef.current = true
          // Per product requirements: new users should be sent to the dashboard
          // and NOT auto-redirected to the deposit or package pages.
          router.push(`/dashboard`)
        }
      } catch (err: any) {
        console.error(err)
        setError("Unable to create account. Please try again later.")
      } finally {
        if (mountedRef.current) setLoading(false)
        ;(window as any).__apex_signup_lock = false
        pendingPromiseRef.current = null
      }
    })()

    pendingPromiseRef.current = promise
    return promise
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleSignup()
  }

  return (
    <div className="relative min-h-screen bg-[#020406] text-white flex items-center justify-center p-6">
      <button
        type="button"
        onClick={handleBack}
        className="absolute top-4 left-4 z-30 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.18)] backdrop-blur-xl transition hover:bg-white/20 hover:shadow-[0_0_30px_rgba(16,185,129,0.28)]"
      >
        <ArrowLeft size={16} />
        Back
      </button>
      <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-[30px] p-8 shadow-[0_0_70px_rgba(0,255,174,0.12)]">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full overflow-hidden flex items-center justify-center bg-[linear-gradient(135deg,rgba(0,255,180,0.08),rgba(0,180,255,0.08))] border border-[rgba(0,255,180,0.2)] shadow-[0_0_15px_rgba(0,255,180,0.25),0_0_30px_rgba(0,255,180,0.15)]">
              <img src="/logo.png" alt="Apex Multiplier" className="w-4/5 h-4/5 object-contain" />
            </div>
            <div className="flex-1 min-w-max w-max whitespace-nowrap overflow-visible flex items-center text-left">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[#00ffae]/70">Premium Investment Access</p>
                <h1 className="mt-1 text-2xl font-black tracking-[-0.03em] whitespace-nowrap">Apex Multiplier</h1>
              </div>
            </div>
          </div>
          <p className="mt-3 text-zinc-400">Sign up and continue to your secure deposit portal.</p>
        </div>

        <div className="grid gap-6">
          <div className="grid gap-3">
            <button
              type="button"
              onClick={loginWithGoogle}
              disabled={oauthLoading}
              className="inline-flex w-full items-center justify-center gap-3 rounded-3xl border border-white/20 bg-white/90 px-6 py-4 text-sm font-semibold text-black shadow-[0_0_30px_rgba(255,255,255,0.12)] transition hover:bg-white hover:shadow-[0_0_35px_rgba(16,185,129,0.24)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.49 12.23c0-.82-.07-1.61-.21-2.37H12v4.48h6.54c-.28 1.45-1.12 2.68-2.39 3.5v2.91h3.87c2.27-2.09 3.58-5.18 3.58-8.52Z" fill="#4285F4" />
                <path d="M12 24c3.24 0 5.96-1.08 7.95-2.92l-3.87-2.91c-1.08.72-2.45 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.98H1.35v3.12C3.28 21.76 7.36 24 12 24Z" fill="#34A853" />
                <path d="M5.25 14.34c-.24-.72-.38-1.5-.38-2.34s.14-1.62.38-2.34V6.54H1.35A11.97 11.97 0 0 0 0 12c0 1.92.46 3.73 1.35 5.46l3.9-3.12Z" fill="#FBBC05" />
                <path d="M12 4.76c1.77 0 3.36.61 4.61 1.81l3.45-3.45C17.96 1.05 15.24 0 12 0 7.36 0 3.28 2.24 1.35 5.54l3.9 3.12C6.2 6.88 8.86 4.76 12 4.76Z" fill="#EA4335" />
              </svg>
              {oauthLoading ? "Continue with Google..." : "Continue with Google"}
            </button>
          </div>
          <form
            onSubmit={onSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && loading) e.preventDefault()
            }}
            className="grid gap-6"
          >
              {selectedPlan ? (
                <div className="rounded-[28px] border border-white/10 bg-[#0a1521]/80 p-5 shadow-[inset_0_0_30px_rgba(255,255,255,0.05)]">
                  <p className="text-xs uppercase tracking-[0.34em] text-zinc-400">Selected Package</p>
                  <h2 className="mt-3 text-2xl font-black text-white tracking-tight">{selectedPlan}</h2>
                  <p className="mt-2 text-sm text-zinc-400">Deposit Amount: <span className="text-white font-semibold">${selectedAmount}</span></p>
                </div>
              ) : null}

          <div className="grid gap-4">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-zinc-400">Email Address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@apexmultiplier.com"
                className="mt-2 w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none transition focus:border-[#00ffae]/50 focus:ring-2 focus:ring-[#00ffae]/20"
              />
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-zinc-400">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="mt-2 w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none transition focus:border-[#00ffae]/50 focus:ring-2 focus:ring-[#00ffae]/20"
              />
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-zinc-400">Confirm Password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="mt-2 w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none transition focus:border-[#00ffae]/50 focus:ring-2 focus:ring-[#00ffae]/20"
              />
            </label>
          </div>

            {error ? (
              <div className="rounded-3xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-100">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#00ffae] via-[#00e5ff] to-[#10f2c1] px-6 py-4 text-sm font-bold uppercase tracking-[0.28em] text-black shadow-[0_0_42px_rgba(0,255,174,0.30)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
