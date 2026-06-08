"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    // Handle Supabase password recovery redirect and error params
    async function handleSessionFromUrl() {
      if (typeof window === 'undefined') return

      // Check query params for known error (expired OTP)
      try {
        const search = new URLSearchParams(window.location.search)
        if (search.get('error') === 'access_denied' && search.get('error_code') === 'otp_expired') {
          setError('This password reset link has expired. Please request a new password reset email.')
          setTimeout(() => {
            router.push('/forgot-password')
          }, 2200)
          return
        }
      } catch (e) {
        // ignore
      }

      // Also check hash fragment for errors (some providers place errors in hash)
      try {
        const hash = typeof window !== 'undefined' ? window.location.hash : ''
        if (hash) {
          const hashParams = new URLSearchParams(hash.replace('#', ''))
          if (hashParams.get('error') === 'access_denied' && hashParams.get('error_code') === 'otp_expired') {
            setError('This password reset link has expired. Please request a new password reset email.')
            setTimeout(() => {
              router.push('/forgot-password')
            }, 2200)
            return
          }
        }
      } catch (e) {}

      // Attempt to let Supabase extract session from URL for PASSWORD_RECOVERY
      try {
        // @ts-ignore
        if (supabase.auth && typeof supabase.auth.getSessionFromUrl === 'function') {
          await supabase.auth.getSessionFromUrl({ storeSession: true })
        }
      } catch (e) {
        // ignore
      }
    }
    handleSessionFromUrl()
  }, [])

  async function handleUpdate() {
    setError("")
    if (!newPassword) return setError('Please enter a new password')
    if (newPassword !== confirmPassword) return setError('Passwords do not match')

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Password updated successfully. Redirecting to login...')
        setTimeout(() => {
          router.push('/login')
        }, 1600)
      }
    } catch (e: any) {
      setError(e?.message || 'Unable to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen text-white flex items-center justify-center p-6" style={{background: 'linear-gradient(180deg, #050816 0%, #07111D 30%, #06171B 60%, #050816 100%)'}}>
      <div className="w-full max-w-md rounded-3xl glass-panel p-8">
        <h2 className="text-2xl font-black text-center neon-text">Reset Password</h2>
        <p className="text-zinc-400 text-center mt-2">Enter a new password for your account.</p>

        <div className="mt-6 space-y-4">
          <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full input-glass" />
          <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full input-glass" />

          {error ? <div className="text-sm text-red-400">{error}</div> : null}
          {success ? <div className="text-sm text-emerald-300">{success}</div> : null}

          <button onClick={handleUpdate} disabled={loading} className="w-full neon-btn">
            {loading ? 'Updating...' : 'Update Password'}
          </button>

          <div className="text-center text-sm text-zinc-400">
            <a href="/login" className="hover:text-[#00ffae]">Back to Login</a>
          </div>
        </div>
      </div>
    </div>
  )
}
