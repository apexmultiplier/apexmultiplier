import { Suspense } from "react"
import SignupClient from "./SignupClient"

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-white">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8">
            <p className="text-zinc-400 text-center">Loading signup page...</p>
          </div>
        </div>
      }
    >
      <SignupClient />
    </Suspense>
  )
}
