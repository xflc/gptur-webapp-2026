/**
 * Núcleo de extração de catálogos Solférias (SEM API).
 * Fonte única usada por analyze-pdf.mjs (relatório) e build-offers.mjs (JSON).
 * Classifica cada bloco por assinatura estrutural + boost geométrico, com confiança.
 */
import { readFileSync } from "node:fs"
import { createHash } from "node:crypto"

// ---------- regexes estruturais ----------
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

const NOISE = new Set(["DIA","DIAS","CIDADE","DE","DO","DA","ORIGEM","AO","AOS","OU","E","EXTENSÕES","EXTENSÃO","NOITES","AEROPORTO","OS","AS","NA","NO"])

const REGION_BY_COUNTRY = {
  Egito: "África", Marrocos: "África", Gâmbia: "África", Senegal: "África", Moçambique: "África",
  Quénia: "África", Tanzânia: "África", Tunísia: "África", Zanzibar: "África", "São Tomé": "África",
  Brasil: "América", México: "América", Cuba: "América", "Costa Rica": "América", Colômbia: "América",
  Madeira: "Portugal", Açores: "Portugal", Portugal: "Portugal",
  Malta: "Europa", Espanha: "Europa", Itália: "Europa", Grécia: "Europa", Chipre: "Europa",
  Ásia: "Ásia", China: "Ásia", Tailândia: "Ásia", Japão: "Ásia", Vietname: "Ásia", Dubai: "Médio Oriente",
  Qatar: "Médio Oriente", Omã: "Médio Oriente", Turquia: "Médio Oriente",
}
export const regionOf = (country) => REGION_BY_COUNTRY[country] || "Ásia"

const intPrices = (t) => [...t.matchAll(RE_PRICE_INT)].map((m) => Number(m[1])).filter((n) => n >= 150 && n <= 9999)
const offers = (t) => [...t.matchAll(RE_OFFER)]
const distinctDays = (t) => new Set([...t.matchAll(RE_DAY)].map((m) => Number(m[1]))).size
const countExc = (t) => [...t.matchAll(RE_EXC_PRICE)].length

