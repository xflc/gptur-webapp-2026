#!/usr/bin/env node
/**
 * Extrai a foto "hero" de cada destino DIRETAMENTE das brochuras Solférias
 * (partner-pdfs/*.pdf) com pdfimages (poppler): escolhe a maior imagem
 * horizontal nas páginas da oferta (divisória + programa), comprime com
 * sharp e grava em public/destinos/<slug>.jpg. Créditos → Solférias.
 *
 * Uso: npm run extract:images            (todas)
 *      node scripts/extract-images.mjs egito   (só slugs que contêm "egito")
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync, copyFileSync } from "node:fs"
import { resolve, join } from "node:path"
import { execFileSync } from "node:child_process"
import sharp from "sharp"

const OUT = resolve("public/destinos")
const PDF_DIR = resolve("partner-pdfs")
const TMP = resolve("partner-pdfs/.imgtmp")
mkdirSync(OUT, { recursive: true })
const filter = process.argv[2] || ""
const offers = JSON.parse(readFileSync(resolve("src/data/solferias-offers.json"), "utf8")).offers
const creditsPath = join(OUT, "credits.json")
const credits = existsSync(creditsPath) ? JSON.parse(readFileSync(creditsPath, "utf8")) : {}

async function bestImageInRange(pdf, page) {
  const lo = Math.max(1, page - 1), hi = page
  rmSync(TMP, { recursive: true, force: true }); mkdirSync(TMP, { recursive: true })
  try {
    execFileSync("pdfimages", ["-j", "-p", "-f", String(lo), "-l", String(hi), pdf, join(TMP, "i")], { stdio: "ignore" })
  } catch { return null }
  let best = null
  for (const f of readdirSync(TMP)) {
    if (!/\.(jpe?g|png)$/i.test(f)) continue
    const p = join(TMP, f)
    try {
      const m = await sharp(p).metadata()
      if (!m.width || !m.height) continue
      if (m.width < 1000 || m.width < m.height * 1.2) continue // grande + horizontal
      const area = m.width * m.height
      if (!best || area > best.area) best = { path: p, area }
    } catch {}
  }
  return best
}

let ok = 0, miss = 0
for (const o of offers) {
  if (filter && !o.slug.includes(filter)) continue
  if (!o.source?.file || !o.source?.page) { miss++; continue }
  const pdf = join(PDF_DIR, o.source.file)
  if (!existsSync(pdf)) { miss++; continue }
  const best = await bestImageInRange(pdf, o.source.page)
  if (!best) { console.log(`·   ${o.destino.slice(0, 20).padEnd(20)} sem foto grande (mantém atual)`); miss++; continue }
  const out = await sharp(best.path).rotate().resize({ width: 1400, height: 1000, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer()
  writeFileSync(join(OUT, `${o.slug}.jpg`), out)
  credits[o.slug] = { by: "Solférias", license: "© Solférias (brochura)", source: o.source.file }
  ok++
  console.log(`🖼️  ${o.destino.slice(0, 20).padEnd(20)} ${o.source.file} p${o.source.page}`)
}
rmSync(TMP, { recursive: true, force: true })

// Reutilização por destino: ofertas sem foto do PDF herdam a de outra
// oferta com o MESMO destino que tenha foto da brochura (ex.: Cairo).
const isSolferias = (slug) => /Solférias/i.test(credits[slug]?.license || "")
const heroByDestino = {}
for (const o of offers) if (isSolferias(o.slug)) heroByDestino[o.destino] ??= o.slug
let reused = 0
for (const o of offers) {
  if (filter && !o.slug.includes(filter)) continue
  if (isSolferias(o.slug)) continue // já tem a sua própria
  const srcSlug = heroByDestino[o.destino]
  if (!srcSlug) continue
  copyFileSync(join(OUT, `${srcSlug}.jpg`), join(OUT, `${o.slug}.jpg`))
  credits[o.slug] = { by: "Solférias", license: "© Solférias (brochura)", source: credits[srcSlug]?.source, reusedFrom: srcSlug }
  reused++
  console.log(`↻   ${o.destino.slice(0, 20).padEnd(20)} reutiliza ${srcSlug}`)
}
writeFileSync(creditsPath, JSON.stringify(credits, null, 2))
console.log(`\nFIM · extraídas:${ok} · reutilizadas:${reused} · ainda sem foto do PDF:${miss - reused}`)
