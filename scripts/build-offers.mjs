#!/usr/bin/env node
/**
 * Constrói os dados do site a partir das brochuras em partner-pdfs/.
 * Extrai apenas BLOCOS DE ALTA CONFIANÇA (áreas de estadia com preço+hotéis;
 * circuitos com preço) e escreve src/data/solferias-offers.json.
 * Uso: npm run build:offers
 */
import { readdirSync, writeFileSync } from "node:fs"
import { resolve, join } from "node:path"
import { analyze, regionOf } from "./lib/solferias.mjs"
import { extractProgram } from "./lib/verbatim.mjs"

const PDF_DIR = resolve("partner-pdfs")
const OUT = resolve("src/data/solferias-offers.json")

const slugify = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60)

const pdfs = readdirSync(PDF_DIR).filter((f) => f.toLowerCase().endsWith(".pdf"))
const offers = []
const seen = new Set()
const push = (o) => { if (o.slug && !seen.has(o.slug)) { seen.add(o.slug); offers.push(o) } }

for (const f of pdfs) {
  let r
  const abs = join(PDF_DIR, f)
  try { r = await analyze(abs) } catch (e) { console.log(`erro ${f}: ${e.message}`); continue }
  const { country, region, file, hash, overview } = r.meta
  const verbatim = (page) => extractProgram(abs, page)

  // ESTADIA — áreas com preço e hotéis (alta confiança estrutural)
  for (const a of r.areas) {
    if (!a.hotels || !a.priceFrom || a.name.startsWith("(")) continue
    // dedup da lista de hotéis por nome, mantendo o mais barato
    const byName = new Map()
    for (const h of a.list) {
      const k = h.name.toLowerCase()
      if (!byName.has(k) || (h.price && h.price < (byName.get(k).price ?? Infinity))) byName.set(k, h)
    }
    const hotelsList = [...byName.values()].sort((x, y) => (x.price ?? 9e9) - (y.price ?? 9e9))
    push({
      slug: slugify(`${country}-${a.name}`),
      type: "estadia",
      destino: a.name,
      country, region,
      priceFrom: a.priceFrom,
      priceTo: a.priceTo,
      hotels: a.hotels,
      nights: a.nights || null,
      boards: a.boards,
      details: { overview, hotels: hotelsList, program: verbatim(a.programPage) },
      source: { file, hash, page: a.programPage },
    })
  }
  // CIRCUITOS — só alta confiança
  for (const p of r.programs) {
    if (p.type !== "circuito" || p.conf !== "alta") continue
    push({
      slug: slugify(`${country}-${p.area}-circuito-${p.page}`),
      type: "circuito",
      destino: p.area || country,
      country, region,
      nights: p.feat.nights || null,
      priceFrom: null,
      details: { overview, routes: p.routes || [], program: verbatim(p.page) },
      source: { file, hash, page: p.page },
    })
  }
}

offers.sort((a, b) => (a.region + a.destino).localeCompare(b.region + b.destino))
writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), count: offers.length, offers }, null, 2))
console.log(`✅ ${offers.length} ofertas de ${pdfs.length} brochuras → ${OUT}`)
console.log(`   estadia: ${offers.filter((o) => o.type === "estadia").length} · circuito: ${offers.filter((o) => o.type === "circuito").length}`)
