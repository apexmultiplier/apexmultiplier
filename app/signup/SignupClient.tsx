"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
    <div className="min-h-screen bg-[#020406] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-[30px] p-8 shadow-[0_0_70px_rgba(0,255,174,0.12)]">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-[#00ffae]/70">Premium Investment Access</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.03em]">Create your account</h1>
          <p className="mt-3 text-zinc-400">Sign up and continue to your secure deposit portal.</p>
        </div>

        <div className="grid gap-6">
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
