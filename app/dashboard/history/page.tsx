"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Deposit = {
  id: number
  email: string
  network: string
  amount: number
  txhash: string
  status: string
}

export default function DepositHistoryPage() {

  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert("Please login")
      return
    }

    const { data, error } = await supabase
      .from("deposits")
      .select("*")
      .eq("email", user.email)
      .order("id", { ascending: false })

    if (error) {
      console.log(error)
      alert(error.message)
      return
    }

    setDeposits(data || [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#030507] text-white p-6">

      <div className="max-w-6xl mx-auto">

        {/* HEADER */}

        <div className="mb-8">

          <h1 className="text-4xl font-black">
            Deposit History
          </h1>

          <p className="text-zinc-400 mt-2">
            Track Your Deposit Requests
          </p>

        </div>

        {/* LOADING */}

        {loading ? (

          <div className="text-center py-20">
            <p className="text-zinc-400">
              Loading History...
            </p>
          </div>

        ) : deposits.length === 0 ? (

          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">

            <h2 className="text-2xl font-bold">
              No Deposits Found
            </h2>

            <p className="text-zinc-400 mt-3">
              Your deposit requests will appear here
            </p>

          </div>

        ) : (

          <div className="grid gap-5">

            {deposits.map((deposit) => (

              <div
                key={deposit.id}
                className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
              >

                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

                  <div>
                    <p className="text-zinc-400 text-sm">
                      Network
                    </p>

                    <h2 className="mt-2 text-lg font-bold text-emerald-400">
                      {deposit.network}
                    </h2>
                  </div>

                  <div>
                    <p className="text-zinc-400 text-sm">
                      Amount
                    </p>

                    <h2 className="mt-2 text-lg font-bold">
                      ${deposit.amount}
                    </h2>
                  </div>

                  <div>
                    <p className="text-zinc-400 text-sm">
                      Status
                    </p>

                    <h2
                      className={`mt-2 text-lg font-bold ${
                        deposit.status === "approved"
                          ? "text-emerald-400"
                          : deposit.status === "rejected"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {deposit.status}
                    </h2>
                  </div>

                  <div>
                    <p className="text-zinc-400 text-sm">
                      Deposit ID
                    </p>

                    <h2 className="mt-2 text-lg font-bold">
                      #{deposit.id}
                    </h2>
                  </div>

                </div>

                {/* HASH */}

                <div className="mt-6">

                  <p className="text-zinc-400 text-sm mb-3">
                    Transaction Hash
                  </p>

                  <div className="rounded-2xl bg-black/40 border border-white/10 p-4 break-all text-sm">
                    {deposit.txhash}
                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  )
}