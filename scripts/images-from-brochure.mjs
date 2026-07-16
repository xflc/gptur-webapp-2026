#!/usr/bin/env node
/**
 * Extrai a foto de destino de cada oferta a partir da BROCHURA Solférias
 * (imagens embutidas no PDF, via pdfimages/poppler) — a maior imagem
 * horizontal da página da divisória/programa. Comprime com sharp e grava
 * em public/destinos/<slug>.jpg. Fonte: conteúdo do parceiro (Solférias).
 *
 * Requer: poppler (pdftoppm/pdfimages) e os PDFs em partner-pdfs/.
 * Uso: npm run images:brochure
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync, mkdtempSync } from "node:fs"
import { resolve, join } from "node:path"
import { tmpdir } from "node:os"
import { execFileSync } from "node:child_process"
import sharp from "sharp"

const OUT = resolve("public/destinos")
const PDFDIR = resolve("partner-pdfs")
mkdirSync(OUT, { recursive: true })
const offers = JSON.parse(readFileSync(resolve("src/data/solferias-offers.json"), "utf8")).offers
const creditsPath = join(OUT, "credits.json")
const credits = existsSync(creditsPath) ? JSON.parse(readFileSync(creditsPath, "utf8")) : {}

let ok = 0, miss = 0
for (const o of offers) {
  const file = join(PDFDIR, o.source?.file || "")
  const page = o.source?.page
  if (!page || !existsSync(file)) { miss++; console.log(`·   ${o.destino.slice(0, 22).padEnd(22)} (sem página/PDF — mantém atual)`); continue }
  const from = Math.max(1, page - 1) // divisória (hero) + página do programa
  const tmp = mkdtempSync(join(tmpdir(), "sfimg-"))
  try {
    execFileSync("pdfimages", ["-j", "-p", "-f", String(from), "-l", String(page), file, join(tmp, "i")], { stdio: "ignore" })
    // escolhe a maior imagem horizontal
    let best = null, bestArea = 0
    for (const f of readdirSync(tmp)) {
      const p = join(tmp, f)
      try {
        const m = await sharp(p).metadata()
        if (m.width >= 900 && m.width >= m.height * 1.15) {
          const a = m.width * m.height
          if (a > bestArea) { bestArea = a; best = p }
        }
      } catch {}
    }
    if (best) {
      await sharp(best).rotate().resize({ width: 1400, height: 1000, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(join(OUT, `${o.slug}.jpg`))
      credits[o.slug] = { by: "Solférias", license: "© Solférias (parceiro)", source: `brochura ${o.source.file} p.${page}` }
      ok++; console.log(`🖼️  ${o.destino.slice(0, 22).padEnd(22)} ${Math.round(Math.sqrt(bestArea))}px  p.${page}`)
    } else { miss++; console.log(`·   ${o.destino.slice(0, 22).padEnd(22)} (sem foto horizontal — mantém atual)`) }
  } catch (e) { miss++; console.log(`✗   ${o.destino.slice(0, 22).padEnd(22)} ${e.message.slice(0, 40)}`) }
  rmSync(tmp, { recursive: true, force: true })
}
writeFileSync(creditsPath, JSON.stringify(credits, null, 2))
console.log(`\nFIM · Solférias:${ok} · sem foto (mantém atual):${miss}`)
