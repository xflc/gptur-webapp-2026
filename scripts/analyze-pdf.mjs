#!/usr/bin/env node
/**
 * Passo 1 (v3) — Segmentação + classificação por ASSINATURA ESTRUTURAL (SEM API).
 *
 * Filosofia: não decidir por palavras location-dependent ("cruzeiro", "dias livres"),
 * mas por sinais portáveis:
 *   - cardinalidade de preço (1 preço fixo vs grelha de hotéis)
 *   - intervalo de dias colapsado ("2º AO 7º DIA") → estadia
 *   - diversidade de rota nos cabeçalhos de dia (muda → circuito)
 *   - presença de voos (ausência → extensão/add-on)
 * Cada bloco recebe pontuações; a margem entre o 1.º e o 2.º = CONFIANÇA.
 *
 * Auto-configura por PDF: lê o país do Índice, a legenda de regimes, exclui
 * capa/página legal/rodapé/imagem, e faz hash para dedup.
 *
 * Uso: node scripts/analyze-pdf.mjs "partner-pdfs/brasil.pdf"
 */
import { readFileSync } from "node:fs"
import { basename, resolve } from "node:path"
import { createHash } from "node:crypto"

const pdfPath = process.argv[2]
if (!pdfPath) {
  console.error('Uso: node scripts/analyze-pdf.mjs "<ficheiro.pdf>"')
  process.exit(1)
}

async function extractPages(bytes) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
  const doc = await pdfjs.getDocument({ data: bytes, isEvalSupported: false, useSystemFonts: true }).promise
  const pages = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const text = content.items.map((it) => it.str).join(" ").replace(/\s+/g, " ").trim()
    pages.push({ n: i, text })
  }
  return pages
}

