"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../../lib/supabase"

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState({
    company_name: "",
    support_email: "",
    website_name: "",
    enable_registrations: true,
    enable_deposits: true,
    enable_withdrawals: true,
    session_timeout_minutes: 60,
    maintenance_mode: false,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const { data: existing } = await supabase.from('admin_settings').select('*').eq('id', 'global').maybeSingle()
      if (existing) {
        setData({
          company_name: existing.company_name || "",
          support_email: existing.support_email || "",
          website_name: existing.website_name || "",
          enable_registrations: existing.enable_registrations ?? true,
          enable_deposits: existing.enable_deposits ?? true,
          enable_withdrawals: existing.enable_withdrawals ?? true,
          session_timeout_minutes: existing.session_timeout_minutes || 60,
          maintenance_mode: existing.maintenance_mode ?? false,
        })
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await supabase.from('admin_settings').upsert([{
        id: 'global',
        company_name: data.company_name,
        support_email: data.support_email,
        website_name: data.website_name,
        enable_registrations: data.enable_registrations,
        enable_deposits: data.enable_deposits,
        enable_withdrawals: data.enable_withdrawals,
        session_timeout_minutes: data.session_timeout_minutes,
        maintenance_mode: data.maintenance_mode,
      }])
      alert('Settings saved')
    } catch (e) {
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black">Settings</h1>
          <p className="text-zinc-400 mt-1">Company and platform configuration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold mb-3">Company Information</h2>
          <div className="space-y-3">
            <input value={data.company_name} onChange={(e) => setData({ ...data, company_name: e.target.value })} placeholder="Company Name" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 outline-none text-white" />
            <input value={data.support_email} onChange={(e) => setData({ ...data, support_email: e.target.value })} placeholder="Support Email" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 outline-none text-white" />
            <input value={data.website_name} onChange={(e) => setData({ ...data, website_name: e.target.value })} placeholder="Website Name" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 outline-none text-white" />
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold mb-3">Platform Settings</h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span>Enable Registrations</span>
              <input type="checkbox" checked={data.enable_registrations} onChange={(e) => setData({ ...data, enable_registrations: e.target.checked })} />
            </label>
            <label className="flex items-center justify-between">
              <span>Enable Deposits</span>
              <input type="checkbox" checked={data.enable_deposits} onChange={(e) => setData({ ...data, enable_deposits: e.target.checked })} />
            </label>
            <label className="flex items-center justify-between">
              <span>Enable Withdrawals</span>
              <input type="checkbox" checked={data.enable_withdrawals} onChange={(e) => setData({ ...data, enable_withdrawals: e.target.checked })} />
            </label>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold mb-3">Security Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-zinc-400">Session Timeout (minutes)</label>
              <input type="number" value={data.session_timeout_minutes} onChange={(e) => setData({ ...data, session_timeout_minutes: Number(e.target.value) })} className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 outline-none text-white mt-2" />
            </div>
            <div>
              <label className="text-zinc-400">Maintenance Mode</label>
              <div className="mt-2">
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={data.maintenance_mode} onChange={(e) => setData({ ...data, maintenance_mode: e.target.checked })} />
                  <span className="text-sm">Enable maintenance mode</span>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button disabled={saving} onClick={handleSave} className="rounded-2xl bg-emerald-500 px-6 py-3 font-bold text-black hover:bg-emerald-400 transition disabled:opacity-50">{saving ? 'Saving...' : 'Save Settings'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
