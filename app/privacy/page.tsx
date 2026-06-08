import Link from "next/link"

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#020406] text-white py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
          <h1 className="text-3xl font-black">Privacy Policy</h1>
          <p className="mt-4 text-zinc-300">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="mt-6">
            <h2 className="text-xl font-bold">Introduction</h2>
            <p className="mt-2 text-zinc-300">We value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and protect your data when you use our platform.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-bold">Information We Collect</h2>
            <ul className="list-disc ml-6 mt-2 text-zinc-300">
              <li>Account and contact information</li>
              <li>KYC and identity verification data</li>
              <li>Transaction and payment information</li>
              <li>Usage and analytics data</li>
            </ul>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-bold">Account Information</h2>
            <p className="mt-2 text-zinc-300">We collect account details necessary to provide our services, manage your account, and comply with legal requirements.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-bold">KYC Information</h2>
            <p className="mt-2 text-zinc-300">For regulatory and security purposes we may require identity verification information (KYC). This data is handled securely and used only for compliance and fraud prevention.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-bold">Transaction Data</h2>
            <p className="mt-2 text-zinc-300">Transaction records are stored and used to process deposits, withdrawals and for reporting and compliance needs.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-bold">Security Measures</h2>
            <p className="mt-2 text-zinc-300">We protect user information using industry-standard security practices including encryption, access controls, and continuous monitoring.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-bold">Data Storage & Protection</h2>
            <p className="mt-2 text-zinc-300">User data is stored securely and is not sold to third parties. We use data only for account management, security, compliance, platform operation, and customer support.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-bold">User Rights</h2>
            <p className="mt-2 text-zinc-300">You may request access, correction, or deletion of your personal data in accordance with applicable law.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-bold">Cookie Policy</h2>
            <p className="mt-2 text-zinc-300">We use cookies and similar technologies for authentication, analytics, and site functionality.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-bold">Third-Party Services</h2>
            <p className="mt-2 text-zinc-300">We may use third-party services for infrastructure and analytics. These providers are contractually obligated to protect your data.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-bold">Contact Information</h2>
            <p className="mt-2 text-zinc-300">For privacy inquiries, contact support via the Support Center on the site.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-bold">Policy Updates</h2>
            <p className="mt-2 text-zinc-300">We may update this policy. Changes will be published on this page with a revised effective date.</p>
          </section>

          <div className="mt-8 text-right">
            <Link href="/" className="text-[#00ffae]">Return Home</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
