#!/usr/bin/env node
/**
 * Recolhe as brochuras (PDF) do site do parceiro Solférias (app SIGAV).
 * Percorre cada país em "Destinos e Programas", abre a 1.ª promoção e
 * descarrega o PDF do elemento "BROCHURA". Descarrega INLINE (à medida
 * que encontra) e é resumível — salta ficheiros já existentes.
 *
 * Requer Playwright:  npm i -D playwright && npx playwright install chromium
 * Uso:  npm run fetch:brochures        (grava em ./partner-pdfs)
 *       OUT=/caminho node scripts/fetch-brochures.mjs
 */
import { chromium } from "playwright"
import { writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs"
import { resolve } from "node:path"

const OUT = process.env.OUT || resolve("partner-pdfs")
const BASE = "https://www.solferias.pt"
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })
const existing = new Set(readdirSync(OUT))

const browser = await chromium.launch()
const page = await browser.newPage({ userAgent: "Mozilla/5.0" })
const settle = async (sel) => {
  await page.waitForTimeout(1200)
  if (sel) await page.waitForSelector(sel, { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(600)
}

// 1) países (subzonas) do mega-menu
await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 })
await settle('a[href*="zona/subzona"]')
const countries = await page.evaluate(() => {
  const seen = new Set(), out = []
  for (const a of document.querySelectorAll('a[href*="zona/subzona"]')) {
    const name = a.textContent.trim().replace(/\s+/g, " ")
    if (name && !seen.has(a.href)) { seen.add(a.href); out.push({ name, url: a.href }) }
  }
  return out
})
console.log(`Países: ${countries.length}\n`)

const firstPromo = () =>
  page.evaluate(() => {
    const inMenu = (el) => !!el.closest('[class*="destinos" i],nav,header,#menu,.menu,.navbar')
    for (const a of document.querySelectorAll('a[href*="pacote/reserva"]')) if (!inMenu(a)) return a.href
    return null
  })
const brochura = () =>
  page.evaluate(() => {
    const a = [...document.querySelectorAll("a")].find(
      (x) => x.textContent.trim().toLowerCase() === "brochura" && /\.pdf/i.test(x.href)
    )
    return a ? a.href : null
  })

let withPdf = 0, novos = 0
for (const c of countries) {
  try {
    await page.goto(c.url, { waitUntil: "domcontentloaded", timeout: 60000 })
    await settle('a[href*="pacote/reserva"]')
    const promo = await firstPromo()
    if (!promo) { console.log(`·  ${c.name.padEnd(24)} sem promoções`); continue }
    await page.goto(promo, { waitUntil: "domcontentloaded", timeout: 60000 })
    await settle("a")
    const pdf = await brochura()
    if (!pdf) { console.log(`·  ${c.name.padEnd(24)} sem brochura`); continue }
    withPdf++
    const fn = pdf.split("/").pop()
    if (existing.has(fn)) { console.log(`📄 ${c.name.padEnd(24)} ${fn} (já existe)`); continue }
    const resp = await page.request.get(pdf)
    writeFileSync(`${OUT}/${fn}`, await resp.body())
    existing.add(fn); novos++
    console.log(`✅ ${c.name.padEnd(24)} ${fn} (NOVO)`)
  } catch (e) {
    console.log(`·  ${c.name.padEnd(24)} erro: ${e.message.slice(0, 50)}`)
  }
}

await browser.close()
console.log(`\n===== FIM =====  países:${countries.length} · com brochura:${withPdf} · novos:${novos}`)
