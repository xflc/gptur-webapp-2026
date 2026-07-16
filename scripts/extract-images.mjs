#!/usr/bin/env node
/**
 * Foto "hero" de cada destino, extraída das brochuras Solférias (partner-pdfs/*.pdf).
 *
 * Abordagem (texto + cobertura, robusta — ver validação em hero-preview/):
 *   1) Classifica cada página pelo TEXTO: hotel / conteúdo / divisória.
 *   2) Mapeia cada oferta à sua página (source.page → título → source.page).
 *   3) Procura o hero FULL-BLEED na janela [P-2 .. P] (apanha os layouts de
 *      2 e 3 páginas: [divisória]→[conteúdo] e [divisória]→[Sobre o X]→[conteúdo]).
 *      "Full-bleed" = cobertura de página ≥80% da largura, medida via ppi
 *      (px ÷ ppi ÷ tamanho_da_página) — independente da resolução, ao contrário
 *      de uma regra de píxeis. Âncora: uma divisória só conta se o texto contiver
 *      o nome do destino (evita apanhar a divisória do vizinho).
 *   4) NUNCA usa imagens de páginas-hotel → foto de hotel é impossível por construção.
 *   5) Reutilização por destino: ofertas sem hero próprio herdam o de outra
 *      oferta do mesmo destino (ex.: Cairo).
 *
 * Fallback Wikimedia Commons: DESLIGADO por agora. Continua disponível e
 * reutilizável em scripts/fetch-images.mjs (`npm run fetch:images`). Ver a nota
 * de reativação no fim deste ficheiro.
 *
 * Uso: npm run extract:images            (todas)
 *      node scripts/extract-images.mjs egito   (só slugs que contêm "egito")
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync, copyFileSync, unlinkSync } from "node:fs"
import { resolve, join } from "node:path"
import { execFileSync } from "node:child_process"
import sharp from "sharp"

const OUT = resolve("public/destinos")
const AUDIT = resolve("hero-audit") // artefactos de auditoria (fora de public/)
const PDF_DIR = resolve("partner-pdfs")
const TMP = resolve("partner-pdfs/.imgtmp")
mkdirSync(OUT, { recursive: true })
mkdirSync(AUDIT, { recursive: true })
const filter = process.argv[2] || ""
const offers = JSON.parse(readFileSync(resolve("src/data/solferias-offers.json"), "utf8")).offers
const credits = {}

// Heroes escolhidos à mão (slug -> página) para casos que o automático não
// apanha — normalmente heroes em capas de destino único, longe da página de
// conteúdo. Verificados visualmente no contact-sheet.
const OVERRIDES = {
  "malta-malta": 2, // Blue Lagoon (a capa p3 tem o círculo; a p2 é limpa)
}

// Heroes rejeitados na auditoria visual (círculo decorativo baked-in ou foto
// fraca). Tratados como "sem hero próprio" → reutilizam irmão do mesmo destino
// ou caem para placeholder. O círculo é gráfico e não se deteta por píxeis.
const REJECT = new Set([
  "portugal-madeira",              // círculo (p5) → reutiliza circuito-16 limpo
  "ilhas-idilicas-play-maldivas",  // círculo
  "egito-marsa-alam",              // foto fraca (tronco escuro)
])

const noAcc = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
const up = (s) => noAcc(s).toUpperCase()

const _pgCache = {}
function pageSize(pdf) {
  if (_pgCache[pdf]) return _pgCache[pdf]
  const out = execFileSync("pdfinfo", [pdf], { encoding: "utf8" })
  const m = out.match(/Page size:\s+([\d.]+)\s*x\s*([\d.]+)/)
  const total = parseInt(out.match(/Pages:\s+(\d+)/)?.[1] || "0", 10)
  return (_pgCache[pdf] = { w: parseFloat(m[1]), h: parseFloat(m[2]), total })
}
function pageText(pdf, p) {
  try { return execFileSync("pdftotext", ["-f", String(p), "-l", String(p), pdf, "-"], { encoding: "utf8" }) } catch { return "" }
}
// imagens da página + cobertura calculada via ppi
function images(pdf, p, pg) {
  let out
  try { out = execFileSync("pdfimages", ["-list", "-f", String(p), "-l", String(p), pdf], { encoding: "utf8" }) } catch { return [] }
  const pgWin = pg.w / 72, pgHin = pg.h / 72
  return out.split("\n").slice(2).filter((l) => /\bimage\b/.test(l)).map((l) => {
    const c = l.trim().split(/\s+/)
    // page num type width height color comp bpc enc interp objID x-ppi y-ppi size ratio
    const width = +c[3], height = +c[4], xppi = +c[12] || 72, yppi = +c[13] || 72
    return { num: +c[1], width, height, covW: (width / xppi) / pgWin, area: width * height }
  })
}
function classify(t) {
  const T = up(t)
  const hotel = /WWW\.[\w-]*HOTEL|PRECO INDICATIVO|\bNOITES?\s*\|/.test(T) || (T.match(/\d\s?\*/g) || []).length >= 2
  const content = (/\b\d+\s*DIAS\b/.test(T) || /\bCOMBINADO\b/.test(T)) && /\b1[ºO]\s*DIA\b/.test(T)
  return { hotel, content }
}
// linha-título: 1ª linha em MAIÚSCULAS após "N Dias/Noites", antes de "1º DIA"
function titleOf(t) {
  let seen = false
  for (const l of t.split("\n").map((x) => x.trim()).filter(Boolean)) {
    if (/\b\d+\s*(Dias|Noites)\b/i.test(l) || /Combinado/i.test(l)) { seen = true; continue }
    if (/^\d+[ºo]?\s*DIA/i.test(l)) break
    if (seen && l === l.toUpperCase() && l.replace(/[^A-Za-zÀ-ÿ]/g, "").length >= 3) return l
  }
  return null
}

