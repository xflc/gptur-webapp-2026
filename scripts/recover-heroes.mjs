#!/usr/bin/env node
/**
 * Recuperação DIRIGIDA de heroes do PDF para as ofertas que ficaram no
 * fallback Wikimedia Commons. Não toca nas que já têm foto Solférias.
 * Estratégia por oferta (só se ainda em Commons):
 *   1) janela alargada [page-3 … page+1] — apanha divisórias de país
 *   2) se page:null, procura a página-secção pelo nome do destino no texto
 *   3) fallback de capa: maior hero das páginas 2–4 da brochura
 * Exige imagem horizontal ≥1400px (exclui fotos de hotel).
 * Grava CANDIDATOS em public/destinos/.review/<slug>.jpg para auditoria
 * visual — NÃO substitui os ficheiros finais nem os créditos.
 *
 * Uso: node scripts/recover-heroes.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs"
import { resolve, join } from "node:path"
import { execFileSync } from "node:child_process"
import sharp from "sharp"

const OUT = resolve("public/destinos")
const REVIEW = join(OUT, ".review")
const PDF_DIR = resolve("partner-pdfs")
const TMP = resolve("partner-pdfs/.rectmp")
rmSync(REVIEW, { recursive: true, force: true }); mkdirSync(REVIEW, { recursive: true })
const offers = JSON.parse(readFileSync(resolve("src/data/solferias-offers.json"), "utf8")).offers
const credits = JSON.parse(readFileSync(join(OUT, "credits.json"), "utf8"))
const isSolferias = (slug) => /Solférias/i.test(credits[slug]?.license || "")

function pageCount(pdf) {
  try {
    const out = execFileSync("pdfinfo", [pdf], { encoding: "utf8" })
    return parseInt(out.match(/Pages:\s+(\d+)/)?.[1] || "0", 10)
  } catch { return 0 }
}

// maior imagem horizontal ≥1400px no intervalo [lo, hi]
async function bestInRange(pdf, lo, hi) {
  lo = Math.max(1, lo)
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
      if (m.width < 1400 || m.width < m.height * 1.2) continue
      const area = m.width * m.height
      if (!best || area > best.area) best = { path: p, area, w: m.width, h: m.height }
    } catch {}
  }
  return best
}

// procura a 1ª página cujo texto contém o nome do destino (secção)
function findSectionPage(pdf, destino, total) {
  const needle = destino.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase()
  for (let p = 1; p <= total; p++) {
    try {
      const t = execFileSync("pdftotext", ["-f", String(p), "-l", String(p), pdf, "-"], { encoding: "utf8" })
      const norm = t.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase()
      if (norm.includes(needle)) return p
    } catch {}
  }
  return null
}

const targets = offers.filter((o) => !isSolferias(o.slug) && o.source?.file)
console.log(`Alvos (em Commons): ${targets.length}\n`)
const found = []
for (const o of targets) {
  const pdf = join(PDF_DIR, o.source.file)
  if (!existsSync(pdf)) continue
  const total = pageCount(pdf)
  let page = o.source.page
  let via = ""
  let best = null

  if (page) { best = await bestInRange(pdf, page - 3, page + 1); if (best) via = `janela p${page}±` }
  if (!best) {
    const sec = findSectionPage(pdf, o.destino, total)
    if (sec) { best = await bestInRange(pdf, sec, sec + 1); if (best) via = `secção p${sec}` }
  }
  if (!best) { best = await bestInRange(pdf, 2, Math.min(4, total)); if (best) via = "capa p2–4" }

  if (!best) { console.log(`✗  ${o.slug.padEnd(38)} sem hero ≥1400 no PDF`); continue }
  await sharp(best.path).rotate().resize({ width: 1400, height: 1000, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(join(REVIEW, `${o.slug}.jpg`))
  found.push({ slug: o.slug, via, dims: `${best.w}x${best.h}`, file: o.source.file })
  console.log(`🖼️  ${o.slug.padEnd(38)} ${via.padEnd(14)} ${best.w}x${best.h}  ${o.source.file}`)
}
rmSync(TMP, { recursive: true, force: true })
writeFileSync(join(REVIEW, "_found.json"), JSON.stringify(found, null, 2))
console.log(`\nCandidatos gravados em .review/: ${found.length}  (auditar antes de adotar)`)
