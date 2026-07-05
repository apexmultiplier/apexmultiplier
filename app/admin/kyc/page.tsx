"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, Check, X } from "lucide-react"

interface KycRecord {
  id: number | string
  user_id?: string
  email: string
  full_name?: string
  unique_id?: string
  govt_id_name?: string
  govt_id_number?: string
  government_id_number?: string
  document_url?: string
  document_type?: string
  document_front?: string
  document_back?: string
  country?: string
  status?: string
  created_at: string
  updated_at?: string | null
}

const normalizeKycStatus = (value?: string) => {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'approved') return 'approved'
  if (normalized === 'rejected') return 'rejected'
  if (normalized === 'resubmission_requested' || normalized === 'resubmission requested' || normalized === 'resubmission') return 'resubmission_requested'
  return 'pending'
}

const normalizeKycRecord = (row: any): KycRecord => ({
  id: row?.id,
  user_id: row?.user_id ?? row?.userId ?? undefined,
  email: row?.email ?? row?.userEmail ?? row?.user_email ?? '',
  full_name: row?.full_name ?? row?.userName ?? row?.name ?? row?.user_name ?? '',
  unique_id: row?.unique_id ?? row?.uid ?? row?.user_id ?? '',
  govt_id_name: row?.govt_id_name ?? row?.idType ?? row?.document_type ?? undefined,
  govt_id_number: row?.govt_id_number ?? row?.government_id_number ?? row?.idNumber ?? row?.govtIdNumber ?? undefined,
  government_id_number: row?.government_id_number ?? row?.govt_id_number ?? row?.idNumber ?? row?.govtIdNumber ?? undefined,
  document_url: row?.document_url ?? row?.documentUrl ?? row?.document ?? undefined,
  document_type: row?.document_type ?? row?.govt_id_name ?? row?.idType ?? undefined,
  document_front: row?.document_front ?? row?.documentFront ?? row?.front_document ?? row?.document_url ?? undefined,
  document_back: row?.document_back ?? row?.documentBack ?? row?.back_document ?? undefined,
  country: row?.country ?? row?.country_of_residence ?? row?.userCountry ?? '',
  status: normalizeKycStatus(row?.status ?? row?.kyc_status ?? row?.verification_status),
  created_at: row?.created_at ?? row?.createdAt ?? new Date().toISOString(),
  updated_at: row?.updated_at ?? row?.updatedAt ?? row?.created_at ?? row?.createdAt ?? null,
})

