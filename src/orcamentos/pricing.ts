// GPTur Orçamentos — pricing & tax (see BLUEPRINT.md §4).
// No margin, no cost anywhere. net = ex-tax (canonical), pvp = inc-tax = net × (1+rate).
// Line values shown are TOTALS (per-unit × mult). Base = non-extra services +
// cheapest valid branch of each alternative. Extras (optional) summed separately.
// Rounding: tax computed ONCE on the ex-tax total, so the headline is exactly consistent.

import type { Quote, Service, Alternative, Item, Branch, Unit } from "./model"

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

// derive inc-tax from ex-tax and back (linked net ⇄ pvp inputs)
export const netToPvp = (net: number, rate: number) => round2(net * (1 + rate))
export const pvpToNet = (pvp: number, rate: number) => round2(pvp / (1 + rate))

// how a per-unit price multiplies (only por_pessoa scales with pax)
export const lineMult = (unit: Unit, qty: number, pax: number) =>
  (unit === "por_pessoa" ? Math.max(1, pax) : 1) * (qty || 1)

// A line is "real" if it has a title OR a price (BLUEPRINT §4.2) — a price-only
// line still counts, so its money never silently vanishes from the totals.
export const isRealService = (s: Service) =>
  (s.title?.trim().length ?? 0) > 0 || s.net > 0 || s.pvp > 0

export interface LineValue {
  net: number
  pvp: number
}
const zero = (): LineValue => ({ net: 0, pvp: 0 })
const add = (a: LineValue, b: LineValue): LineValue => ({ net: a.net + b.net, pvp: a.pvp + b.pvp })

// line TOTAL (per-unit × mult), both ex-tax and inc-tax
export const lineValue = (s: Service, pax: number): LineValue => {
  const m = lineMult(s.unit, s.qty, pax)
  return { net: s.net * m, pvp: s.pvp * m }
}

// sum of a branch's NON-EXTRA real services (drives cheapest-branch selection & base)
export const branchBase = (b: Branch, pax: number): LineValue =>
  b.services.filter((s) => isRealService(s) && !s.optional).reduce((acc, s) => add(acc, lineValue(s, pax)), zero())

// a branch competes only if it has ≥1 real line (empties must not win "cheapest")
export const branchIsValid = (b: Branch) => b.services.some(isRealService)

// cheapest valid branch of an alternative (by net; single rate ⇒ same order as pvp)
export const cheapestBranch = (alt: Alternative, pax: number): Branch | null => {
  const valid = alt.branches.filter(branchIsValid)
  if (!valid.length) return null
  return valid.reduce((best, b) => (branchBase(b, pax).net < branchBase(best, pax).net ? b : best))
}

const allItems = (q: Quote): Item[] => [...q.general, ...q.itinerary.flatMap((st) => st.items)]

// every optional service anywhere (top-level or inside any branch) → extras
const optionalServices = (q: Quote): Service[] => {
  const out: Service[] = []
  for (const it of allItems(q)) {
    if (it.kind === "service") {
      if (it.optional && isRealService(it)) out.push(it)
    } else {
      for (const b of it.branches) for (const s of b.services) if (s.optional && isRealService(s)) out.push(s)
    }
  }
  return out
}

export interface QuoteTotals {
  baseNet: number
  basePvp: number // = round2(baseNet × (1+rate)) — tax once on the total
  extrasNet: number
  extrasPvp: number
  perPaxPvp: number // basePvp / pax
  perPaxNet: number
  rate: number
  pax: number
  taxed: boolean // "detalhado" ⇒ show sem/com IVA; "simples" ⇒ a single price, no tax
}

// The one function the whole document/editor reads.
export function quoteTotals(q: Quote): QuoteTotals {
  const pax = Math.max(1, q.pax || 1)
  const taxed = q.pricing === "detalhado"
  const rate = taxed ? q.taxRate ?? 0.23 : 0

  let baseNet = 0
  if (q.pricing === "simples") {
    // um só preço final para toda a viagem
    baseNet = q.finalPrice || 0
  } else {
    for (const it of allItems(q)) {
      if (it.kind === "service") {
        if (isRealService(it) && !it.optional) baseNet += lineValue(it, pax).net
      } else {
        const b = cheapestBranch(it, pax)
        if (b) baseNet += branchBase(b, pax).net
      }
    }
  }

  // extras (opcionais) somam à parte em ambos os modos
  const extrasNet = optionalServices(q).reduce((acc, s) => acc + lineValue(s, pax).net, 0)

  baseNet = round2(baseNet)
  const basePvp = netToPvp(baseNet, rate)
  return {
    baseNet,
    basePvp,
    extrasNet: round2(extrasNet),
    extrasPvp: netToPvp(round2(extrasNet), rate),
    perPaxPvp: round2(basePvp / pax),
    perPaxNet: round2(baseNet / pax),
    rate,
    pax,
    taxed,
  }
}

// --- money formatting (pt-PT, EUR); missing reads as "—", never "0,00 €" ---
const eur = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" })
export const money = (n: number | null | undefined) =>
  n === null || n === undefined || Number.isNaN(n) ? "—" : eur.format(n)
