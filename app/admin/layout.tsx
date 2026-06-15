"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Menu, Users, DollarSign, FileText, ClipboardList, Bell, LifeBuoy, MailCheck, BarChart3, Settings as SettingsIcon, LogOut } from "lucide-react"
import { supabase } from "../../lib/supabase"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [toastMessage, setToastMessage] = useState("")
  const [logoutLoading, setLogoutLoading] = useState(false)

  const nav = [
    { label: "Overview", href: "/admin", icon: Users },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Deposits", href: "/admin/deposits", icon: DollarSign },
    { label: "Withdrawals", href: "/admin/withdrawals", icon: FileText },
    { label: "Support Tickets", href: "/admin/support-tickets", icon: LifeBuoy },
    { label: "KYC Requests", href: "/admin/kyc", icon: ClipboardList },
    { label: "Notifications", href: "/admin/notifications", icon: Bell },
    { label: "Email Verification", href: "/admin/email-verifications", icon: MailCheck },
    { label: "Settings", href: "/admin/settings", icon: SettingsIcon },
  ]

  useEffect(() => {
    // Do not enforce auth checks on login or create-admin pages
    if (pathname === '/admin/login' || pathname === '/admin/create-admin') {
      setAuthorized(true)
      setChecking(false)
      return
    }

    let mounted = true
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          console.log('AdminLayout - no session, redirecting to /admin/login')
          setAuthorized(false)
          router.push('/admin/login')
          return
        }

        const email = session.user?.email || ''
        console.log('AdminLayout - Current path:', pathname)
        console.log('AdminLayout - Current user:', email)
        const { data, error } = await supabase.from('users').select('role').eq('email', email).single()
        console.log('AdminLayout - role query result:', { data, error: error?.message })
        if (error || !data || data.role !== 'admin') {
          console.log('AdminLayout - not admin, redirecting to /admin/login')
          setAuthorized(false)
          router.push('/admin/login')
          return
        }

        // authorized
        setAuthorized(true)
      } catch (e) {
        console.warn('Admin auth check failed', e)
        router.push('/admin/login')
        return
      } finally {
        if (mounted) setChecking(false)
      }
    })()

    return () => { mounted = false }
  }, [pathname])

  if (checking || authorized === null) {
    return <div className="min-h-screen flex items-center justify-center">Checking credentials...</div>
  }

  if (authorized === false) {
    // We're redirecting to login; show placeholder until navigation completes
    return <div className="min-h-screen flex items-center justify-center">Redirecting to admin login…</div>
  }

  // If we're on the login or create-admin pages, render the page without admin chrome
  if (pathname === '/admin/login' || pathname === '/admin/create-admin') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-[#020406] text-white">
      <div className="flex">
        {/* Backdrop for mobile/tablet when sidebar is open */}
        <div onClick={() => setOpen(false)} className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden ${open ? 'block' : 'hidden'}`} />

        <aside className={`fixed inset-y-0 left-0 z-40 w-72 transform bg-white/5 border-r border-white/6 backdrop-blur-3xl transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full' } overflow-y-auto`}>
          <div className="h-full flex flex-col p-6 gap-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-[#0a0f1c]/80 border border-[#00ffae]/20 shadow-[0_0_18px_rgba(0,255,174,0.18)]">
                <img src="/logo.png" alt="logo" className="max-h-9 object-contain" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">Admin</p>
                <p className="text-lg font-black">Dashboard</p>
              </div>
            </div>

            <nav className="flex-1 overflow-auto">
              <ul className="space-y-2">
                {nav.map((n) => (
                  <li key={n.href}>
                    <Link href={n.href} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/6 transition">
                      <n.icon className="w-5 h-5 text-[#00ffae]" />
                      <span className="font-medium">{n.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="text-sm text-zinc-400">© Apex Multiplier</div>
          </div>
        </aside>

        <div className={`flex-1 min-h-screen transition-all duration-300 ${open ? 'lg:ml-72' : ''}`}>
          <header className="sticky top-4 z-30 px-6">
            <div className="max-w-7xl mx-auto">
              <div className="relative overflow-hidden rounded-[20px] border border-[rgba(0,255,174,0.08)] bg-white/5 px-6 py-3 backdrop-blur-3xl shadow-[0_0_40px_rgba(0,255,174,0.06)] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button aria-label="menu" onClick={() => setOpen(!open)} className="p-2 rounded-md bg-white/3 hover:bg-white/6">
                    <Menu className="w-5 h-5 text-white" />
                  </button>
                  <div>
                    <p className="text-xs text-zinc-400">Admin Panel</p>
                    <p className="font-black text-lg">Overview</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="p-2 rounded-md bg-white/3 hover:bg-white/6"><Bell className="w-5 h-5 text-[#00ffae]" /></button>

                  <button onClick={async () => {
                    try {
                      setLogoutLoading(true)
                      await supabase.auth.signOut()
                      setToastMessage("Successfully logged out")
                      setTimeout(() => setToastMessage(""), 3000)
                      router.push('/admin/login')
                    } catch (e) {
                      // ignore
                    } finally {
                      setLogoutLoading(false)
                    }
                  }} className="p-2 rounded-md bg-white/3 hover:bg-white/6 flex items-center gap-2">
                    <LogOut className="w-5 h-5 text-white" />
                    <span className="sr-only">Logout</span>
                  </button>

                  <div className="inline-flex items-center gap-2 rounded-2xl bg-white/6 px-3 py-1">
                    <div className="h-8 w-8 rounded-full bg-[#03121c] grid place-items-center">A</div>
                    <div className="text-sm">
                      <div className="font-semibold">Admin</div>
                      <div className="text-zinc-400 text-xs">administrator@apex.com</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="pt-8 pb-16 px-6">
            <div className="max-w-7xl mx-auto">
              {/* glass container for content */}
              <div className="relative rounded-[20px] border border-white/6 bg-white/5 p-6 backdrop-blur-3xl shadow-[0_40px_120px_rgba(0,0,0,0.25)]">
                {children}
              </div>
              {toastMessage && (
                <div className="fixed top-6 right-6 z-50">
                  <div className="rounded-lg bg-emerald-500/90 text-black px-4 py-2 font-semibold shadow-lg">{toastMessage}</div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
