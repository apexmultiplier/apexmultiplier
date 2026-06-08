"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Search, ArrowLeft, TrendingUp } from "lucide-react"

interface UserRecord {
  id: string
  email: string
  full_name?: string
  kyc_status?: string
  created_at?: string | null
  balance?: number | string | null
  unique_id?: string | null
  status?: string | null
  first_name?: string | null
  last_name?: string | null
}

interface UserStats {
  user: UserRecord
  totalDeposit: number
  totalProfit: number
  totalWithdrawal: number
  activePlan?: string
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const { data: authData } = await supabase.auth.getUser()
      console.log('Current Supabase User:', authData)
    } catch (e) {
      console.warn('Failed to get auth user', e)
    }
    setError(null)
    try {
      const { data: userData, error: userErr } = await supabase
        .from("users")
        .select("id,email,full_name,created_at,kyc_status,unique_id,first_name,last_name,status")
        .order("created_at", { ascending: false })

      console.log("Users Query Result:", userData)
      console.log("Users Query Error:", userErr)
      if (userErr) throw userErr

      const { data: depositsData, error: depErr } = await supabase
        .from("deposits")
        .select("email, amount, status")

      console.log("Deposits Query Result:", depositsData)
      console.log("Deposits Query Error:", depErr)
      if (depErr) throw depErr

      const { data: withdrawalsData, error: withErr } = await supabase
        .from("withdrawals")
        .select("email, amount, status")

      console.log("Withdrawals Query Result:", withdrawalsData)
      console.log("Withdrawals Query Error:", withErr)
      if (withErr) throw withErr

      const { data: plansData, error: plansErr } = await supabase
        .from("user_plans")
        .select("user_email, plan_name, status")

      console.log("Plans Query Result:", plansData)
      console.log("Plans Query Error:", plansErr)
      if (plansErr) throw plansErr

      const users = (userData || []).map((user: any) => {
      const userDeposits = (depositsData || []).filter(
        (d: any) => d.email === user.email && d.status === "approved"
      )
      const userWithdrawals = (withdrawalsData || []).filter(
        (w: any) => w.email === user.email && w.status !== "rejected"
      )
      const userPlan = (plansData || []).find(
        (p: any) => p.user_email === user.email && p.status === "active"
      )

      return {
        user,
        totalDeposit: userDeposits.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0),
        totalWithdrawal: userWithdrawals.reduce((sum: number, w: any) => sum + Number(w.amount || 0), 0),
        totalProfit: Number(user.balance || 0) - userDeposits.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0),
        activePlan: userPlan?.plan_name,
      }
    })

    setUsers(users)
    } catch (e: any) {
      console.error('Error loading users:', e)
      setError(e?.message || String(e))
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const updateUserStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from("users").update({ status }).eq("id", id)
      if (error) {
        console.error(error)
        alert("Failed to update user status: " + error.message)
        return
      }
      // refresh list
      await loadUsers()
      alert("User status updated")
    } catch (err) {
      console.error(err)
      alert("Unexpected error updating user status")
    }
  }

  const filteredUsers = users.filter((u) =>
    u.user.email.toLowerCase().includes(search.toLowerCase()) ||
    u.user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    (u.user.id || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.user.unique_id || "").toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const displayUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="min-h-screen bg-[#050816] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.push("/admin")}
          className="flex items-center gap-2 mb-6 text-emerald-400 hover:text-emerald-300 transition"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 mb-6">
          <h1 className="text-4xl font-black">Users Management</h1>
          <p className="text-zinc-400 mt-2">View and manage all registered users</p>

          <div className="mt-6 relative">
            <Search className="absolute left-4 top-4 text-zinc-400" size={20} />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-black/40 border border-white/10 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-zinc-400">Loading users...</p>
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-400">
                    <th className="text-left py-3 px-4">UID</th>
                    <th className="text-left py-3 px-4">Full Name</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Active Plan</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Registered</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayUsers.map((userStats) => (
                    <tr
                      key={userStats.user.id}
                      className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer"
                      onClick={() => router.push(`/admin/users/${userStats.user.id}`)}
                    >
                      <td className="py-4 px-4 text-zinc-400 text-xs">{userStats.user.unique_id || userStats.user.id}</td>
                      <td className="py-4 px-4">{userStats.user.full_name || "—"}</td>
                      <td className="py-4 px-4 text-emerald-400">{userStats.user.email}</td>
                      <td className="py-4 px-4">
                        {userStats.activePlan ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                            {userStats.activePlan}
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs ${
                            (userStats.user.status || userStats.user.kyc_status) === "active" || (userStats.user.status || userStats.user.kyc_status) === "Active"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : (userStats.user.status || userStats.user.kyc_status) === "suspended" || (userStats.user.status || userStats.user.kyc_status) === "Suspended"
                              ? "bg-amber-500/20 text-amber-400"
                              : (userStats.user.status || userStats.user.kyc_status) === "banned" || (userStats.user.status || userStats.user.kyc_status) === "Banned"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-zinc-500/20 text-zinc-400"
                          }`}
                        >
                          {userStats.user.status || userStats.user.kyc_status || "—"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-zinc-400 text-xs">
                        {userStats.user.created_at
                          ? new Date(userStats.user.created_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              await updateUserStatus(userStats.user.id, "active")
                            }}
                            className="px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-xs"
                          >
                            Activate
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              await updateUserStatus(userStats.user.id, "suspended")
                            }}
                            className="px-3 py-1 rounded-md bg-amber-500/20 text-amber-400 text-xs"
                          >
                            Suspend
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              await updateUserStatus(userStats.user.id, "banned")
                            }}
                            className="px-3 py-1 rounded-md bg-red-500/20 text-red-400 text-xs"
                          >
                            Ban
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {displayUsers.length === 0 && (
                <div className="text-center py-12 text-zinc-400">
                  {error ? (
                    <div>
                      <div className="font-semibold text-sm text-red-400">Error loading users</div>
                      <div className="text-xs mt-2">{error}</div>
                    </div>
                  ) : (
                    <div>No users found</div>
                  )}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-4 py-2 rounded-lg transition ${
                      currentPage === i + 1
                        ? "bg-emerald-500 text-black"
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