async function writeHero(srcPath, slug) {
  const buf = await sharp(srcPath).rotate().resize({ width: 1400, height: 1000, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer()
  writeFileSync(join(OUT, `${slug}.jpg`), buf)
  const m = await sharp(buf).metadata()
  return { w: m.width, h: m.height }
}
async function extractImageOnPage(pdf, p, num, slug) {
  rmSync(TMP, { recursive: true, force: true }); mkdirSync(TMP, { recursive: true })
  execFileSync("pdfimages", ["-j", "-p", "-f", String(p), "-l", String(p), pdf, join(TMP, "i")], { stdio: "ignore" })
  const files = readdirSync(TMP).filter((f) => /\.(jpe?g|png)$/i.test(f))
  const match = files.find((f) => new RegExp(`-0*${p}-0*${num}\\.`).test(f)) || files.sort((a, b) => a.localeCompare(b))[num] || files[0]
  return writeHero(join(TMP, match), slug)
}

// arranque: extração limpa — apaga heroes/Commons antigos das ofertas em foco
for (const o of offers) {
  if (filter && !o.slug.includes(filter)) continue
  const f = join(OUT, `${o.slug}.jpg`)
  if (existsSync(f)) unlinkSync(f)
}

// progresso: uma linha por oferta (visível mesmo através de pipes)
const focus = offers.filter((o) => !filter || o.slug.includes(filter))
const bar = (i, total, label) => {
  const w = 20, done = Math.round((i / total) * w)
  console.log(`[${String(i).padStart(2)}/${total}] ${"█".repeat(done)}${"░".repeat(w - done)} ${label}`)
}

const log = []
const heroOf = {} // destino -> slug com hero próprio
let n = 0
for (const o of offers) {
  if (filter && !o.slug.includes(filter)) continue
  bar(++n, focus.length, o.slug)
  if (!o.source?.file) { log.push({ slug: o.slug, result: "sem source" }); continue }
  const pdf = join(PDF_DIR, o.source.file)
  if (!existsSync(pdf)) { log.push({ slug: o.slug, result: "pdf em falta" }); continue }
  const pg = pageSize(pdf)

  const meta = []
  for (let p = 1; p <= pg.total; p++) { const t = pageText(pdf, p); meta.push({ p, t, ...classify(t), title: titleOf(t) }) }

  // 1) âncora: source.page (se conteúdo) → título → source.page
  let anchor = null, via = ""
  const sp = o.source.page
  if (sp && meta[sp - 1]?.content && !meta[sp - 1]?.hotel) { anchor = sp; via = "source.page" }
  if (!anchor) { const hit = meta.find((m) => m.content && m.title && up(m.title).includes(up(o.destino))); if (hit) { anchor = hit.p; via = "título p" + hit.p } }
  if (!anchor && sp) { anchor = sp; via = "source.page(fb)" }
  if (!anchor) { log.push({ slug: o.slug, result: "sem página" }); continue }

  // 2) hero full-bleed, nunca páginas-hotel, ancorado ao destino.
  //    Âncora por PALAVRA (≥4 letras) — a divisória costuma ter o nome curto
  //    ("SALVADOR" para "Salvador da Bahia"). Janela [anchor-2 .. anchor].
  //    OVERRIDES: página escolhida à mão para casos que o automático não apanha
  //    (heroes em capas de destino único, longe da página de conteúdo).
  const words = up(o.destino).split(/[^A-Z0-9]+/).filter((w) => w.length >= 4)
  const textHas = (m) => words.length ? words.some((w) => up(m.t).includes(w)) : false
  const win = OVERRIDES[o.slug] ? [OVERRIDES[o.slug]] : [anchor - 2, anchor - 1, anchor]
  const cands = []
  for (const pp of win) {
    const m = meta[pp - 1]
    if (!m || m.hotel) continue
    const anchored = pp === anchor || OVERRIDES[o.slug] === pp || textHas(m)
    for (const im of images(pdf, pp, pg)) cands.push({ ...im, p: pp, anchored })
  }
  cands.sort((a, b) => b.covW - a.covW)
  const hero = cands.find((c) => c.covW >= 0.8 && c.anchored)
  if (!hero) { log.push({ slug: o.slug, result: "sem full-bleed", maxCov: cands[0] ? Math.round(cands[0].covW * 100) + "%" : "—" }); continue }
  if (REJECT.has(o.slug)) { log.push({ slug: o.slug, result: "rejeitado (auditoria)" }); continue }
  if (OVERRIDES[o.slug]) via = "override p" + OVERRIDES[o.slug]

  const dim = await extractImageOnPage(pdf, hero.p, hero.num, o.slug)
  credits[o.slug] = { by: "Solférias", license: "© Solférias (brochura)", source: o.source.file, page: hero.p, ...dim }
  heroOf[o.destino] ??= o.slug
  log.push({ slug: o.slug, result: "OK", page: hero.p, via, cov: Math.round(hero.covW * 100) + "%" })
}
console.log("— extração concluída —")

// 3) reutilização por destino
let reused = 0
for (const o of offers) {
  if (filter && !o.slug.includes(filter)) continue
  if (credits[o.slug]) continue
  const src = heroOf[o.destino]
  if (!src) continue
  copyFileSync(join(OUT, `${src}.jpg`), join(OUT, `${o.slug}.jpg`))
  credits[o.slug] = { ...credits[src], reusedFrom: src }
  reused++
  const r = log.find((x) => x.slug === o.slug); if (r) r.result = "REUTILIZA " + src
}
rmSync(TMP, { recursive: true, force: true })

// 4) placeholder de marca para ofertas sem hero (Commons desligado). Gradiente
//    teal→gold com o nome do destino, para não parecer imagem partida.
const noimgOffers = offers.filter((o) => (!filter || o.slug.includes(filter)) && !credits[o.slug])
for (const o of noimgOffers) {
  const label = o.destino.replace(/&/g, "&amp;").replace(/</g, "&lt;")
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="933">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2a6b61"/><stop offset="1" stop-color="#1c4a43"/></linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text x="50%" y="47%" font-family="Georgia, serif" font-size="86" fill="#edc84a" text-anchor="middle">${label}</text>
    <text x="50%" y="57%" font-family="sans-serif" font-size="26" letter-spacing="6" fill="#ffffff" opacity="0.7" text-anchor="middle">GPTUR</text>
  </svg>`
  const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toBuffer()
  writeFileSync(join(OUT, `${o.slug}.jpg`), buf)
  credits[o.slug] = { placeholder: true }
}

writeFileSync(join(OUT, "credits.json"), JSON.stringify(credits, null, 2))
writeFileSync(join(AUDIT, "extract-log.json"), JSON.stringify(log, null, 2))

// contact-sheet para auditoria visual
const done = offers.filter((o) => (!filter || o.slug.includes(filter)) && credits[o.slug])
if (done.length) {
  process.stdout.write("A gerar contact-sheet…\n")
  const cell = 300, ch = Math.round(cell * 0.62), pad = 6, labelH = 26, cols = 5
  const rows = Math.ceil(done.length / cols)
  const comps = []
  for (let i = 0; i < done.length; i++) {
    const o = done[i], x = pad + (i % cols) * (cell + pad), y = pad + Math.floor(i / cols) * (ch + pad + labelH)
    comps.push({ input: await sharp(join(OUT, o.slug + ".jpg")).resize(cell, ch, { fit: "cover" }).jpeg().toBuffer(), left: x, top: y + labelH })
    const c = credits[o.slug]
    const sub = c.reusedFrom ? "↻ " + c.reusedFrom : "p" + c.page
    comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cell}" height="${labelH}"><rect width="100%" height="100%" fill="#111"/><text x="4" y="11" font-size="10" fill="#fff" font-family="sans-serif">${o.slug}</text><text x="4" y="22" font-size="9" fill="#9fe" font-family="sans-serif">${o.source.file} ${sub}</text></svg>`), left: x, top: y })
  }
  await sharp({ create: { width: cols * (cell + pad) + pad, height: rows * (ch + pad + labelH) + pad, channels: 3, background: { r: 40, g: 40, b: 40 } } }).composite(comps).jpeg({ quality: 82 }).toFile(join(AUDIT, "contact-sheet.jpg"))
}

const ok = log.filter((r) => r.result === "OK").length
const noimg = offers.filter((o) => (!filter || o.slug.includes(filter)) && !credits[o.slug])
console.log(`\nFIM · extraídas:${ok} · reutilizadas:${reused} · SEM foto:${noimg.length}`)
if (noimg.length) console.log("SEM foto (sem Commons):", noimg.map((o) => o.slug).join(", "))
console.log("Auditoria: hero-audit/contact-sheet.jpg · hero-audit/extract-log.json")

/*
 * REATIVAR o fallback Wikimedia Commons (preencher destinos sem hero de PDF):
 *   1) npm run fetch:images   → semeia public/destinos/<slug>.jpg via Commons
 *   2) neste script, remover o bloco "arranque: extração limpa" (para o Commons
 *      servir de base e o PDF só sobrepor onde há hero), e arrancar `credits`
 *      a partir do public/destinos/credits.json existente em vez de {}.
 */
