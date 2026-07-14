#!/usr/bin/env node
/**
 * Relatório de segmentação/classificação de um PDF de catálogo Solférias.
 * Lógica em scripts/lib/solferias.mjs (partilhada com build-offers.mjs).
 * Uso: node scripts/analyze-pdf.mjs "partner-pdfs/brasil.pdf"
 */
import { resolve } from "node:path"
import { analyze } from "./lib/solferias.mjs"

const pdfPath = process.argv[2]
if (!pdfPath) { console.error('Uso: node scripts/analyze-pdf.mjs "<ficheiro.pdf>"'); process.exit(1) }

const r = await analyze(resolve(pdfPath))
const k = r.kinds
const line = "─".repeat(70)
console.log(`\n${line}\n📄  ${r.meta.file}\n${line}`)
console.log(`sha1: ${r.meta.hash} · operador: ${r.meta.operator} · RNAVT: ${r.meta.rnavt} · país: ${r.meta.country || "?"} (${r.meta.region})`)
console.log(`páginas: ${r.meta.pages} · excluídas → capa:${k.capa || 0} legal:${k.legal || 0} rodapé:${k.rodapé || 0} imagem:${k.imagem || 0}`)

console.log(`\n🧩  PROGRAMAS (tipo · confiança · features):`)
const icon = { estadia: "🏨", circuito: "🧭", extensao: "➕", "indef.": "❓" }
for (const p of r.programs) {
  const f = p.feat
  const feats = `${f.nights}N dias:${f.days}${f.span ? ` intervalo:${f.span}` : ""} hotéis:${f.rows} preços:${f.prices} voos:${f.flights ? "s" : "n"} rota:${f.rota}`
  console.log(`   ${icon[p.type] || "•"} [pág ${String(p.page).padStart(2)}] ${(p.area || "?").slice(0, 18).padEnd(18)} ${p.type.padEnd(8)} ${(p.boosted ? "ctx" : p.conf).padEnd(6)} (${feats})`)
}
const tally = r.programs.reduce((m, p) => ((m[p.type] = (m[p.type] || 0) + 1), m), {})
console.log(`\n   Totais: ${Object.entries(tally).map(([k2, v]) => `${k2} ${v}`).join(" · ") || "—"}`)

const stay = r.areas.filter((a) => a.hotels > 0)
console.log(`\n🏨  TABELAS DE HOTÉIS: ${stay.length} áreas · ${stay.reduce((s, a) => s + a.hotels, 0)} hotéis`)
for (const a of stay) console.log(`   • ${a.name.slice(0, 20).padEnd(20)} ${String(a.hotels).padStart(3)} hotéis  ${a.priceFrom ? a.priceFrom + "–" + a.priceTo + "€" : "s/ preços"}  ${a.boards.join("/")}`)
if (r.excursoes) console.log(`\n🚌  Excursões: ${r.excursoes}`)
if (r.rentacar) console.log(`🚗  Rent-a-car: ${r.rentacar} pág.`)
console.log("")
