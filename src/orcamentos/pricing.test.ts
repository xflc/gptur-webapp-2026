// Verifies the pricing engine against BLUEPRINT.md §4.5 worked example.
// Run: node src/orcamentos/pricing.test.ts   (Node ≥23 strips TS types)
import { quoteTotals, lineMult, round2, netToPvp, pvpToNet } from "./pricing.ts"
import type { Quote, Service } from "./model.ts"

let failures = 0
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) failures++
  console.log(`${ok ? "✓" : "✗"} ${name}${ok ? "" : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`)
}

const svc = (o: Partial<Service>): Service => ({
  kind: "service", id: Math.random().toString(36).slice(2), title: "", category: "transporte",
  unit: "por_pessoa", qty: 1, net: 0, pvp: 0, ...o,
})

// --- §4.5 fixture: 3 pax, rate 23% ---
const q: Quote = {
  id: "t", taxRate: 0.23, mode: "itinerary", pax: 3,
  general: [svc({ title: "Voo internacional", unit: "por_pessoa", net: 300, pvp: 369 })],
  itinerary: [
    {
      id: "s1", place: "Sevilha",
      items: [
        {
          kind: "alternative", id: "a1", title: "Passeio",
          branches: [
            { id: "A", label: "Opção A", services: [svc({ title: "Barco", unit: "por_pessoa", net: 20, pvp: 24.6 })] },
            { id: "B", label: "Opção B", services: [svc({ title: "Flamenco", unit: "por_pessoa", net: 35, pvp: 43.05 })] },
          ],
        },
        svc({ title: "Jantar de gala", unit: "por_grupo", net: 200, pvp: 246, optional: true }),
      ],
    },
  ],
  createdAt: 0, updatedAt: 0,
}

const t = quoteTotals(q)
eq("base net = 960", t.baseNet, 960)
eq("base pvp = 1180.80", t.basePvp, 1180.8)
eq("perPax pvp = 393.60", t.perPaxPvp, 393.6)
eq("extras net = 200", t.extrasNet, 200)
eq("extras pvp = 246", t.extrasPvp, 246)

// invariant: base pvp === base net × (1+rate)
eq("tax invariant", t.basePvp, netToPvp(t.baseNet, 0.23))

// unit multipliers
eq("por_pessoa × pax", lineMult("por_pessoa", 1, 3), 3)
eq("por_grupo ignores pax", lineMult("por_grupo", 1, 3), 1)
eq("qty multiplies", lineMult("por_noite", 4, 3), 4)

// linked net ⇄ pvp
eq("net→pvp", netToPvp(100, 0.23), 123)
eq("pvp→net", pvpToNet(123, 0.23), 100)

// empty branch must not win "cheapest"
const q2: Quote = {
  ...q, general: [],
  itinerary: [{ id: "s", place: "X", items: [{
    kind: "alternative", id: "a", branches: [
      { id: "A", services: [svc({ title: "Só esta", net: 50, pvp: 61.5 })] },
      { id: "B", services: [svc({})] }, // empty → invalid, must be skipped
    ],
  }] }],
}
eq("empty branch skipped → base 50×3", quoteTotals(q2).baseNet, 150)

// price-only line (no title) still counts
const q3: Quote = { ...q, itinerary: [], general: [svc({ title: "", unit: "por_grupo", net: 80, pvp: 98.4 })] }
eq("price-only line counts", quoteTotals(q3).baseNet, 80)

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`)
if (failures) process.exit(1)
