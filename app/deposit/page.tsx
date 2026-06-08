"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Copy, ShieldCheck } from "lucide-react"
import { supabase } from "@/lib/supabase"

const wallets = {
  TRC20: {
    label: "TRC20",
    address: "TWVGBdKdYMpxU4rmbWAHXr7zkuGv9K5NhF",
  },
  BEP20: {
    label: "BEP20",
    address: "0x714822D5F73538aCc7843BB0dD1018fd23D3201C",
  },
  ERC20: {
    label: "ERC20",
    address: "0x714822D5F73538aCc7843BB0dD1018fd23D3201C",
  },
}

const planDefaults: Record<string, string> = {
  Starter: "500",
  Silver: "1000",
  Premium: "2500",
  Gold: "5000",
  "Elite Infinity": "10000",
}

function DepositView() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const selectedPlan = searchParams.get("plan") || ""
  const selectedAmount =
    searchParams.get("amount") || (selectedPlan ? planDefaults[selectedPlan] : "")
  const selectedEmail = searchParams.get("email") || ""

  const [network, setNetwork] =
    useState<keyof typeof wallets>("TRC20")
  const [txHash, setTxHash] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  // prioritize email passed via URL, then sessionStorage, then auth user
  const [userEmail, setUserEmail] = useState(() => {
    try {
      return selectedEmail || (typeof window !== "undefined" ? sessionStorage.getItem("apex_signup_email") || "" : "")
    } catch (e) {
      return selectedEmail || ""
    }
  })

  const selectedWallet = wallets[network]

  useEffect(() => {
    async function loadUser() {
      // If email was passed by signup (URL param) prefer that and persist it for the session
      if (selectedEmail) {
        try {
          sessionStorage.setItem("apex_signup_email", selectedEmail)
        } catch (e) {
          // ignore storage errors
        }
        setUserEmail(selectedEmail)
        return
      }

      // fallback to any stored signup email
      try {
        const stored = sessionStorage.getItem("apex_signup_email")
        if (stored) {
          setUserEmail(stored)
          return
        }
      } catch (e) {}

      // last fallback: use authenticated user email if available
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user?.email) {
        setUserEmail(user.email)
      }
    }

    loadUser()
  }, [selectedEmail])

  const planAmount = useMemo(
    () => (selectedPlan ? Number(selectedAmount) || Number(planDefaults[selectedPlan] || "500") : 0),
    [selectedAmount, selectedPlan]
  )

  const copyAddress = async () => {
    setError("")
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(selectedWallet.address)
      } else {
        // fallback for older browsers
        const ta = document.createElement("textarea")
        ta.value = selectedWallet.address
        ta.setAttribute("readonly", "")
        ta.style.position = "absolute"
        ta.style.left = "-9999px"
        document.body.appendChild(ta)
        ta.select()
        document.execCommand("copy")
        document.body.removeChild(ta)
      }

      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2200)
    } catch (err) {
      console.error(err)
      setError("Unable to copy address. Please copy manually.")
    }
  }

  const handleDeposit = async () => {
    if (!selectedPlan || !planAmount) {
      setError("A valid plan and deposit amount are required.")
      return
    }

    if (!txHash.trim()) {
      setError("Please paste your transaction hash.")
      return
    }

    if (!userEmail) {
      setError(
        "Please complete signup or login before submitting your deposit."
      )
      return
    }

    setError("")
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const depositData: any = {
        email: user?.email || userEmail,
        plan_name: selectedPlan,
        amount: planAmount,
        network,
        txhash: txHash.trim(),
        status: "pending",
      }

      if (user?.id) {
        depositData.user_id = user.id
      }

      const { error: insertError } = await supabase
        .from("deposits")
        .insert([depositData])

      if (insertError) {
        setError(insertError.message)
        return
      }

      router.push("/dashboard")
    } catch (submitError) {
      setError("Unable to submit deposit. Please try again.")
      console.error(submitError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020406] text-white p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-[30px] p-8 shadow-[0_0_70px_rgba(0,255,174,0.12)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-[#00ffae]/80">Deposit Verification</p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.03em]">Complete your investment deposit</h1>
              <p className="mt-3 text-zinc-400 max-w-2xl">
                Select a payment network, copy the wallet address, and paste your transaction hash to submit your pending deposit.
              </p>
            </div>
              <div className="rounded-[28px] border border-white/10 bg-[#081018]/80 px-5 py-4 text-sm text-zinc-300">
                <p className="uppercase tracking-[0.35em] text-[#00ffae]/70">Plan</p>
                <p className="mt-2 text-xl font-black text-white">{selectedPlan || "No Plan Selected"}</p>
                <p className="mt-1 text-sm text-zinc-400">Amount: {selectedPlan ? `$${planAmount}` : "—"}</p>
                {!selectedPlan ? (
                  <div className="mt-3">
                    <button onClick={() => router.push('/deposit/select')} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.28em] bg-white/5 border-white/10">
                      Select Plan
                    </button>
                  </div>
                ) : (
                  <div className="mt-3">
                    <button onClick={() => router.push('/deposit/select')} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.28em] bg-white/5 border-white/10">
                      Change Plan
                    </button>
                  </div>
                )}
              </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-[30px] p-8 shadow-[0_0_60px_rgba(0,255,174,0.10)]">
            <div className="grid gap-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[28px] border border-white/10 bg-[#081018]/80 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">Selected Package</p>
                  <p className="mt-3 text-2xl font-black text-white">{selectedPlan}</p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-[#081018]/80 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">Deposit Amount</p>
                  <p className="mt-3 text-2xl font-black text-white">${planAmount}</p>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-[#081018]/80 p-5">
                <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">Registered Email</p>
                <p className="mt-3 text-lg font-bold text-white">{userEmail || "No email available"}</p>
              </div>

                <div>
                <p className="text-sm uppercase tracking-[0.35em] text-[#00ffae]/80 mb-4">Payment Network</p>
                <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
                  {Object.keys(wallets).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setNetwork(item as keyof typeof wallets)}
                      className={`w-full min-h-[72px] rounded-[24px] border p-4 text-left transition ${
                        network === item
                          ? "border-[#00ffae] bg-[#00ffae]/10 shadow-[0_0_30px_rgba(0,255,174,0.18)]"
                          : "border-white/10 bg-white/5 hover:border-[#00ffae]/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="truncate">
                          <p className="text-sm uppercase tracking-[0.35em] text-zinc-400">{item}</p>
                          <p className="mt-2 text-lg font-bold text-white truncate">{wallets[item as keyof typeof wallets].label}</p>
                        </div>
                        <div className="flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0d1b26]/80 text-[#00ffae] shadow-[0_0_18px_rgba(0,255,174,0.18)]">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-[#081018]/80 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">Wallet Address</p>
                    <p className="mt-2 text-lg font-semibold text-white">{selectedWallet.label}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={copyAddress}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.28em] transition ${
                        copySuccess
                          ? "border-amber-400 bg-amber-400/20 text-amber-100 shadow-[0_0_40px_rgba(250,180,8,0.22)]"
                          : "border-white/10 bg-white/5 text-white hover:border-[#00ffae]/30 hover:bg-[#00ffae]/10"
                      }`}
                    >
                      <Copy className="h-4 w-4" />
                      {copySuccess ? "Copied" : "Copy"}
                    </button>

                    {copySuccess ? (
                      <div className="mt-1 rounded px-3 py-1 text-xs font-semibold text-amber-100 bg-amber-500/8 shadow-[0_0_18px_rgba(250,180,8,0.10)]">
                        Wallet Address Copied
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 rounded-[24px] border border-white/10 bg-black/40 p-4 text-sm text-zinc-300 break-all shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]">
                  {selectedWallet.address}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-[#081018]/80 p-5">
                <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">Transaction Hash</p>
                <input
                  type="text"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="Paste your TX hash here"
                  className="mt-3 w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none transition focus:border-[#00ffae]/50 focus:ring-2 focus:ring-[#00ffae]/20"
                />
              </div>

              {error ? (
                <div className="rounded-[28px] border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                  {error}
                </div>
              ) : null}

              <button
                onClick={handleDeposit}
                disabled={loading || !selectedPlan}
                className="mt-4 w-full rounded-full bg-gradient-to-r from-[#00ffae] via-[#00e5ff] to-[#10f2c1] px-6 py-4 text-sm font-bold uppercase tracking-[0.28em] text-black shadow-[0_0_45px_rgba(0,255,174,0.22)] transition hover:scale-[1.01] disabled:opacity-60"
              >
                {loading ? "Submitting Deposit..." : "Submit Deposit"}
              </button>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-[30px] p-8 shadow-[0_0_60px_rgba(0,255,174,0.10)]">
            <p className="text-xs uppercase tracking-[0.35em] text-[#00ffae]/80">Important Notice</p>
            <div className="mt-4 rounded-[28px] border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-100 shadow-[0_0_25px_rgba(250,180,8,0.15)]">
              <p className="font-semibold">IMPORTANT NOTICE:</p>
              <p className="mt-2 leading-7 text-zinc-100">
                Please ensure that your payment is completed using the correct blockchain network before account activation. Incorrect network selection may result in irreversible loss of funds.
              </p>
              <p className="mt-3 leading-7 text-zinc-100">
                Your investment account and portfolio dashboard will become fully active once your transaction has been securely verified through our global payment verification infrastructure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DepositPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020406] text-white p-6"><div className="max-w-5xl mx-auto py-16 text-center text-lg">Loading deposit details...</div></div>}>
      <DepositView />
    </Suspense>
  )
}
