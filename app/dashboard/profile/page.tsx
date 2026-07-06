"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { ArrowLeft } from "lucide-react"

function generateShortId(id: string) {
  return id
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 6)
    .toUpperCase()
    .padEnd(6, "X")
}

interface KycRealtimeRow {
  user_id?: string
  email?: string
  [key: string]: unknown
}

function normalizeDob(value: string) {
  if (!value) return ""
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  const parts = value.split(/[\/\.\-]/)
  if (parts.length === 3) {
    const [a, b, c] = parts
    if (a.length === 4) {
      return `${a}-${b.padStart(2, "0")}-${c.padStart(2, "0")}`
    }
    return `${c}-${a.padStart(2, "0")}-${b.padStart(2, "0")}`
  }

  return value
}

export default function DashboardProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  const [userName, setUserName] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [emailVerificationStatus, setEmailVerificationStatus] = useState<string>("Not Verified")
  const [emailVerificationRequestId, setEmailVerificationRequestId] = useState<number | null>(null)
  const [userId, setUserId] = useState("")
  const [uniqueId, setUniqueId] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")
  const [dob, setDob] = useState("")
  const [withdrawNetwork, setWithdrawNetwork] = useState("TRC20")
  const [walletAddress, setWalletAddress] = useState("")
  const [kycStatus, setKycStatus] = useState("Not Started")
  const [govtIdName, setGovtIdName] = useState("")
  const [govtIdNumber, setGovtIdNumber] = useState("")
  const [country, setCountry] = useState("")
  const [countryField, setCountryField] = useState<"country" | "country_of_residence" | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState("")
  const [saving, setSaving] = useState(false)
  const [kycSaving, setKycSaving] = useState(false)
  const [emailVerifying, setEmailVerifying] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const successTimerRef = useRef<number | null>(null)
  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    void loadProfile()
  }, [])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel("profile-verification-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kyc_requests" },
        (payload) => {
          const newRow = payload.new as KycRealtimeRow | null
          const oldRow = payload.old as KycRealtimeRow | null
          const changedUserId = newRow?.user_id || oldRow?.user_id
          const changedEmail = newRow?.email || oldRow?.email
          if (changedUserId === userId || changedEmail === email) {
            void loadProfile()
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "email_verification_requests" },
        (payload) => {
          const newRow = payload.new as KycRealtimeRow | null
          const oldRow = payload.old as KycRealtimeRow | null
          const changedUserId = newRow?.user_id || oldRow?.user_id
          const changedEmail = newRow?.email || oldRow?.email
          if (changedUserId === userId || changedEmail === email) {
            void loadProfile()
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [userId, email])

  const ensureUserProfileRecord = async (user: any) => {
    if (!user?.id || !user?.email) return

    try {
      const payload = {
        user_id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email || "Investor",
        unique_id: generateShortId(user.id),
      }

      const { data: existing, error: selectError } = await supabase
        .from("users")
        .select("*")
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle()

      if (selectError) {
        console.warn("ensureUserProfileRecord select warning", selectError)
      }

      if (existing) {
        const { error: updateError } = await supabase
          .from("users")
          .update(payload)
          .eq("id", existing.id)

        if (updateError) {
          console.warn("ensureUserProfileRecord update warning", updateError)
        }
      } else {
        const { error: insertError } = await supabase
          .from("users")
          .insert(payload)

        if (insertError) {
          console.warn("ensureUserProfileRecord insert warning", insertError)
        }
      }
    } catch (e) {
      console.warn("ensureUserProfileRecord error", e)
    }
  }

  const detectCountryColumn = async (userId: string) => {
    const columns = ["country", "country_of_residence"] as const

    for (const column of columns) {
      const { error } = await supabase
        .from("users")
        .select(column)
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle()

      if (!error) {
        return column
      }

      const message = String(error?.message || error?.details || "").toLowerCase()
      if (!message.includes("column") && !message.includes("does not exist")) {
        return column
      }
    }

    return null
  }

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    setEmail(user.email || "")
    setUserId(user.id)
    const storedFull = typeof window !== "undefined" ? sessionStorage.getItem(`apex_full_name_${user.id}`) : null
    setUserName(storedFull || user.user_metadata?.full_name || user.email || "Investor")

    await ensureUserProfileRecord(user)

    const resolvedCountryField = await detectCountryColumn(user.id)
    setCountryField(resolvedCountryField)

    let profileData: any = null
    try {
      const { data: profileByUser } = await supabase
        .from("users")
        .select("*")
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle()

      profileData = profileByUser || null

      if (profileData && !profileData.user_id) {
        await supabase.from("users").update({ user_id: user.id }).eq("id", profileData.id)
      }
    } catch (profileError) {
      console.warn("loadProfile public.users lookup warning", profileError)
    }

    if (profileData) {
      // populate first/last name if available, fallback from full_name
      if (profileData.first_name || profileData.last_name) {
        setFirstName(profileData.first_name || "")
        setLastName(profileData.last_name || "")
      } else if (profileData.full_name) {
        const parts = String(profileData.full_name).split(" ")
        setFirstName(parts.slice(0, -1).join(" ") || parts[0] || "")
        setLastName(parts.slice(-1).join(" ") || "")
      }
      setUniqueId(
        profileData.unique_id || generateShortId(user.id)
      )
      setMobileNumber(
        profileData.mobile_number || profileData.mobile || ""
      )
      setDob(
        normalizeDob(profileData.dob || profileData.date_of_birth || "")
      )
      setWithdrawNetwork(
        profileData.withdraw_network || "TRC20"
      )
      setWalletAddress(
        profileData.wallet_address || ""
      )
      setKycStatus(
        profileData.kyc_status ||
          (profileData.govt_id_number ? "Pending" : "Not Started")
      )
      setGovtIdName(
        profileData.full_name || ""
      )
      setGovtIdNumber(
        profileData.govt_id_number || profileData.govt_id || ""
      )
      setCountry(
        (resolvedCountryField && profileData[resolvedCountryField]) ||
          profileData.country ||
          profileData.country_of_residence ||
          ""
      )
      setSelfiePreview(profileData.document_url || profileData.document_back || "")
    } else {
      setUniqueId(generateShortId(user.id))
    }

    // load latest email verification request for this user (if any)
    try {
      const { data: ev } = await supabase
        .from("email_verification_requests")
        .select("*")
        .eq("email", user.email)
        .order("id", { ascending: false })
        .limit(1)

      const latest = ev && ev[0]
      if (latest) {
        const s = (latest.status || "").toLowerCase()
        if (s === "pending") setEmailVerificationStatus("Pending")
        else if (s === "verified" || s === "approved") setEmailVerificationStatus("Verified")
        else if (s === "rejected") setEmailVerificationStatus("Rejected")
        setEmailVerificationRequestId(latest.id || null)
      }
    } catch (e) {
      // ignore
    }

    // load latest KYC request for this user (from kyc_requests table)
    try {
      const { data: k } = await supabase
        .from("kyc_requests")
        .select("*")
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .order("created_at", { ascending: false })
        .limit(1)

      const latestKyc = k && k[0]
      if (latestKyc && latestKyc.status) {
        const ks = (latestKyc.status || "").toString().toLowerCase()
        if (ks === "pending") setKycStatus("Pending")
        else if (ks === "approved") setKycStatus("Approved")
        else if (ks === "rejected") setKycStatus("Rejected")
        else setKycStatus(ks.charAt(0).toUpperCase() + ks.slice(1))
      }
    } catch (e) {
      // ignore kyc fetch errors
    }

    setLoading(false)
  }

  const requestEmailVerification = async () => {
    setEmailVerifying(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !user.email) {
        alert("Please login first")
        setEmailVerifying(false)
        return
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const payload = {
        user_id: user.id,
        email: user.email,
        otp,
        status: "pending",
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }

      console.log("Submitting email verification request", { userId: user.id, email: user.email })
      console.log("Generated OTP:", otp)
      console.log("Payload:", payload)

      await ensureUserProfileRecord(user)

      const { data, error } = await supabase.from("email_verification_requests").insert([payload])

      if (error) {
        console.error(error)
        alert(error.message)
        setEmailVerifying(false)
        return
      }

      console.log("Email verification request inserted", data)
      setEmailVerificationStatus("Pending")
      const inserted = data as any[] | null
      if (inserted && inserted[0] && inserted[0].id) setEmailVerificationRequestId(inserted[0].id)
      await loadProfile()
      alert("Verification request created. Admin will review.")
    } catch (e) {
      console.error(e)
      alert("Unable to create verification request.")
    } finally {
      setEmailVerifying(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert("Please login first")
      setSaving(false)
      return
    }

    const fullName = `${firstName ? firstName : ""}${firstName && lastName ? " " : ""}${lastName ? lastName : userName}`.trim()

    const payloadAny: any = { user_id: user.id, email: user.email, unique_id: uniqueId || generateShortId(user.id) }
    if (firstName) payloadAny.first_name = firstName
    if (lastName) payloadAny.last_name = lastName
    if (fullName) payloadAny.full_name = fullName
    if (mobileNumber) payloadAny.mobile_number = mobileNumber
    if (dob) payloadAny.dob = dob
    if (withdrawNetwork) payloadAny.withdraw_network = withdrawNetwork
    if (walletAddress) payloadAny.wallet_address = walletAddress

    let { data: existing, error: selectError } = await supabase
      .from('users')
      .select('id')
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .maybeSingle()

    if (selectError) {
      console.log(selectError)
    }

    if (!existing) {
      await ensureUserProfileRecord(user)
      const result = await supabase
        .from('users')
        .select('id')
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle()
      existing = result.data
    }

    if (!existing) {
      alert('Unable to save profile: profile record not found.')
      setSaving(false)
      return
    }

    const updateRes = await supabase.from('users').update(payloadAny).eq('id', existing.id)
    const error = updateRes.error

    if (error) {
      console.log(error)
      alert(error.message)
      setSaving(false)
      return
    }
    // update UI and notify other parts of the app
    setUserName(fullName || userName)
    try {
      if (user.id) {
        sessionStorage.setItem(`apex_full_name_${user.id}`, fullName)
      }
    } catch (e) {
      // ignore
    }

    // dispatch a profile update event so other pages can sync immediately
    try {
      window.dispatchEvent(new CustomEvent('apex:profile_updated', { detail: { userId: user.id, firstName, lastName, fullName, mobileNumber, dob, walletAddress, withdrawNetwork } }))
    } catch (e) {}

    alert("Profile and withdrawal details saved successfully.")
    setSaving(false)
  }

  const saveProfileDetails = async () => {
    setSaving(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert("Please login first")
      setSaving(false)
      return
    }

    const fullName = `${firstName ? firstName : ""}${firstName && lastName ? " " : ""}${lastName ? lastName : userName}`.trim()

    const payloadAny2: any = { user_id: user.id, email: user.email, unique_id: uniqueId || generateShortId(user.id) }
    if (firstName) payloadAny2.first_name = firstName
    if (lastName) payloadAny2.last_name = lastName
    if (fullName) payloadAny2.full_name = fullName
    if (mobileNumber) payloadAny2.mobile_number = mobileNumber
    if (dob) payloadAny2.dob = dob
    if (withdrawNetwork) payloadAny2.withdraw_network = withdrawNetwork
    if (walletAddress) payloadAny2.wallet_address = walletAddress

    let { data: existing, error: selectError } = await supabase
      .from('users')
      .select('id')
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .maybeSingle()

    if (selectError) {
      console.log(selectError)
    }

    if (!existing) {
      await ensureUserProfileRecord(user)
      const result = await supabase
        .from('users')
        .select('id')
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle()
      existing = result.data
    }

    if (!existing) {
      alert('Unable to save profile: profile record not found.')
      setSaving(false)
      return
    }

    const updateRes = await supabase.from('users').update(payloadAny2).eq('id', existing.id)
    const error = updateRes.error

    if (error) {
      console.log(error)
      alert(error.message)
      setSaving(false)
      return
    }

    setUserName(fullName || userName)
    try {
      if (user.id) sessionStorage.setItem(`apex_full_name_${user.id}`, fullName)
    } catch (e) {}

    // dispatch profile update for realtime sync
    try {
      window.dispatchEvent(new CustomEvent('apex:profile_updated', { detail: { userId: user.id, firstName, lastName, fullName, mobileNumber, dob, walletAddress, withdrawNetwork } }))
    } catch (e) {}

    setSuccessMessage("Profile details updated successfully")
    if (successTimerRef.current) window.clearTimeout(successTimerRef.current)
    successTimerRef.current = window.setTimeout(() => setSuccessMessage(""), 3000)

    setSaving(false)
  }

  const submitKyc = async () => {
    setKycSaving(true)

    if (!govtIdName || !country || !govtIdNumber || (!selfieFile && !selfiePreview)) {
      alert("Please complete all KYC fields (including Country) and upload a selfie.")
      setKycSaving(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert("Please login first")
      setKycSaving(false)
      return
    }

    let selfieUrl = selfiePreview

    if (selfieFile) {
      const fileExt = selfieFile.name.split(".").pop() || "jpg"
      const fileName = `kyc-${user.id}-${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("kyc-selfies")
        .upload(fileName, selfieFile, { upsert: true })

      if (uploadError) {
        console.warn("KYC upload error:", uploadError)
      } else if (uploadData) {
        const { data: urlData } = supabase.storage
          .from("kyc-selfies")
          .getPublicUrl(fileName)
        selfieUrl = urlData.publicUrl
      }
    }

    // Persist KYC state in public.users and upsert the related kyc_requests row.
    try {
      console.log("Submitting KYC request", { userId: user.id, email: user.email, country })

      let resolvedCountryField = countryField
      if (!resolvedCountryField) {
        resolvedCountryField = await detectCountryColumn(user.id)
        setCountryField(resolvedCountryField)
      }

      const profilePayload: any = {
        user_id: user.id,
        email: user.email,
        full_name: userName,
        unique_id: uniqueId || generateShortId(user.id),
        kyc_status: "pending",
      }

      if (resolvedCountryField) {
        profilePayload[resolvedCountryField] = country
      }

      const { data: existingProfile, error: profileSelectError } = await supabase
        .from("users")
        .select("id")
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle()

      if (profileSelectError) {
        console.warn("submitKyc profile lookup error", profileSelectError)
      }

      if (existingProfile) {
        const { error: profileUpdateError } = await supabase
          .from("users")
          .update(profilePayload)
          .eq("id", existingProfile.id)

        if (profileUpdateError) {
          console.error("Failed to update public.users for KYC:", profileUpdateError)
          alert("Failed to submit KYC: " + (profileUpdateError.message || "unknown error"))
          setKycSaving(false)
          return
        }
      } else {
        const { error: profileInsertError } = await supabase.from("users").insert(profilePayload)
        if (profileInsertError) {
          console.error("Failed to insert public.users for KYC:", profileInsertError)
          alert("Failed to submit KYC: " + (profileInsertError.message || "unknown error"))
          setKycSaving(false)
          return
        }
      }

      const kycPayload: any = {
        user_id: user.id,
        email: user.email,
        full_name: govtIdName,
        govt_id_name: govtIdName,
        govt_id_number: govtIdNumber,
        country: country,
        document_url: selfieUrl,
        status: "pending",
      }

      const { data: existingKyc, error: kycSelectError } = await supabase
        .from("kyc_requests")
        .select("id")
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle()

      if (kycSelectError) {
        console.warn("submitKyc kyc_requests lookup error", kycSelectError)
      }

      if (existingKyc) {
        const { error: kErr } = await supabase
          .from("kyc_requests")
          .update({ ...kycPayload, updated_at: new Date().toISOString() })
          .eq("id", existingKyc.id)

        if (kErr) {
          console.error("Failed to update kyc_requests:", kErr)
          alert("Failed to submit KYC: " + (kErr.message || "unknown error"))
          setKycSaving(false)
          return
        }
      } else {
        const { data: kData, error: kErr } = await supabase.from("kyc_requests").insert([kycPayload])
        if (kErr) {
          console.error("Failed to insert kyc_requests:", kErr)
          alert("Failed to submit KYC: " + (kErr.message || "unknown error"))
          setKycSaving(false)
          return
        }
        console.log("KYC request inserted", kData)
      }

      setKycStatus("Pending")
      await loadProfile()
      alert("KYC submitted. Admin will verify your documents soon.")
    } catch (e) {
      console.error("KYC submit error:", e)
      alert("Failed to submit KYC. Please try again.")
    } finally {
      setKycSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020406] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white p-6" style={{background: 'linear-gradient(180deg, #050816 0%, #07111D 30%, #06171B 60%, #050816 100%)'}}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl glass-panel px-4 py-3 text-sm text-emerald-300 transition"
          >
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>

          <div className="text-right">
            <p className="text-zinc-400 text-sm">Unique ID</p>
            <h1 className="text-3xl font-black neon-text">
              {uniqueId}
            </h1>
            <div>
              <button
                onClick={async () => {
                  setLogoutLoading(true)
                  try {
                    await supabase.auth.signOut()
                    try {
                      if (userId) {
                        sessionStorage.removeItem(`apex_full_name_${userId}`)
                      }
                      sessionStorage.removeItem('apex_signup_email')
                    } catch (e) {}
                    router.push('/login')
                  } catch (e) {
                    console.error('Logout error', e)
                    alert('Unable to logout. Please try again.')
                  } finally {
                    setLogoutLoading(false)
                  }
                }}
                disabled={logoutLoading}
                className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-red-600/20 bg-red-600/6 px-4 py-2 text-sm font-semibold text-red-300 hover:brightness-110 disabled:opacity-60"
              >
                {logoutLoading ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>

        {/* Profile header */}
        <div className="mb-6">
          <div className="glass-panel p-6 rounded-3xl flex items-center gap-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden border border-emerald-400/20"
                style={{ boxShadow: "0 0 18px rgba(16,185,129,0.06)", display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {/* Always show the Dollar symbol avatar in the dashboard; KYC selfie is stored separately for admin verification only. */}
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" style={{ display: 'block' }}>
                  <defs>
                    <linearGradient id="avatarGrad" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="#02120f" />
                      <stop offset="60%" stopColor="#05221a" />
                      <stop offset="100%" stopColor="#06302a" />
                    </linearGradient>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <g filter="url(#glow)">
                    <circle cx="50" cy="50" r="46" fill="url(#avatarGrad)" stroke="#0f766e" strokeOpacity="0.18" strokeWidth="2" />
                    <text x="50" y="50" textAnchor="middle" fontSize="46" fontWeight="700" fill="#D4AF37" dominantBaseline="middle" style={{ textShadow: '0 0 8px rgba(212,175,55,0.45)' }}>$</text>
                  </g>
                </svg>
              </div>
            <div className="flex-1">
              <div className="text-sm text-zinc-400">Account</div>
              <div>
                <h2 className="text-2xl font-black neon-text">{(firstName || lastName) ? `${firstName} ${lastName}`.trim() : email}</h2>
                <div className="text-sm text-zinc-400">{email}</div>
              </div>
              <div className="text-xs text-zinc-400 mt-1">UID: {uniqueId}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-3xl">
            <h2 className="text-2xl font-black mb-6 fin-heading neon-text">Profile Details</h2>

            <div className="space-y-5">
                <div>
                  <p className="text-zinc-400 text-sm">First Name</p>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                    className="mt-3 w-full input-glass"
                  />
                </div>

                <div>
                  <p className="text-zinc-400 text-sm">Last Name</p>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                    className="mt-3 w-full input-glass"
                  />
                </div>
              <div>
                <p className="text-zinc-400 text-sm">Email</p>
                <div className="mt-3 flex items-center gap-3">
                  <input value={email} readOnly className="flex-1 input-glass" />
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    emailVerificationStatus === "Verified"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : emailVerificationStatus === "Pending"
                      ? "bg-amber-500/15 text-amber-300"
                      : emailVerificationStatus === "Rejected"
                      ? "bg-red-500/15 text-red-300"
                      : "bg-zinc-500/15 text-zinc-300"
                  }`}>{emailVerificationStatus}</div>
                  <button
                    onClick={requestEmailVerification}
                    disabled={emailVerificationStatus === "Pending" || emailVerificationStatus === "Verified" || emailVerifying}
                    className="ml-2 neon-btn"
                  >
                    {emailVerifying ? "Requesting..." : "Verify Email"}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-zinc-400 text-sm">Mobile Number</p>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="Enter mobile number"
                  className="mt-3 w-full input-glass"
                />
              </div>

              <div>
                <p className="text-zinc-400 text-sm">Date of Birth</p>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  onClick={(e) => {
                    const target = e.currentTarget as HTMLInputElement
                    if (typeof target.showPicker === "function") {
                      try {
                        target.showPicker()
                      } catch (err) {
                        // ignore runtime errors if browser disallows programmatic picker
                      }
                    }
                  }}
                  autoComplete="bday"
                  className="mt-3 w-full input-glass cursor-text"
                />
              </div>

              {successMessage ? (
                <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-emerald-200 text-sm">
                  {successMessage}
                </div>
              ) : null}

              <div>
                <button
                  onClick={saveProfileDetails}
                  disabled={saving}
                  className="mt-2 w-full neon-btn"
                >
                  {saving ? "Saving..." : "Save Profile Details"}
                </button>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl">
            <h2 className="text-2xl font-black mb-6 fin-heading neon-text">Withdrawal Details</h2>

            <div className="space-y-5">
              <div>
                <p className="text-zinc-400 text-sm">Network</p>
                <select
                  value={withdrawNetwork}
                  onChange={(e) => setWithdrawNetwork(e.target.value)}
                  className="mt-3 w-full input-glass"
                >
                  <option value="TRC20">TRC20</option>
                  <option value="BEP20">BEP20</option>
                  <option value="ERC20">ERC20</option>
                </select>
              </div>

              <div>
                <p className="text-zinc-400 text-sm">Wallet Address</p>
                <input
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="Enter wallet address"
                  className="mt-3 w-full input-glass"
                />
              </div>

              <button
                onClick={saveProfile}
                disabled={saving}
                className="w-full neon-btn"
              >
                {saving ? "Saving..." : "Save Withdrawal Settings"}
              </button>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black fin-heading neon-text">KYC Verification</h2>
                <p className="text-zinc-400 mt-2 text-sm">
                  Submit your government ID and selfie for admin review.
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                  kycStatus === "verified"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : kycStatus === "Pending"
                    ? "bg-amber-500/15 text-amber-300"
                    : "bg-zinc-500/15 text-zinc-300"
                }`}
              >
                {kycStatus}
              </span>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-zinc-400 text-sm">Name as per Government ID</p>
                <input
                  value={govtIdName}
                  onChange={(e) => setGovtIdName(e.target.value)}
                  placeholder="Enter name on govt ID"
                  className="mt-3 w-full input-glass"
                />
              </div>

              <div>
                <p className="text-zinc-400 text-sm">Country</p>
                <input
                  list="country-list"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Select Country"
                  className="mt-3 w-full input-glass"
                />
                <datalist id="country-list">
                  <option value="Afghanistan" />
                  <option value="Albania" />
                  <option value="Algeria" />
                  <option value="Andorra" />
                  <option value="Angola" />
                  <option value="Antigua and Barbuda" />
                  <option value="Argentina" />
                  <option value="Armenia" />
                  <option value="Australia" />
                  <option value="Austria" />
                  <option value="Azerbaijan" />
                  <option value="Bahamas" />
                  <option value="Bahrain" />
                  <option value="Bangladesh" />
                  <option value="Barbados" />
                  <option value="Belarus" />
                  <option value="Belgium" />
                  <option value="Belize" />
                  <option value="Benin" />
                  <option value="Bhutan" />
                  <option value="Bolivia" />
                  <option value="Bosnia and Herzegovina" />
                  <option value="Botswana" />
                  <option value="Brazil" />
                  <option value="Brunei" />
                  <option value="Bulgaria" />
                  <option value="Burkina Faso" />
                  <option value="Burundi" />
                  <option value="Cabo Verde" />
                  <option value="Cambodia" />
                  <option value="Cameroon" />
                  <option value="Canada" />
                  <option value="Central African Republic" />
                  <option value="Chad" />
                  <option value="Chile" />
                  <option value="China" />
                  <option value="Colombia" />
                  <option value="Comoros" />
                  <option value="Costa Rica" />
                  <option value="Cote d'Ivoire" />
                  <option value="Croatia" />
                  <option value="Cuba" />
                  <option value="Cyprus" />
                  <option value="Czechia (Czech Republic)" />
                  <option value="Denmark" />
                  <option value="Djibouti" />
                  <option value="Dominica" />
                  <option value="Dominican Republic" />
                  <option value="Ecuador" />
                  <option value="Egypt" />
                  <option value="El Salvador" />
                  <option value="Estonia" />
                  <option value="Eswatini" />
                  <option value="Ethiopia" />
                  <option value="Fiji" />
                  <option value="Finland" />
                  <option value="France" />
                  <option value="Gabon" />
                  <option value="Gambia" />
                  <option value="Georgia" />
                  <option value="Germany" />
                  <option value="Ghana" />
                  <option value="Greece" />
                  <option value="Grenada" />
                  <option value="Guatemala" />
                  <option value="Guinea" />
                  <option value="Guinea-Bissau" />
                  <option value="Guyana" />
                  <option value="Haiti" />
                  <option value="Honduras" />
                  <option value="Hungary" />
                  <option value="Iceland" />
                  <option value="India" />
                  <option value="Indonesia" />
                  <option value="Iran" />
                  <option value="Iraq" />
                  <option value="Ireland" />
                  <option value="Israel" />
                  <option value="Italy" />
                  <option value="Jamaica" />
                  <option value="Japan" />
                  <option value="Jordan" />
                  <option value="Kazakhstan" />
                  <option value="Kenya" />
                  <option value="Kiribati" />
                  <option value="Kuwait" />
                  <option value="Kyrgyzstan" />
                  <option value="Laos" />
                  <option value="Latvia" />
                  <option value="Lebanon" />
                  <option value="Lesotho" />
                  <option value="Liberia" />
                  <option value="Libya" />
                  <option value="Liechtenstein" />
                  <option value="Lithuania" />
                  <option value="Luxembourg" />
                  <option value="Madagascar" />
                  <option value="Malawi" />
                  <option value="Malaysia" />
                  <option value="Maldives" />
                  <option value="Mali" />
                  <option value="Malta" />
                  <option value="Marshall Islands" />
                  <option value="Mauritania" />
                  <option value="Mauritius" />
                  <option value="Mexico" />
                  <option value="Micronesia" />
                  <option value="Moldova" />
                  <option value="Monaco" />
                  <option value="Mongolia" />
                  <option value="Montenegro" />
                  <option value="Morocco" />
                  <option value="Mozambique" />
                  <option value="Myanmar" />
                  <option value="Namibia" />
                  <option value="Nauru" />
                  <option value="Nepal" />
                  <option value="Netherlands" />
                  <option value="New Zealand" />
                  <option value="Nicaragua" />
                  <option value="Niger" />
                  <option value="Nigeria" />
                  <option value="North Korea" />
                  <option value="North Macedonia" />
                  <option value="Norway" />
                  <option value="Oman" />
                  <option value="Pakistan" />
                  <option value="Palau" />
                  <option value="Panama" />
                  <option value="Papua New Guinea" />
                  <option value="Paraguay" />
                  <option value="Peru" />
                  <option value="Philippines" />
                  <option value="Poland" />
                  <option value="Portugal" />
                  <option value="Qatar" />
                  <option value="Romania" />
                  <option value="Russia" />
                  <option value="Rwanda" />
                  <option value="Saint Kitts and Nevis" />
                  <option value="Saint Lucia" />
                  <option value="Saint Vincent and the Grenadines" />
                  <option value="Samoa" />
                  <option value="San Marino" />
                  <option value="Sao Tome and Principe" />
                  <option value="Saudi Arabia" />
                  <option value="Senegal" />
                  <option value="Serbia" />
                  <option value="Seychelles" />
                  <option value="Sierra Leone" />
                  <option value="Singapore" />
                  <option value="Slovakia" />
                  <option value="Slovenia" />
                  <option value="Solomon Islands" />
                  <option value="Somalia" />
                  <option value="South Africa" />
                  <option value="South Korea" />
                  <option value="South Sudan" />
                  <option value="Spain" />
                  <option value="Sri Lanka" />
                  <option value="Sudan" />
                  <option value="Suriname" />
                  <option value="Sweden" />
                  <option value="Switzerland" />
                  <option value="Syria" />
                  <option value="Taiwan" />
                  <option value="Tajikistan" />
                  <option value="Tanzania" />
                  <option value="Thailand" />
                  <option value="Timor-Leste" />
                  <option value="Togo" />
                  <option value="Tonga" />
                  <option value="Trinidad and Tobago" />
                  <option value="Tunisia" />
                  <option value="Turkey" />
                  <option value="Turkmenistan" />
                  <option value="Tuvalu" />
                  <option value="Uganda" />
                  <option value="Ukraine" />
                  <option value="United Arab Emirates" />
                  <option value="United Kingdom" />
                  <option value="United States" />
                  <option value="Uruguay" />
                  <option value="Uzbekistan" />
                  <option value="Vanuatu" />
                  <option value="Vatican City" />
                  <option value="Venezuela" />
                  <option value="Vietnam" />
                  <option value="Yemen" />
                  <option value="Zambia" />
                  <option value="Zimbabwe" />
                </datalist>
              </div>

              <div>
                <p className="text-zinc-400 text-sm">Government ID Number</p>
                <input
                  value={govtIdNumber}
                  onChange={(e) => setGovtIdNumber(e.target.value)}
                  placeholder="Enter govt ID number"
                  className="mt-3 w-full input-glass"
                />
              </div>

              <div>
                <p className="text-zinc-400 text-sm">Upload Selfie</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setSelfieFile(file)
                    if (file) {
                      setSelfiePreview(URL.createObjectURL(file))
                    }
                  }}
                  className="mt-3 w-full text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black"
                />
              </div>

              {selfiePreview ? (
                <div className="rounded-3xl border border-white/10 bg-black/40 p-4">
                  <p className="text-zinc-400 text-sm mb-3">
                    Selfie Preview
                  </p>
                  <img
                    src={selfiePreview}
                    alt="KYC selfie preview"
                    className="w-full rounded-2xl object-cover"
                  />
                </div>
              ) : null}

              <button
                onClick={submitKyc}
                disabled={kycSaving}
                className="w-full neon-btn"
              >
                {kycSaving ? "Submitting KYC..." : "Submit KYC"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
