"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AuthPage() {

  const router = useRouter()

  const [isLogin, setIsLogin] = useState(true)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [loading, setLoading] = useState(false)

  async function handleAuth() {

    setLoading(true)

    if (isLogin) {

      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        })

      if (error) {
        alert(error.message)
        setLoading(false)
        return
      }

      router.push("/dashboard")

    } else {

      const { error } =
        await supabase.auth.signUp({
          email,
          password,
        })

      if (error) {
        alert(error.message)
        setLoading(false)
        return
      }

      alert("Account created successfully!")

      router.push("/dashboard")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 overflow-hidden relative">

      {/* Background Glow */}

      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/20 blur-3xl rounded-full" />

      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#00FFB2]/10 blur-3xl rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative w-full max-w-lg rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-2xl p-8 shadow-[0_0_60px_rgba(0,255,178,0.15)]"
      >

        {/* Logo */}

        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-full overflow-hidden flex items-center justify-center bg-[linear-gradient(135deg,rgba(0,255,180,0.08),rgba(0,180,255,0.08))] border border-[rgba(0,255,180,0.2)] shadow-[0_0_15px_rgba(0,255,180,0.25),0_0_30px_rgba(0,255,180,0.15)]">
            <img src="/logo.png" alt="Apex Multiplier" className="w-4/5 h-4/5 object-contain" />
          </div>

          <div className="flex-1 min-w-max w-max whitespace-nowrap overflow-visible flex items-center">
            <div>
              <h1 className="text-3xl font-black tracking-wide whitespace-nowrap">Apex Multiplier</h1>
              <p className="text-white/50 mt-2">AI-Powered Trading Platform</p>
            </div>
          </div>
        </div>

        {/* Tabs */}

        <div className="grid grid-cols-2 mb-8 rounded-2xl overflow-hidden border border-white/10">

          <button
            onClick={() => setIsLogin(true)}
            className={`py-3 font-bold ${
              isLogin
                ? "bg-[#00FFB2] text-black"
                : "bg-white/5 text-white/60"
            }`}
          >
            Login
          </button>

          <button
            onClick={() => setIsLogin(false)}
            className={`py-3 font-bold ${
              !isLogin
                ? "bg-[#00FFB2] text-black"
                : "bg-white/5 text-white/60"
            }`}
          >
            Signup
          </button>

        </div>

        {/* Form */}

        <div className="space-y-5">

          <div>

            <label className="text-sm text-white/60 mb-2 block">
              Email Address
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 outline-none focus:border-[#00FFB2]/50"
            />

          </div>

          <div>

            <label className="text-sm text-white/60 mb-2 block">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 outline-none focus:border-[#00FFB2]/50"
            />

          </div>

          {/* Submit Button */}

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAuth}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-[#00FFB2] text-black font-black text-lg shadow-[0_0_40px_rgba(0,255,178,0.4)]"
          >
            {loading
              ? "Please wait..."
              : isLogin
              ? "Login"
              : "Create Account"}
          </motion.button>

          {/* Bottom Text */}

          <div className="text-center text-white/50 pt-4">

            {isLogin
              ? "Don’t have an account?"
              : "Already have an account?"}

            <span
              onClick={() =>
                setIsLogin(!isLogin)
              }
              className="text-[#00FFB2] cursor-pointer ml-2"
            >
              {isLogin
                ? "Create Account"
                : "Login"}
            </span>

          </div>

        </div>
      </motion.div>
    </div>
  )
}