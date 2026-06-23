// Central source of truth for investment plans
export const CANONICAL_PLANS = [
  { title: "Starter", price: "$500", amount: "500", roi: 8, roiLabel: "8% Monthly", duration: "30 Days", durationDays: 30, featured: false, vip: false },
  { title: "Silver", price: "$1,000", amount: "1000", roi: 9, roiLabel: "9% Monthly", duration: "30 Days", durationDays: 30, featured: true, vip: false },
  { title: "Premium", price: "$2,500", amount: "2500", roi: 10, roiLabel: "10% Monthly", duration: "30 Days", durationDays: 30, featured: false, vip: true },
  { title: "Gold", price: "$5,000", amount: "5000", roi: 12, roiLabel: "12% Monthly", duration: "30 Days", durationDays: 30, featured: false, vip: false },
  { title: "Elite Infinity", price: "$10,000", amount: "10000", roi: 14, roiLabel: "14% Monthly", duration: "30 Days", durationDays: 30, featured: true, vip: true },
]

export function getPlanByTitle(title: string) {
  return CANONICAL_PLANS.find((p) => p.title === title)
}

export function getPlanConfigFromNameOrAmount(name: string | undefined, amount: number) {
  const byName = name ? CANONICAL_PLANS.find((p) => p.title.toLowerCase() === name.toLowerCase()) : null
  if (byName) return { roi: byName.roi, duration: byName.durationDays }

  if (amount >= 10000) return { roi: 14, duration: 30 }
  if (amount >= 5000) return { roi: 12, duration: 30 }
  if (amount >= 2500) return { roi: 10, duration: 30 }
  if (amount >= 1000) return { roi: 9, duration: 30 }
  return { roi: 8, duration: 30 }
}

export default CANONICAL_PLANS
