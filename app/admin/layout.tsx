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
  const [adminEmail, setAdminEmail] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState("")
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [createAdminOpen, setCreateAdminOpen] = useState(false)

  // Create admin form state
  const [newEmail, setNewEmail] = useState("")
  const [newConfirmEmail, setNewConfirmEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newConfirmPassword, setNewConfirmPassword] = useState("")
  const [creatingAdmin, setCreatingAdmin] = useState(false)

  const handleCreateAdmin = async () => {
    if (!newEmail) return alert('Email required')
    if (newEmail !== newConfirmEmail) return alert('Emails do not match')
    if (!newPassword) return alert('Password required')
    if (newPassword !== newConfirmPassword) return alert('Passwords do not match')
    if (newPassword.length < 8) return alert('Password must be at least 8 characters')

    setCreatingAdmin(true)
    try {
      const res = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: newPassword })
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        const err = body?.error || 'Failed to create admin'
        if (String(err).toLowerCase().includes('already')) return alert('Admin already exists')
        return alert(err)
      }

      setToastMessage('Admin account created successfully')
      setTimeout(() => setToastMessage(''), 3000)
      setCreateAdminOpen(false)
      // clear form
      setNewEmail('')
      setNewConfirmEmail('')
      setNewPassword('')
      setNewConfirmPassword('')
    } catch (e) {
      alert((e as Error).message || 'Failed to create admin')
    } finally {
      setCreatingAdmin(false)
    }
  }

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
        // store admin email for header/profile display
        setAdminEmail(email || '')
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
                <div className="h-12 w-12 rounded-full overflow-hidden flex items-center justify-center bg-[linear-gradient(135deg,rgba(0,255,180,0.08),rgba(0,180,255,0.08))] border border-[rgba(0,255,180,0.2)] shadow-[0_0_15px_rgba(0,255,180,0.25),0_0_30px_rgba(0,255,180,0.15)]">
                <img src="/logo.png" alt="Apex Multiplier" className="w-4/5 h-4/5 object-contain" />
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
              <div className="relative overflow-visible rounded-[20px] border border-[rgba(0,255,174,0.08)] bg-white/5 px-3 py-2 lg:px-6 lg:py-3 backdrop-blur-3xl shadow-[0_0_40px_rgba(0,255,174,0.06)] flex items-center justify-between flex-nowrap">
                <div className="flex items-center gap-2 lg:gap-4">
                  <button aria-label="menu" onClick={() => setOpen(!open)} className="p-2 rounded-md bg-white/3 hover:bg-white/6 lg:p-2">
                    <Menu className="w-5 h-5 text-white" />
                  </button>
                  <div className="h-12 w-12 rounded-full overflow-hidden flex items-center justify-center bg-[linear-gradient(135deg,rgba(0,255,180,0.08),rgba(0,180,255,0.08))] border border-[rgba(0,255,180,0.2)] shadow-[0_0_15px_rgba(0,255,180,0.25),0_0_30px_rgba(0,255,180,0.15)]">
                    <img src="/logo.png" alt="Apex Multiplier" className="w-4/5 h-4/5 object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-400 whitespace-nowrap">Admin Panel</p>
                    <p className="font-black text-lg whitespace-nowrap">Overview</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 lg:gap-3">
                  <button className="p-2 rounded-md bg-white/3 hover:bg-white/6 shrink-0"><Bell className="w-5 h-5 text-[#00ffae]" /></button>

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
                  }} className="p-2 rounded-md bg-white/3 hover:bg-white/6 flex items-center gap-2 shrink-0">
                    <LogOut className="w-5 h-5 text-white" />
                    <span className="sr-only">Logout</span>
                  </button>

                  <div className="relative inline-flex items-center gap-2 rounded-2xl bg-white/6 px-2 py-1 lg:px-3 lg:py-1 shrink-0">
                    <button aria-expanded={profileOpen} onClick={() => { console.log('Admin icon clicked'); setProfileOpen((s) => !s) }} className="flex items-center gap-2 focus:outline-none" type="button">
                      <div className="h-6 w-6 lg:h-8 lg:w-8 rounded-full bg-[#03121c] grid place-items-center text-sm">{(adminEmail && adminEmail[0]) ? adminEmail[0].toUpperCase() : 'A'}</div>
                      <div className="text-sm leading-none">
                        <div className="font-semibold">Admin</div>
                        <div className="text-zinc-400 text-xs hidden lg:block">{adminEmail === null ? 'Loading...' : (adminEmail || '—')}</div>
                      </div>
                    </button>

                    {/* Profile dropdown */}
                    {profileOpen && (
                      <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-xs lg:w-80 bg-white/5 border border-white/6 rounded-xl p-4 shadow-lg z-50">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-[#03121c] grid place-items-center text-lg">{(adminEmail && adminEmail[0]) ? adminEmail[0].toUpperCase() : 'A'}</div>
                          <div className="min-w-0">
                            <div className="font-bold">Admin</div>
                            <div className="text-zinc-400 text-sm truncate">{adminEmail || '—'}</div>
                            <div className="text-zinc-400 text-xs mt-1">Role: Administrator</div>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <button onClick={() => { setCreateAdminOpen(true); setProfileOpen(false) }} className="w-full rounded-2xl bg-emerald-500 py-2 font-semibold text-black hover:bg-emerald-400">Create Admin</button>
                          <button onClick={async () => {
                            setLogoutLoading(true)
                            try {
                              await supabase.auth.signOut()
                              setToastMessage('Successfully logged out')
                              setTimeout(() => setToastMessage(''), 3000)
                              router.push('/admin/login')
                            } catch (e) {
                              // ignore
                            } finally {
                              setLogoutLoading(false)
                            }
                          }} className="w-full rounded-2xl bg-white/6 py-2 font-semibold hover:bg-white/8">{logoutLoading ? 'Logging out...' : 'Logout'}</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Create Admin Modal */}
          {createAdminOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div onClick={() => setCreateAdminOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <div className="relative z-10 w-full max-w-md mx-4">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
                  <h2 className="text-2xl font-bold">Create Admin</h2>
                  <p className="text-zinc-400 text-sm mt-1">Create a new administrator account.</p>

                  <div className="mt-4 space-y-3">
                    <input type="email" placeholder="Admin email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-2 outline-none text-white placeholder-zinc-500" />
                    <input type="email" placeholder="Confirm email" value={newConfirmEmail} onChange={(e) => setNewConfirmEmail(e.target.value)} className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-2 outline-none text-white placeholder-zinc-500" />
                    <input type="password" placeholder="Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-2 outline-none text-white placeholder-zinc-500" />
                    <input type="password" placeholder="Confirm password" value={newConfirmPassword} onChange={(e) => setNewConfirmPassword(e.target.value)} className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-2 outline-none text-white placeholder-zinc-500" />

                    <div className="flex gap-2">
                      <button onClick={handleCreateAdmin} disabled={creatingAdmin} className="flex-1 rounded-2xl bg-emerald-500 py-2 font-semibold text-black hover:bg-emerald-400">{creatingAdmin ? 'Creating...' : 'Create Admin'}</button>
                      <button onClick={() => setCreateAdminOpen(false)} className="rounded-2xl bg-white/6 py-2 px-4 font-semibold hover:bg-white/8">Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
