"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "./supabase"

type Plan = {
  id: string
  title: string
  price: string
  amount: string
  roi: string
  duration: string
  featured?: boolean
  vip?: boolean
  raw?: any
}

type PlansContextType = {
  plans: Plan[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

const PlansContext = createContext<PlansContextType>({ plans: [], loading: true, error: null, reload: async () => {} })

function mapRowToPlan(p: any): Plan {
  const title = p.plan_name || p.name || p.title || 'Unnamed Plan'
  // Determine canonical amount to display: prefer min_amount, then max_amount, then fallbacks.
  let amountVal: number | string = 0
  if (typeof p.min_amount !== 'undefined' && p.min_amount !== null) {
    // If min and max are equal, show that amount; otherwise show min_amount as representative
    if (typeof p.max_amount !== 'undefined' && p.max_amount !== null && Number(p.min_amount) === Number(p.max_amount)) {
      amountVal = Number(p.min_amount)
    } else {
      amountVal = Number(p.min_amount)
    }
  } else if (typeof p.max_amount !== 'undefined' && p.max_amount !== null) {
    amountVal = Number(p.max_amount)
  } else {
    amountVal = p.amount ?? p.price ?? p.cost ?? 0
  }

  const price = typeof amountVal === 'number' ? `$${Number(amountVal).toLocaleString()}` : String(amountVal)
  const roiVal = p.roi_percentage ?? p.roi_percent ?? p.roi ?? p.monthly_profit ?? null
  const durationVal = p.duration_days ?? p.duration ?? null
  const featuresVal = p.features ?? p.tags ?? ''
  return {
    id: p.id,
    title,
    price,
    amount: String(amountVal || ''),
    roi: roiVal ? `${roiVal}% Monthly` : '',
    duration: durationVal ? `${durationVal} Days` : '',
    featured: String(featuresVal).toLowerCase().includes('featured'),
    vip: String(featuresVal).toLowerCase().includes('vip'),
    raw: p,
  }
}

export function PlansProvider({ children }: { children: React.ReactNode }) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('investment_plans')
        .select(`*`)
        .order('display_order', { ascending: true })

      console.log('Plans Data:', data)
      console.log('Plans Error:', err)

      if (err) {
        console.error('Failed loading plans:', err)
        setError(err.message || String(err))
        setPlans([])
        return
      }

      const active = (data || []).filter((r: any) => (r.status ? r.status === 'active' : true))
      const mapped = active.map(mapRowToPlan)
      setPlans(mapped)
      setError(null)
    } catch (e: any) {
      console.error('Unexpected error loading plans:', e)
      setError(e?.message || String(e))
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()

    // Realtime subscription to reflect admin changes instantly
    const channel = supabase.channel('public:investment_plans').on('postgres_changes', { event: '*', schema: 'public', table: 'investment_plans' }, () => {
      load()
    }).subscribe()

    return () => {
      try { supabase.removeChannel(channel) } catch (e) {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <PlansContext.Provider value={{ plans, loading, error, reload: load }}>{children}</PlansContext.Provider>
  )
}

export function usePlans() {
  return useContext(PlansContext)
}

export default PlansProvider
