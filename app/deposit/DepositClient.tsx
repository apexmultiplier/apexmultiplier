"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { usePlans } from "@/lib/plans"

const wallets = {
  TRC20: {
    qr: "/trc20.png",
    address: "TWVGBdKdYMpxU4rmbWAHXr7zkuG9K5NhF",
  },
  BEP20: {
    qr: "/bep20.png",
    address: "0x714822D5F73538aCc7843BB0dD1018fd23D3201C",
  },
  ERC20: {
    qr: "/erc20.png",
    address: "0x714822D5F73538aCc7843BB0dD1018fd23D3201C",
  },
}

export default function DepositClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const queryPlan = searchParams.get("plan") || ""
  const queryAmount = searchParams.get("amount") || ""

  const { plans: availablePlans } = usePlans()

  const [network, setNetwork] = useState<keyof typeof wallets>("TRC20")
  const [amount, setAmount] = useState<string>(queryAmount || "")
  const [selectedPlanObj, setSelectedPlanObj] = useState<any | null>(null)

  useEffect(() => {
    if (queryPlan && availablePlans && availablePlans.length > 0) {
      const found = availablePlans.find((p: any) => (p.title || '').toLowerCase() === queryPlan.toLowerCase() || (p.raw?.plan_name || '').toLowerCase() === queryPlan.toLowerCase())
      if (found) {
        setSelectedPlanObj(found)
        setAmount(String(found.amount || ''))
      }
    }
  }, [queryPlan, availablePlans])
  const [hash, setHash] = useState("")
  const [loading, setLoading] = useState(false)

  const selected = wallets[network]

  const copyAddress = async () => {
    await navigator.clipboard.writeText(selected.address)
    alert("Wallet Address Copied")
  }

  const submitDeposit = async () => {
    if (!amount || !hash) {
      alert("Please fill all fields")
      return
    }

    try {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert("Please login first")
        return
      }

      const depositAmount = Number(amount)
      let planName = ""
      let roiPercent = 0
      let duration = 30
      let dailyProfit = 0
      let totalProfit = 0

      if (selectedPlanObj && selectedPlanObj.raw) {
        planName = selectedPlanObj.title
        roiPercent = Number(selectedPlanObj.raw.roi_percentage ?? selectedPlanObj.raw.roi_percent ?? selectedPlanObj.raw.roi ?? selectedPlanObj.raw.monthly_profit ?? 0)
        duration = Number(selectedPlanObj.raw.duration_days ?? selectedPlanObj.raw.duration ?? 30)
        totalProfit = (depositAmount * roiPercent) / 100
        dailyProfit = totalProfit / (duration || 30)
      } else {
        // fallback estimation based on deposit amount ranges
        if (depositAmount >= 10000) {
          roiPercent = 12
        } else if (depositAmount >= 5000) {
          roiPercent = 10
        } else if (depositAmount >= 2500) {
          roiPercent = 9
        } else if (depositAmount >= 1000) {
          roiPercent = 8
        } else {
          roiPercent = 8
        }
        totalProfit = (depositAmount * roiPercent) / 100
        dailyProfit = totalProfit / 30
        planName = selectedPlanObj?.title || "Custom Plan"
      }

      const { data: insertedDeposit, error } = await supabase.from("deposits").insert([
        {
          user_id: user.id,
          email: user.email,
          network,
          amount: depositAmount,
          txhash: hash,
          status: "approved",
          plan_name: planName,
          roi_percent: roiPercent,
          daily_profit: dailyProfit,
          total_profit: totalProfit,
        },
      ]).select().single()

      if (error) {
        console.log(error)
        alert(error.message)
        return
      }

      // Request server to create the active plan using service role (keeps RLS intact)
      try {
        if (insertedDeposit?.id) {
          await fetch('/api/admin/approve-deposit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: insertedDeposit.id, status: 'approved' }),
          })
        }
      } catch (e) {
        console.warn('Server plan creation failed', e)
      }

      alert("Deposit Submitted Successfully")
      setAmount("")
      setHash("")
      router.push("/dashboard")
    } catch (err) {
      console.log(err)
      alert("Unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#030507] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black">Deposit Funds</h1>
          <p className="text-zinc-400 mt-2">Choose Network & Complete Payment</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {Object.keys(wallets).map((item) => (
            <button
              key={item}
              onClick={() => setNetwork(item as keyof typeof wallets)}
              className={`rounded-2xl py-4 font-bold transition ${
                network === item
                  ? "bg-emerald-500 text-black"
                  : "bg-white/5 border border-white/10"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Selected Network</h2>
            <p className="text-zinc-400 mt-2">{network}</p>
          </div>

          <div className="mb-6">
            <button
              type="button"
              onClick={copyAddress}
              className="rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-black"
            >
              Copy Wallet Address
            </button>
          </div>

          <div className="grid gap-4">
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Deposit Amount"
              className="w-full rounded-2xl bg-white/5 border border-white/10 p-4 text-white outline-none"
            />
            <input
              value={hash}
              onChange={(event) => setHash(event.target.value)}
              placeholder="Transaction Hash"
              className="w-full rounded-2xl bg-white/5 border border-white/10 p-4 text-white outline-none"
            />

            <button
              type="button"
              onClick={submitDeposit}
              disabled={loading}
              className="rounded-2xl bg-emerald-500 px-6 py-4 font-semibold text-black disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Deposit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
