import Link from "next/link"

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#020406] text-white py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
          <h1 className="text-3xl font-black">Terms & Conditions</h1>
          <p className="mt-4 text-zinc-300">Please read these terms carefully before using the platform.</p>

          <section className="mt-6">
            <h2 className="text-xl font-bold">Acceptance of Terms</h2>
            <p className="mt-2 text-zinc-300">By accessing or using this platform you agree to be bound by these Terms & Conditions.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-bold">User Responsibilities</h2>
            <p className="mt-2 text-zinc-300">Users must provide accurate information and comply with all applicable laws and regulations.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-bold">Account Registration</h2>
            <p className="mt-2 text-zinc-300">Account registration requires valid contact information and may require identity verification.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-bold">KYC Requirements</h2>
            <p className="mt-2 text-zinc-300">We may require KYC to comply with regulatory and security obligations.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-bold">Platform Usage Rules</h2>
            <p className="mt-2 text-zinc-300">Users agree to use the platform responsibly and not engage in prohibited activities.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-bold">Deposits & Withdrawals</h2>
            <p className="mt-2 text-zinc-300">Deposits and withdrawals are subject to verification and applicable processing times.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-bold">Security Responsibilities</h2>
            <p className="mt-2 text-zinc-300">Users are responsible for protecting their account credentials and notifying us of any unauthorized access.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-bold">Prohibited Activities</h2>
            <p className="mt-2 text-zinc-300">Prohibited activities include fraud, money laundering, and abusing the platform.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-bold">Risk Disclosure</h2>
            <p className="mt-2 text-zinc-300">Investing carries risk. We do not guarantee profits and users should understand the risks before investing.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-bold">Service Availability & Suspension</h2>
            <p className="mt-2 text-zinc-300">We may suspend or restrict accounts in case of security or compliance concerns.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-bold">Intellectual Property</h2>
            <p className="mt-2 text-zinc-300">All content and trademarks are the property of the company or licensors.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-bold">Limitation of Liability</h2>
            <p className="mt-2 text-zinc-300">Our liability is limited to the extent permitted by law. We are not responsible for market losses.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-bold">Contact Information</h2>
            <p className="mt-2 text-zinc-300">For legal inquiries, contact support via the Support Center.</p>
          </section>

          <div className="mt-8 text-right">
            <Link href="/" className="text-[#00ffae]">Return Home</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