// ---------- regexes (estruturais) ----------
const RE_DUR = /(\d+)\s*Dias\s*(\d+)\s*Noites/i
const RE_INCL = /SERVI[ÇC]OS INCLU[ÍI]DOS/i
const RE_OFFER = /(\d+)\s*NOITES\s*\|\s*([A-Z]{2,3}(?:\s*\+\s*[A-Z]{2,3})*)/gi
const RE_DAY = /(\d{1,2})\s*º\s*DIA/gi
const RE_PRICE_INT = /\b(\d{3,4})\s*€/g
const RE_PRICE_INDIC = /Pre[çc]o\s+[Ii]ndicativo[^€]{0,40}?(\d{3,4})\s*€/i
const RE_EXC_PRICE = /(\d{2,3})\s*€\s*Pre[çc]o\s+[Ii]ndicativo/gi
const RE_RENTACAR = /Rent\s*-?\s*a\s*-?\s*Car|Pre[çc]o por dia/i
const RE_EXCURSOES = /Excurs[õo]es\b/i
const RE_FLIGHTS = /\bvoos?\b|classe\s*["“][A-Z]/i
const RE_GUIDE = /Sobre [oa] |MOEDA:/i
const RE_LEGAL = /CONDI[ÇC][ÕO]ES GERAIS|Decreto-\s*Lei|insolv[êe]ncia/i
const RE_FOOTER = /www\.\w|RNAVT|@\w+\.\w/

const NOISE = new Set([
  "DIA", "DIAS", "CIDADE", "DE", "DO", "DA", "ORIGEM", "AO", "AOS", "OU", "E",
  "EXTENSÕES", "EXTENSÃO", "NOITES", "AEROPORTO", "OS", "AS", "NA", "NO",
])

const intPrices = (t) => [...t.matchAll(RE_PRICE_INT)].map((m) => Number(m[1])).filter((n) => n >= 150 && n <= 9999)
const offers = (t) => [...t.matchAll(RE_OFFER)]
const distinctDays = (t) => new Set([...t.matchAll(RE_DAY)].map((m) => Number(m[1]))).size
const countExc = (t) => [...t.matchAll(RE_EXC_PRICE)].length

// intervalo de dias colapsado (span >= 2 → pacote de estadia)
function rangeSpan(t) {
  let span = 0
  let m = t.match(/(\d{1,2})\s*º\s*DIA\s*AO\s*(\d{1,2})/i) // "2º DIA AO 7º"
  if (m) span = Math.max(span, +m[2] - +m[1])
  m = t.match(/(\d{1,2})\s*º\s*(?:AO|A|À|AL)\s*(\d{1,2})\s*º\s*DIA/i) // "2º AO 4º DIA"
  if (m) span = Math.max(span, +m[2] - +m[1])
  return span
}

// topónimos distintos nos cabeçalhos de dia ("… DIA - X / Y")
function routePlaces(t) {
  const heads = [...t.matchAll(/\d{1,2}\s*º[^-–]{0,12}[-–]\s*([A-ZÀ-Ú][A-ZÀ-Ú '’\/]{2,60})/g)].map((m) => m[1])
  const toks = new Set()
  for (const h of heads)
    for (const w of h.split(/[\/\s]+/)) {
      const W = w.trim()
      if (W.length >= 3 && /^[A-ZÀ-Ú]/.test(W) && !NOISE.has(W)) toks.add(W)
    }
  return toks
}

function classify(p, isCover) {
  const t = p.text
  if (t.length < 3) return { kind: "imagem" }
  if (isCover) return { kind: "capa" }
  if (t.length > 6000 && RE_LEGAL.test(t)) return { kind: "legal" }
  if (/Índice/.test(t) && t.length < 500) return { kind: "índice" }
  if (t.length < 170 && RE_FOOTER.test(t) && !RE_OFFER.test(t)) return { kind: "rodapé" }
  if (t.length < 25) return { kind: "divisória", title: t.replace(/^\d+\s*/, "").trim() }

  const isProgram = RE_DUR.test(t) && RE_INCL.test(t)
  if (isProgram) return { kind: "programa", ...scoreProgram(t) }

  if (RE_RENTACAR.test(t)) return { kind: "rent-a-car" }
  if (RE_EXCURSOES.test(t.slice(0, 40)) && countExc(t) >= 1) return { kind: "excursões", n: countExc(t) }
  if (RE_GUIDE.test(t)) return { kind: "guia" }
  if (offers(t).length >= 1) return { kind: "hotéis", rows: offers(t).length, prices: intPrices(t) }
  return { kind: "outro" }
}

// ---------- classificador por features ----------
function scoreProgram(t) {
  const dur = t.match(RE_DUR)
  const nights = dur ? +dur[2] : 0
  const days = distinctDays(t)
  const span = rangeSpan(t)
  const bigRange = span >= 2
  const rows = offers(t).length
  const prices = intPrices(t)
  const singlePrice = RE_PRICE_INDIC.test(t) || prices.length === 1
  const flights = RE_FLIGHTS.test(t)
  const places = routePlaces(t)

  const s = { estadia: 0, circuito: 0, extensao: 0 }
  if (bigRange) s.estadia += 2 //   intervalo colapsado = "dias parados"
  if (rows >= 3) s.estadia += 2 //  grelha de hotéis na própria página
  if (places.size >= 2) s.circuito += 2 // rota muda de dia para dia
  if (days >= 5 && !bigRange) s.circuito += 1 // muitos dias enumerados
  if (singlePrice && rows <= 1) s.circuito += 1 // 1 preço fixo, sem grelha
  if (!flights) s.extensao += 3 //  sem voos próprios = add-on
  if (nights <= 3 && !bigRange && !flights) s.extensao += 1

  const ranked = Object.entries(s).sort((a, b) => b[1] - a[1])
  const [type, top] = ranked[0]
  const margin = top - ranked[1][1]
  const conf = top === 0 ? "?" : margin >= 3 ? "alta" : margin === 2 ? "média" : "baixa"

  return {
    type: top === 0 ? "indef." : type,
    conf,
    feat: { nights, days, span: bigRange ? span : 0, rows, prices: prices.length, flights, rota: places.size },
  }
}

// ---------- main ----------
const abs = resolve(pdfPath)
const bytes = new Uint8Array(readFileSync(abs))
const hash = createHash("sha1").update(bytes).digest("hex").slice(0, 12)
const pages = await extractPages(bytes)
const allText = pages.map((p) => p.text).join(" ")

// metadados
const idxPage = pages.find((p) => /Índice/.test(p.text))
let country = idxPage ? (idxPage.text.match(/([A-ZÀ-Ú][A-Za-zÀ-ú]+)\s+Índice/) || [])[1] : null
if (!country && idxPage) country = idxPage.text.trim().split(/\s+/).pop()
const operator = (allText.match(/Sol[ií]férias/) || [])[0] || "?"
const rnavt = (allText.match(/RNAVT\s*n?\.?\s*º?\s*(\d+)/) || [])[1] || "?"

// classificar páginas
const kinds = {}
let area = null
const programs = []
const areas = new Map()
let exc = 0, rent = 0

const bucket = () => {
  const k = area || "(sem secção)"
  if (!areas.has(k)) areas.set(k, { hotels: 0, prices: [] })
  return areas.get(k)
}

const seq = pages.map((p) => ({ p, c: classify(p, p.n === 1) }))
seq.forEach(({ p, c }, i) => {
  kinds[c.kind] = (kinds[c.kind] || 0) + 1
  if (c.kind === "divisória") area = c.title
  else if (c.kind === "programa") programs.push({ page: p.n, seqIdx: i, area, ...c })
  else if (c.kind === "hotéis") { const b = bucket(); b.hotels += c.rows; b.prices.push(...c.prices) }
  else if (c.kind === "excursões") exc += c.n
  else if (c.kind === "rent-a-car") rent++
})

// Boost por contexto (geometria do documento):
// programa COM voos seguido de grelha(s) de hotéis, antes da próxima divisória/
// programa, é definitivamente um pacote de estadia (base + menu de hotéis).
// Extensões (sem voos) e circuitos (preço inline, sem grelha a seguir) não mudam.
for (const prog of programs) {
  if (!prog.feat.flights) continue
  let grid = false
  for (let j = prog.seqIdx + 1; j < seq.length; j++) {
    const k = seq[j].c.kind
    if (k === "divisória" || k === "programa") break
    if (k === "hotéis") { grid = true; break }
  }
  if (grid) { prog.type = "estadia"; prog.conf = "alta"; prog.boosted = true }
}

// ---------- relatório ----------
const line = "─".repeat(70)
console.log(`\n${line}\n📄  ${basename(abs)}\n${line}`)
console.log(`sha1: ${hash}   ·   operador: ${operator}   ·   RNAVT: ${rnavt}   ·   país: ${country || "?"}`)
console.log(`páginas: ${pages.length}  ·  excluídas → capa:${kinds.capa || 0} legal:${kinds.legal || 0} rodapé:${kinds.rodapé || 0} imagem:${kinds.imagem || 0}`)

console.log(`\n🧩  PROGRAMAS classificados por assinatura (tipo · confiança · features):`)
const icon = { estadia: "🏨", circuito: "🧭", extensao: "➕", "indef.": "❓" }
for (const p of programs) {
  const f = p.feat
  const feats = `${f.nights}N dias:${f.days}${f.span ? ` intervalo:${f.span}` : ""} hotéis:${f.rows} preços:${f.prices} voos:${f.flights ? "s" : "n"} rota:${f.rota}`
  const mark = p.boosted ? "ctx" : p.conf
  console.log(`   ${icon[p.type] || "•"} [pág ${String(p.page).padStart(2)}] ${(p.area || "?").slice(0, 18).padEnd(18)} ${p.type.padEnd(8)} ${mark.padEnd(6)} (${feats})`)
}

const tally = programs.reduce((m, p) => ((m[p.type] = (m[p.type] || 0) + 1), m), {})
const lowConf = programs.filter((p) => p.conf === "baixa" || p.type === "indef.")
console.log(`\n   Totais: ${Object.entries(tally).map(([k, v]) => `${k} ${v}`).join(" · ")}`)

const stayAreas = [...areas.entries()].filter(([, a]) => a.hotels > 0)
const totalHotels = stayAreas.reduce((s, [, a]) => s + a.hotels, 0)
console.log(`\n🏨  TABELAS DE HOTÉIS: ${stayAreas.length} áreas · ${totalHotels} hotéis`)
for (const [name, a] of stayAreas) {
  const faixa = a.prices.length ? `${Math.min(...a.prices)}–${Math.max(...a.prices)}€` : "s/ preços"
  console.log(`   • ${name.slice(0, 20).padEnd(20)} ${String(a.hotels).padStart(3)} hotéis   ${faixa}`)
}
if (exc) console.log(`\n🚌  Excursões: ${exc} ofertas`)
if (rent) console.log(`🚗  Rent-a-car/Fly&Drive: ${rent} pág.`)

if (lowConf.length) {
  console.log(`\n⚠️  ${lowConf.length} bloco(s) de BAIXA confiança → rever/LLM:`)
  for (const p of lowConf) console.log(`   • pág ${p.page} (${p.area || "?"}) — ${p.type}`)
}
console.log("")