function rangeSpan(t) {
  let span = 0
  let m = t.match(/(\d{1,2})\s*º\s*DIA\s*AO\s*(\d{1,2})/i)
  if (m) span = Math.max(span, +m[2] - +m[1])
  m = t.match(/(\d{1,2})\s*º\s*(?:AO|A|À|AL)\s*(\d{1,2})\s*º\s*DIA/i)
  if (m) span = Math.max(span, +m[2] - +m[1])
  return span
}
function routePlaces(t) {
  const heads = [...t.matchAll(/\d{1,2}\s*º[^-–]{0,12}[-–]\s*([A-ZÀ-Ú][A-ZÀ-Ú '’\/]{2,60})/g)].map((m) => m[1])
  const toks = new Set()
  for (const h of heads) for (const w of h.split(/[\/\s]+/)) {
    const W = w.trim()
    if (W.length >= 3 && /^[A-ZÀ-Ú]/.test(W) && !NOISE.has(W)) toks.add(W)
  }
  return toks
}

// ---------- extração rica ----------
const RE_HOTEL = /([A-ZÀ-Ú0-9][A-ZÀ-Ú0-9 '&.()\/-]{3,46}?)\s+([1-5])\s*\*/g
// tabela de hotéis: nomes e preços vêm por linha, na mesma ordem → zip por índice
const cleanName = (s) =>
  s.trim().replace(/\s+/g, " ")
    .replace(/^\d+\s+/, "")                    // nº de página que vaza ("8 ORQUÍDEA")
    .replace(/^(SA|APA|MP|PC|TI)(\s*\+\s*(SA|APA|MP|PC|TI))?\s+/i, "") // código de regime que vaza
    .trim()
function hotelRows(t) {
  const names = [...t.matchAll(RE_HOTEL)].map((m) => ({ name: cleanName(m[1]), stars: +m[2] }))
  const offs = [...t.matchAll(RE_OFFER)].map((m) => ({ nights: +m[1], board: m[2].replace(/\s+/g, "") }))
  const prices = intPrices(t)
  return names.map((n, i) => ({ ...n, price: prices[i] ?? null, nights: offs[i]?.nights ?? null, board: offs[i]?.board ?? null }))
}
const RE_DAYHEAD = /(\d{1,2})\s*º\s*(?:E\s*\d{1,2}\s*º\s*)?DIAS?\s*[-–]\s*([A-ZÀ-Ú][A-ZÀ-Ú '’\/]{2,55})/g
function dayRoutes(t) {
  const map = new Map()
  for (const m of t.matchAll(RE_DAYHEAD)) { const d = +m[1]; if (!map.has(d)) map.set(d, m[2].trim().replace(/\s+/g, " ")) }
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([d, route]) => ({ day: `${d}º Dia`, route }))
}
function cleanGuide(t, country) {
  let s = t.split(/MOEDA:|FUSO HOR|IDIOMA:/i)[0] // corta a caixa guia (moeda/fuso/idioma)
  s = s.replace(/Sobre\s+(?:[oa]s?\s+)?\S+/i, "").replace(/\bA VISITAR\b/gi, "").replace(/\bGUIA\b/gi, "").trim()
  if (!/Madeira|Açores|Portugal/i.test(country || ""))
    s = s.split(". ").filter((x) => !/Algarv|Monchique|Albufeira|Sagres|Vicentina|Quarteira/i.test(x)).join(". ")
  return s.replace(/\s+/g, " ").slice(0, 650).trim()
}

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
  const places = routePlaces(t).size

  const s = { estadia: 0, circuito: 0, extensao: 0 }
  if (bigRange) s.estadia += 2
  if (rows >= 3) s.estadia += 2
  if (places >= 2) s.circuito += 2
  if (days >= 5 && !bigRange) s.circuito += 1
  if (singlePrice && rows <= 1) s.circuito += 1
  if (!flights) s.extensao += 3
  if (nights <= 3 && !bigRange && !flights) s.extensao += 1

  const ranked = Object.entries(s).sort((a, b) => b[1] - a[1])
  const [type, top] = ranked[0]
  const margin = top - ranked[1][1]
  const conf = top === 0 ? "?" : margin >= 3 ? "alta" : margin === 2 ? "média" : "baixa"
  return { type: top === 0 ? "indef." : type, conf, nights, flights, feat: { nights, days, span: bigRange ? span : 0, rows, prices: prices.length, flights, rota: places } }
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
  if (offers(t).length >= 1) return { kind: "hotéis", rows: offers(t).length, prices: intPrices(t), boards: [...new Set(offers(t).map((m) => m[2].replace(/\s+/g, "")))] }
  return { kind: "outro" }
}

export async function extractPages(bytes) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
  const doc = await pdfjs.getDocument({ data: bytes, isEvalSupported: false, useSystemFonts: true }).promise
  const pages = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    pages.push({ n: i, text: content.items.map((it) => it.str).join(" ").replace(/\s+/g, " ").trim() })
  }
  return pages
}

export async function analyze(absPath) {
  const bytes = new Uint8Array(readFileSync(absPath))
  const hash = createHash("sha1").update(bytes).digest("hex").slice(0, 12)
  const pages = await extractPages(bytes)
  const allText = pages.map((p) => p.text).join(" ")

  const idxPage = pages.find((p) => /Índice/.test(p.text))
  let country = idxPage ? (idxPage.text.match(/([A-ZÀ-Ú][A-Za-zÀ-ú]+)\s+Índice/) || [])[1] : null
  if (!country && idxPage) country = idxPage.text.trim().split(/\s+/).pop()
  const operator = (allText.match(/Sol[ií]férias/) || [])[0] || "?"
  const rnavt = (allText.match(/RNAVT\s*n?\.?\s*º?\s*(\d+)/) || [])[1] || "?"

  const seq = pages.map((p) => ({ p, c: classify(p, p.n === 1) }))
  // boost por contexto: programa c/ voos seguido de grelha de hotéis → estadia alta
  const programsIdx = seq.map((s, i) => (s.c.kind === "programa" ? i : -1)).filter((i) => i >= 0)
  for (const i of programsIdx) {
    if (!seq[i].c.flights) continue
    for (let j = i + 1; j < seq.length; j++) {
      const k = seq[j].c.kind
      if (k === "divisória" || k === "programa") break
      if (k === "hotéis") { seq[i].c.type = "estadia"; seq[i].c.conf = "alta"; seq[i].c.boosted = true; break }
    }
  }

  const kinds = {}
  const areas = new Map()
  const programs = []
  let area = null, exc = 0, rent = 0, overview = null
  const bucket = () => {
    const key = area || "(sem secção)"
    if (!areas.has(key)) areas.set(key, { name: key, hotels: 0, prices: [], boards: new Set(), nights: null, list: [] })
    return areas.get(key)
  }
  for (const { p, c } of seq) {
    kinds[c.kind] = (kinds[c.kind] || 0) + 1
    if (c.kind === "divisória") area = c.title
    else if (c.kind === "guia" && !overview) overview = cleanGuide(p.text, country)
    else if (c.kind === "programa") {
      programs.push({ page: p.n, area, type: c.type, conf: c.conf, boosted: !!c.boosted, feat: c.feat, routes: c.type === "circuito" ? dayRoutes(p.text) : [] })
      if (c.type === "estadia") { const b = bucket(); if (!b.nights) b.nights = c.nights }
    } else if (c.kind === "hotéis") {
      const b = bucket(); b.hotels += c.rows; b.prices.push(...c.prices); c.boards.forEach((x) => b.boards.add(x))
      b.list.push(...hotelRows(p.text))
    } else if (c.kind === "excursões") exc += c.n
    else if (c.kind === "rent-a-car") rent++
  }

  const areaList = [...areas.values()].map((a) => ({
    name: a.name, hotels: a.hotels, nights: a.nights,
    priceFrom: a.prices.length ? Math.min(...a.prices) : null,
    priceTo: a.prices.length ? Math.max(...a.prices) : null,
    boards: [...a.boards],
    list: a.list.filter((h) => h.name && h.name.length > 3),
  }))

  return {
    meta: { file: absPath.split("/").pop(), hash, operator, rnavt, country, region: regionOf(country), pages: pages.length, overview },
    kinds, programs, areas: areaList, excursoes: exc, rentacar: rent,
  }
}
