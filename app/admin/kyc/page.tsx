"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, Check, X } from "lucide-react"

interface KycRecord {
  id: string
  email: string
  full_name?: string
  unique_id?: string
  govt_id_name?: string
  govt_id_number?: string
  kyc_selfie_url?: string
  country?: string
  kyc_status?: string
  created_at: string
}

export default function KycPage() {
  const router = useRouter()
  const [kycRequests, setKycRequests] = useState<KycRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    loadKyc()
    const subscription = supabase
      .channel("users")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        () => loadKyc()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadKyc = async () => {
    const { data } = await supabase
      .from("users")
      .select("*")
      .neq("govt_id_number", null)
      .order("created_at", { ascending: false })

    setKycRequests(data || [])
    setLoading(false)
  }

  const updateKycStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    // prepare update payload
    const payload: any = { kyc_status: status }
    if (status === "Approved") {
      payload.kyc_verified_at = new Date().toISOString()
    } else {
      payload.kyc_verified_at = null
    }

    const { error } = await supabase
      .from("users")
      .update(payload)
      .eq("id", id)

    if (error) {
      alert(error.message)
      setUpdatingId(null)
      return
    }

    // try to insert a notification for the user
    try {
      let notifType = "KYC Updated"
      let notifTitle = `KYC status: ${status}`
      let notifMessage = ''
      if (status === 'Approved') {
        notifType = 'KYC Approved'
        notifTitle = 'KYC Approved'
        notifMessage = 'Your KYC documents have been approved. Thank you.'
      } else if (status === 'Rejected') {
        notifType = 'KYC Rejected'
        notifTitle = 'KYC Rejected'
        notifMessage = 'Your KYC documents were rejected. Please resubmit.'
      } else if (status === 'Resubmission Requested') {
        notifType = 'KYC Resubmission'
        notifTitle = 'KYC Resubmission Requested'
        notifMessage = 'Please resubmit your KYC documents following the admin feedback.'
      } else {
        notifMessage = `Your KYC status has been updated to ${status}`
      }

      const { error: nErr } = await supabase.from('notifications').insert([{
        user_id: id,
        type: notifType,
        title: notifTitle,
        message: notifMessage,
        read: false,
      }])

      if (nErr) console.warn('Failed to insert notification', nErr)
    } catch (e) {
      console.warn('Notify error', e)
    }

    // refresh list and finish
    loadKyc()
    setUpdatingId(null)
  }

  const [selected, setSelected] = useState<KycRecord | null>(null)

  const requestResubmission = (id: string) => {
    if (!confirm('Request resubmission for this user?')) return
    updateKycStatus(id, 'Resubmission Requested')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
    }
  }

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
          <h1 className="text-4xl font-black">KYC Management</h1>
          <p className="text-zinc-400 mt-2">Review and manage KYC verification requests</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-zinc-400">Loading KYC requests...</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400">
                  <th className="text-left py-3 px-4">UID</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Full Name</th>
                  <th className="text-left py-3 px-4">Country</th>
                  <th className="text-left py-3 px-4">ID Type</th>
                  <th className="text-left py-3 px-4">ID Number</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Submitted</th>
                  <th className="text-left py-3 px-4">Time</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {kycRequests.map((kyc) => {
                  const { date, time } = formatDate(kyc.created_at)
                  return (
                    <tr
                      key={kyc.id}
                      className="border-b border-white/5 hover:bg-white/5 transition"
                    >
                          <td className="py-4 px-4 text-zinc-400 text-xs">{kyc.unique_id || '—'}</td>
                      <td className="py-4 px-4 text-emerald-400">{kyc.email}</td>
                      <td className="py-4 px-4">{kyc.full_name || "—"}</td>
                      <td className="py-4 px-4">{kyc.country || "—"}</td>
                      <td className="py-4 px-4">{kyc.govt_id_name || "—"}</td>
                      <td className="py-4 px-4 text-xs text-zinc-400">
                        {kyc.govt_id_number || "—"}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs ${
                            kyc.kyc_status === "Approved"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : kyc.kyc_status === "Pending"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {kyc.kyc_status || "Pending"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-zinc-400 text-xs">{date}</td>
                      <td className="py-4 px-4 text-zinc-400 text-xs">{time}</td>
                      <td className="py-4 px-4">
                        {kyc.kyc_status !== "Approved" && kyc.kyc_status !== "Rejected" ? (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => updateKycStatus(kyc.id, "Approved")}
                              disabled={updatingId === kyc.id}
                              className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 transition disabled:opacity-50"
                            >
                              <Check size={16} className="text-emerald-400" />
                            </button>
                            <button
                              onClick={() => updateKycStatus(kyc.id, "Rejected")}
                              disabled={updatingId === kyc.id}
                              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition disabled:opacity-50"
                            >
                              <X size={16} className="text-red-400" />
                            </button>
                            <button
                              onClick={() => requestResubmission(kyc.id)}
                              disabled={updatingId === kyc.id}
                              className="p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 transition disabled:opacity-50"
                            >
                              Resubmit
                            </button>
                            <button
                              onClick={() => setSelected(kyc)}
                              className="p-2 rounded-lg bg-white/3 hover:bg-white/5"
                            >
                              View
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-500 text-xs">Completed</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {selected ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/3 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">Submitted Documents</h3>
                  <button onClick={() => setSelected(null)} className="text-zinc-300">Close</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-zinc-400 text-sm">Selfie</p>
                    {selected.kyc_selfie_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selected.kyc_selfie_url} alt="selfie" className="w-full rounded-lg mt-2" />
                    ) : (
                      <div className="text-zinc-400 mt-2">No selfie uploaded</div>
                    )}
                  </div>

                  <div>
                    <p className="text-zinc-400 text-sm">ID Details</p>
                    <div className="mt-2 text-sm text-zinc-200">
                      <div><strong>Name:</strong> {selected.govt_id_name || '—'}</div>
                      <div><strong>Number:</strong> {selected.govt_id_number || '—'}</div>
                      <div><strong>UID:</strong> {selected.unique_id || '—'}</div>
                      <div className="mt-2"><strong>Status:</strong> {selected.kyc_status || 'Pending'}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {kycRequests.length === 0 && (
              <div className="text-center py-12 text-zinc-400">
                No KYC requests found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
