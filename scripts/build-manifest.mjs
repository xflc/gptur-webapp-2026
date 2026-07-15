#!/usr/bin/env node
/**
 * Constrói partner-pdfs/manifest.json = { "000XXXXX.pdf": { region, countries[] } }
 * juntando:
 *   - o menu do solferias.pt (país → região, via zona/view + zona/subzona)
 *   - o log do fetch-brochures (país → ficheiro)
 * Assim a região/país de cada brochura vem da fonte autoritativa (o site),
 * não do parsing frágil do índice do PDF.
 *
 * Uso: node scripts/build-manifest.mjs <log-do-fetch-brochures>
 */
import { chromium } from "playwright"
import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const logPath = process.argv[2]
if (!logPath) { console.error("Uso: node scripts/build-manifest.mjs <log>"); process.exit(1) }

// zona do site → região do nosso catálogo
const REGION = {
  "Américas": "América", "Brasil": "América",
  "Açores": "Portugal", "Madeira": "Portugal", "Portugal": "Portugal",
  "África": "África", "Cabo Verde": "África",
  "Ásia": "Ásia", "Médio Oriente": "Médio Oriente", "Oceânia": "Oceânia",
  "Europa": "Europa", "Espanha": "Europa", "Ilhas Baleares": "Europa", "Ilhas Canárias": "Europa",
  "Ilhas Idílicas": "Ilhas Idílicas",
  "Disneyland® Paris": "Parques Temáticos", "Futuroscope": "Parques Temáticos",
  "Isla Mágica®": "Parques Temáticos", "Parc Asterix": "Parques Temáticos",
  "Parque Warner™": "Parques Temáticos", "PortAventura®": "Parques Temáticos",
}
const mapRegion = (z) => REGION[z] || z || "Outros"

const browser = await chromium.launch()
const page = await browser.newPage({ userAgent: "Mozilla/5.0" })
await page.goto("https://www.solferias.pt/", { waitUntil: "domcontentloaded", timeout: 60000 })
await page.waitForSelector('a[href*="zona/subzona"]', { timeout: 10000 }).catch(() => {})
await page.waitForTimeout(1500)

const { zonaNames, countries } = await page.evaluate(() => {
  const zonaNames = {}, countries = []
  document.querySelectorAll('a[href*="zona/view"]').forEach((a) => {
    const m = a.href.match(/zona\/view\/(\d+)/)
    if (m) zonaNames[m[1]] = a.textContent.trim().replace(/\s+/g, " ")
  })
  document.querySelectorAll('a[href*="zona/subzona"]').forEach((a) => {
    const m = a.href.match(/zona\/subzona\/(\d+)\/(\d+)/)
    if (m) countries.push({ name: a.textContent.trim().replace(/\s+/g, " "), zona: m[1] })
  })
  return { zonaNames, countries }
})
await browser.close()

const c2r = {}
for (const c of countries) if (!c2r[c.name]) c2r[c.name] = mapRegion(zonaNames[c.zona])

// país → ficheiro (do log)
const log = readFileSync(logPath, "utf8")
const fileRegions = {}, fileCountries = {}
for (const line of log.split("\n")) {
  const m = line.match(/[✅📄]\s+(.+?)\s{2,}(\d{8}\.pdf)/)
  if (!m) continue
  const pais = m[1].trim(), file = m[2], region = c2r[pais] || "Outros"
  ;(fileRegions[file] = fileRegions[file] || {})[region] = (fileRegions[file][region] || 0) + 1
  ;(fileCountries[file] = fileCountries[file] || []).push(pais)
}

const manifest = {}
for (const file of Object.keys(fileRegions)) {
  const region = Object.entries(fileRegions[file]).sort((a, b) => b[1] - a[1])[0][0]
  const list = [...new Set(fileCountries[file])]
  manifest[file] = { region, countries: list, primaryCountry: list.length === 1 ? list[0] : region }
}

const out = resolve("partner-pdfs/manifest.json")
writeFileSync(out, JSON.stringify(manifest, null, 2))
console.log(`✅ manifest com ${Object.keys(manifest).length} brochuras → ${out}`)
for (const [f, m] of Object.entries(manifest)) console.log(`  ${f}  [${m.region}]  ${m.countries.slice(0, 4).join(", ")}${m.countries.length > 4 ? "…" : ""}`)
