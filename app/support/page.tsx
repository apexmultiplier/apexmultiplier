"use client"

import { useState } from "react"
import { supabase } from "../../lib/supabase"
import Link from "next/link"

export default function SupportPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [category, setCategory] = useState("Other")
  const [message, setMessage] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf", "image/jpg"]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!fullName || !email || !subject || !message) {
      setError("Please fill all required fields")
      return
    }
    setLoading(true)
    try {
      // get current authenticated user
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError) console.error("auth.getUser error:", authError)
      const user = authData?.user ?? null
      console.log("Current user id:", user?.id ?? null)

      let screenshot_url: string | null = null
      if (file) {
        if (!allowedTypes.includes(file.type)) {
          setError("Unsupported file type")
          setLoading(false)
          return
        }
        const fileName = `${Date.now()}_${file.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage.from("support-screenshots").upload(fileName, file)
        console.log("uploadData", uploadData, "uploadError", uploadError)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from("support-screenshots").getPublicUrl(fileName)
        screenshot_url = publicUrl
      }

      const insertPayload = {
        user_id: user?.id ?? null,
        full_name: fullName,
        email,
        subject,
        category,
        message,
        screenshot_url,
        status: "Open",
      }

      console.log("Inserting ticket payload:", insertPayload)

      const { data, error: insertError } = await supabase.from("support_tickets").insert(insertPayload)
      console.log("Insert result:", data, "Insert error:", insertError)
      if (insertError) throw insertError
      setSuccess("Support ticket submitted. Our team will contact you.")
      setFullName("")
      setEmail("")
      setSubject("")
      setCategory("Other")
      setMessage("")
      setFile(null)
    } catch (err: any) {
      console.error("Ticket submission error:", err)
      setError(err.message || "Failed to submit ticket")
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#020406] text-white py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
          <h1 className="text-3xl font-black">Support Center</h1>
          <p className="mt-3 text-zinc-300">Submit a ticket and our support team will respond as soon as possible.</p>

          <form className="mt-6 grid grid-cols-1 gap-4" onSubmit={handleSubmit}>
            <input className="p-3 rounded-md bg-[#03121c] border border-white/6 text-white" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <input className="p-3 rounded-md bg-[#03121c] border border-white/6 text-white" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="p-3 rounded-md bg-[#03121c] border border-white/6 text-white" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <select className="p-3 rounded-md bg-[#03121c] border border-white/6 text-white" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Deposit Issue</option>
              <option>Withdrawal Issue</option>
              <option>KYC Verification</option>
              <option>Account Problem</option>
              <option>Technical Support</option>
              <option>Investment Plan</option>
              <option>Other</option>
            </select>
            <textarea className="p-3 rounded-md bg-[#03121c] border border-white/6 text-white" placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} />
            <input type="file" accept="image/*,.pdf,.webp" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
            <div className="flex items-center gap-3">
              <button type="submit" disabled={loading} className="h-12 rounded-2xl bg-gradient-to-r from-[#00ffae] via-[#00e5ff] to-[#10f2c1] px-6 text-sm font-bold text-black">{loading ? 'Submitting...' : 'Submit Ticket'}</button>
              <Link href="/dashboard/support" className="text-sm text-[#00ffae]">View My Tickets</Link>
            </div>
            {error ? <p className="text-rose-400">{error}</p> : null}
            {success ? <p className="text-emerald-400">{success}</p> : null}
          </form>
        </div>
      </div>
    </main>
  )
}
