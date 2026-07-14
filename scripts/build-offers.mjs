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
  try { r = await analyze(join(PDF_DIR, f)) } catch (e) { console.log(`erro ${f}: ${e.message}`); continue }
  const { country, region, file, hash } = r.meta

  // ESTADIA — áreas com preço e hotéis (alta confiança estrutural)
  for (const a of r.areas) {
    if (!a.hotels || !a.priceFrom || a.name.startsWith("(")) continue
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
      source: { file, hash },
    })
  }
  // CIRCUITOS — só alta confiança e com preço
  for (const p of r.programs) {
    if (p.type !== "circuito" || p.conf !== "alta") continue
    const price = null // preço do circuito fica para o passo LLM (título/itinerário)
    push({
      slug: slugify(`${country}-${p.area}-circuito-${p.page}`),
      type: "circuito",
      destino: p.area || country,
      country, region,
      nights: p.feat.nights || null,
      priceFrom: null,
      source: { file, hash, page: p.page },
    })
  }
}

offers.sort((a, b) => (a.region + a.destino).localeCompare(b.region + b.destino))
writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), count: offers.length, offers }, null, 2))
console.log(`✅ ${offers.length} ofertas de ${pdfs.length} brochuras → ${OUT}`)
console.log(`   estadia: ${offers.filter((o) => o.type === "estadia").length} · circuito: ${offers.filter((o) => o.type === "circuito").length}`)