export default function KycPage() {
  const router = useRouter()
  const [kycRequests, setKycRequests] = useState<KycRecord[]>([])
  const [pendingRequests, setPendingRequests] = useState<KycRecord[]>([])
  const [approvedRequests, setApprovedRequests] = useState<KycRecord[]>([])
  const [rejectedRequests, setRejectedRequests] = useState<KycRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | string | null>(null)

  useEffect(() => {
    loadKyc()
    const subscription = supabase
      .channel("kyc_requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kyc_requests" },
        () => loadKyc()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadKyc = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("kyc_requests")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      const normalizedRequests = (data || []).map((row: any) => normalizeKycRecord(row))
      setKycRequests(normalizedRequests)
      setPendingRequests(normalizedRequests.filter((request) => request.status === 'pending'))
      setApprovedRequests(normalizedRequests.filter((request) => request.status === 'approved'))
      setRejectedRequests(normalizedRequests.filter((request) => request.status === 'rejected'))
    } catch (e) {
      console.warn('loadKyc error', e)
      setKycRequests([])
      setPendingRequests([])
      setApprovedRequests([])
      setRejectedRequests([])
    } finally {
      setLoading(false)
    }
  }

  const updateKycStatus = async (id: number | string, status: string) => {
    setUpdatingId(id)
    // find the kyc request to get the user id
    try {
      const { data: reqData, error: rErr } = await supabase.from('kyc_requests').select('*').eq('id', id).single()
      if (rErr || !reqData) {
        alert(rErr?.message || 'KYC request not found')
        setUpdatingId(null)
        return
      }

      // update kyc_requests status
      const statusStored = String(status).toLowerCase()
      const { error: kErr } = await supabase.from('kyc_requests').update({ status: statusStored }).eq('id', id)
      if (kErr) {
        alert(kErr.message)
        setUpdatingId(null)
        return
      }

      const nextStatus = normalizeKycStatus(statusStored)
      const nextUpdatedAt = new Date().toISOString()
      const updatedRecord = normalizeKycRecord({ ...reqData, status: nextStatus, updated_at: nextUpdatedAt })

      setKycRequests((prev) => {
        const withoutUpdated = prev.filter((request) => String(request.id) !== String(id))
        const nextRequests = [updatedRecord, ...withoutUpdated]
        setPendingRequests(nextRequests.filter((request) => request.status === 'pending'))
        setApprovedRequests(nextRequests.filter((request) => request.status === 'approved'))
        setRejectedRequests(nextRequests.filter((request) => request.status === 'rejected'))
        return nextRequests
      })

      // also update the matching users row by auth id or email so the profile reflects the change
      const payload: any = { kyc_status: nextStatus }
      if (nextStatus === 'approved') payload.kyc_verified_at = nextUpdatedAt
      else payload.kyc_verified_at = null

      const userId = reqData.user_id
      let userError: any = null
      if (userId) {
        const { error: idErr } = await supabase.from('users').update(payload).eq('id', userId)
        userError = idErr
      }

      if (userError && reqData.email) {
        const { error: emailErr } = await supabase.from('users').update(payload).eq('email', reqData.email)
        userError = emailErr
      }

      console.log('KYC approval applied', { id, nextStatus, userId, email: reqData.email, userError })
      if (userError) console.warn('Failed to update users.kyc_status', userError)
    } catch (e) {
      console.warn('updateKycStatus error', e)
      setUpdatingId(null)
      return
    }

    // try to insert a notification for the user (using the request's user_id)
    try {
      const { data: reqData2 } = await supabase.from('kyc_requests').select('*').eq('id', id).single()
      const targetUserId = reqData2?.user_id
      let notifType = "KYC Updated"
      let notifTitle = `KYC status: ${String(status).charAt(0).toUpperCase() + String(status).slice(1)}`
      let notifMessage = ''
      const statusLower = String(status).toLowerCase()
      if (statusLower === 'approved') {
        notifType = 'KYC Approved'
        notifTitle = 'KYC Approved'
        notifMessage = 'Your KYC documents have been approved. Thank you.'
      } else if (statusLower === 'rejected') {
        notifType = 'KYC Rejected'
        notifTitle = 'KYC Rejected'
        notifMessage = 'Your KYC documents were rejected. Please resubmit.'
      } else if (statusLower === 'resubmission_requested' || statusLower === 'resubmission requested') {
        notifType = 'KYC Resubmission'
        notifTitle = 'KYC Resubmission Requested'
        notifMessage = 'Please resubmit your KYC documents following the admin feedback.'
      } else {
        notifMessage = `Your KYC status has been updated to ${String(status).charAt(0).toUpperCase() + String(status).slice(1)}`
      }

      if (targetUserId) {
        const { error: nErr } = await supabase.from('notifications').insert([{
          user_id: targetUserId,
          type: notifType,
          title: notifTitle,
          message: notifMessage,
          read: false,
        }])

        if (nErr) console.warn('Failed to insert notification', nErr)
      }
    } catch (e) {
      console.warn('Notify error', e)
    }

    // refresh list and finish
    await loadKyc()
    setUpdatingId(null)
  }

  const [selected, setSelected] = useState<KycRecord | null>(null)

  const requestResubmission = (id: number | string) => {
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
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Pending KYC Requests ({pendingRequests.length})</h2>
                  <p className="text-zinc-400 mt-1">Show only requests with status = 'pending'</p>
                </div>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="text-zinc-400 text-center py-8">No pending KYC requests</div>
              ) : (
                <div className="overflow-x-auto">
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
                        <th className="text-left py-3 px-4">Submitted Time</th>
                        <th className="text-center py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRequests.map((kyc) => {
                        const { date, time } = formatDate(kyc.created_at)
                        return (
                          <tr key={kyc.id} className="border-b border-white/5 hover:bg-white/5 transition">
                            <td className="py-4 px-4 text-zinc-400 text-xs">{kyc.unique_id || '—'}</td>
                            <td className="py-4 px-4 text-emerald-400">{kyc.email}</td>
                            <td className="py-4 px-4">{kyc.full_name || '—'}</td>
                            <td className="py-4 px-4">{kyc.country || '—'}</td>
                            <td className="py-4 px-4">{kyc.document_type || kyc.govt_id_name || '—'}</td>
                            <td className="py-4 px-4 text-xs text-zinc-400">{kyc.government_id_number || kyc.govt_id_number || '—'}</td>
                            <td className="py-4 px-4"><span className="px-3 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400">Pending</span></td>
                            <td className="py-4 px-4 text-zinc-400 text-xs">{date} {time}</td>
                            <td className="py-4 px-4">
                              <div className="flex gap-2 justify-center">
                                <button onClick={() => updateKycStatus(kyc.id, 'approved')} disabled={updatingId === kyc.id} className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 transition disabled:opacity-50"><Check size={16} className="text-emerald-400" /></button>
                                <button onClick={() => updateKycStatus(kyc.id, 'rejected')} disabled={updatingId === kyc.id} className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition disabled:opacity-50"><X size={16} className="text-red-400" /></button>
                                <button onClick={() => requestResubmission(kyc.id)} disabled={updatingId === kyc.id} className="p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 transition disabled:opacity-50">Resubmit</button>
                                <button onClick={() => setSelected(kyc)} className="p-2 rounded-lg bg-white/3 hover:bg-white/5">View</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Approved KYC Requests ({approvedRequests.length})</h2>
                  <p className="text-zinc-400 mt-1">Show only requests with status = 'approved'</p>
                </div>
              </div>

              {approvedRequests.length === 0 ? (
                <div className="text-zinc-400 text-center py-8">No approved KYC records</div>
              ) : (
                <div className="overflow-x-auto">
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
                        <th className="text-left py-3 px-4">Approved Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvedRequests.map((kyc) => (
                        <tr key={kyc.id} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="py-4 px-4 text-zinc-400 text-xs">{kyc.unique_id || '—'}</td>
                          <td className="py-4 px-4 text-emerald-400">{kyc.email}</td>
                          <td className="py-4 px-4">{kyc.full_name || '—'}</td>
                          <td className="py-4 px-4">{kyc.country || '—'}</td>
                          <td className="py-4 px-4">{kyc.document_type || kyc.govt_id_name || '—'}</td>
                          <td className="py-4 px-4 text-xs text-zinc-400">{kyc.government_id_number || kyc.govt_id_number || '—'}</td>
                          <td className="py-4 px-4"><span className="px-3 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400">Approved</span></td>
                          <td className="py-4 px-4 text-zinc-400 text-xs">{kyc.updated_at ? new Date(kyc.updated_at).toLocaleString() : (kyc.created_at ? new Date(kyc.created_at).toLocaleString() : '—')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {selected ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/3 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">Submitted Documents</h3>
                  <button onClick={() => setSelected(null)} className="text-zinc-300">Close</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-zinc-400 text-sm">Front Document</p>
                    {selected.document_front ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selected.document_front} alt="document front" className="w-full rounded-lg mt-2" />
                    ) : (
                      <div className="text-zinc-400 mt-2">No front document uploaded</div>
                    )}
                    <p className="text-zinc-400 text-sm mt-3">Back Document</p>
                    {selected.document_back ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selected.document_back} alt="document back" className="w-full rounded-lg mt-2" />
                    ) : (
                      <div className="text-zinc-400 mt-2">No back document uploaded</div>
                    )}
                  </div>

                  <div>
                    <p className="text-zinc-400 text-sm">ID Details</p>
                    <div className="mt-2 text-sm text-zinc-200">
                      <div><strong>Name:</strong> {selected.full_name || selected.govt_id_name || '—'}</div>
                      <div><strong>Number:</strong> {selected.government_id_number || selected.govt_id_number || '—'}</div>
                      <div><strong>Type:</strong> {selected.document_type || selected.govt_id_name || '—'}</div>
                      <div><strong>UID:</strong> {selected.unique_id || '—'}</div>
                      <div className="mt-2"><strong>Status:</strong> {(selected.status || 'pending').toString().charAt(0).toUpperCase() + (selected.status || 'pending').toString().slice(1)}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
