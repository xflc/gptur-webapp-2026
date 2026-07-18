#!/usr/bin/env node
/**
 * PROVA DE CONCEITO — importa viagens da Catai (catai.pt) para o schema Offer.
 * As páginas de viagem têm o conteúdo no HTML servido (sem JS): breadcrumb
 * JSON-LD (região/país/título), preço, itinerário dia-a-dia e imagem hero no CDN.
 *
 * Uso: node scripts/build-catai.mjs            (lista PoC abaixo)
 * Escreve: src/data/catai-offers.json  +  public/destinos/<slug>.jpg (+ -thumb).
 */
import { writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { createHash } from "node:crypto"
import sharp from "sharp"

// ~16 viagens variadas por região (prova de conceito)
const SLUGS = [
  "japao-medieval", "paraisos-da-china", "a-magia-de-bali", "a-descoberta-de-borneu-malaio",
  "tanzania-safari-marafiki", "a-procura-do-rei-leao", "africa-do-sul-espetacular", "a-rota-masai",
  "a-descoberta-da-venezuela", "a-descoberta-do-uruguai",
  "a-descoberta-da-arabia", "estadia-no-dubai",
  "malta-espetacular", "marrocos-cidades-vermelhas",
  "a-rota-avatar", "a-descoberta-do-sul-da-tanzania",
]

const UA = { "User-Agent": "Mozilla/5.0 (gptur-import)" }
const clean = (s) => (s || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#039;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim()

const REGION = {
  "África": "África",
  "América Latina": "América", "América Latina e Cuba": "América", "América do Norte": "América",
  "América Central": "América", "América do Sul": "América", "Caraíbas": "América", "Caribe": "América",
  "Ásia Oriental": "Ásia", "Ásia": "Ásia", "Sudeste Asiático": "Ásia", "Sudeste Asiatico": "Ásia",
  "Índia e Subcontinente": "Ásia", "Médio Oriente": "Ásia", "Próximo Oriente": "Ásia",
  "Médio Oriente e Norte de África": "Ásia", "Turquia e Cáucaso": "Ásia", "Cáucaso": "Ásia",
  "Europa": "Europa",
  "Oceânia": "Oceânia", "Pacífico": "Oceânia",
  "Oceano Índico": "Ilhas Idílicas", "Ilhas do Índico": "Ilhas Idílicas",
}
// países do Norte de África: pertencem a "África" mesmo vindos de "Médio Oriente e Norte de África"
const NORTE_AFRICA = ["Marrocos", "Tunísia", "Egito", "Argélia", "Líbia"]

function parseTrip(url, html) {
  // 1) breadcrumb JSON-LD → região, país (destino oficial), nome do circuito
  const ld = html.match(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/i)
  let region = "", country = "", title = ""
  try {
    const items = JSON.parse(ld[1]).itemListElement.map((x) => x.item.name)
    title = items[items.length - 1] // nome do circuito, ex.: "Japão Medieval"
    region = items[1] || ""
    country = items[2] || items[1] || "" // destino oficial, ex.: "Japão"
  } catch {}
  region = REGION[region] || region
  if (NORTE_AFRICA.includes(country)) region = "África"

  // 2) preço "desde" do PRODUTO — o "Desde X €" de topo (não os preços do
  //    carrossel de outras viagens, que usam "N dias desde X €").
  const priceM = html.match(/<span>\s*Desde\s*<\/span>\s*<span>\s*([\d.]+)\s*€/i)
    || html.match(/class="priceblock"[\s\S]{0,200}?([\d.]+)\s*€/i)
  const priceFrom = priceM ? parseInt(priceM[1].replace(/\./g, ""), 10) : null

  // 3) itinerário: zip de cabeçalhos (Dia N + título) com descrições, em ordem
  const heads = [...html.matchAll(/>\s*Dia\s+(\d+)\s*<\/span>\s*<span[^>]*>([^<]+)<\/span>/gi)]
  const descs = [...html.matchAll(/-description"[^>]*>\s*<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => clean(m[1]))
  const days = heads.map((m, idx) => ({ header: `Dia ${m[1]} — ${clean(m[2])}`, body: descs[idx] || "" }))
  const nights = days.length ? days.length - 1 : null

  // 4) overview: a descrição do circuito está no bloco product-resume — escolhe o
  //    <p> mais descritivo (ignora o título e a nota de "extensões"). Fallback: itinerário.
  let overview = ""
  const pr = html.match(/class="product-resume"[\s\S]{0,2500}/i)
  if (pr) {
    const ps = [...pr[0].matchAll(/<p[^>]*>([\s\S]*?)(?:<\/p>|<\/div>)/gi)]
      .map((m) => clean(m[1]))
      .filter((t) => t.length > 40 && !/tamb(é|e)m pode ser|extens(õ|o)es/i.test(t))
      .sort((a, b) => b.length - a.length)
    overview = ps[0] || ""
  }
  if (!overview) {
    for (const d of days) { if (overview.length > 220) break; if (d.body.length > 30) overview += (overview ? " " : "") + d.body }
  }
  overview = overview.slice(0, 400)

  // 4b) incluído: ancorar no cabeçalho "O que está incluído" (não em ocorrências
  //     de "incluído" dentro do itinerário). splitServices no site faz a lista.
  let included = ""
  const incM = html.match(/O que est[áa] inclu[íi]do/i)
  if (incM) {
    const incI = incM.index + incM[0].length
    const endI = html.indexOf("</section>", incI)
    included = clean(html.slice(incI, endI > incI ? endI : incI + 1800)).slice(0, 900)
  }

  // 4c) nota de preço ("Preço desde baseado na … companhia/datas")
  const noteM = html.match(/Preço desde[^<]{0,220}/i)
  const priceNote = noteM ? clean(noteM[0]) : ""

  // 5) hero image (1920x1080 no CDN)
  const heroM = html.match(/https:\/\/d2l4159s3q6ni\.cloudfront\.net\/resize\/1920x1080\/[^"' ]+\.jpg/)
    || html.match(/https:\/\/d2l4159s3q6ni\.cloudfront\.net\/dam\/photos\/[^"' ]+\.jpg/)
  const image = heroM ? heroM[0] : null

  const slug = url.split("/").pop()
  const type = /estadia|estad(i|í)a/i.test(slug) ? "estadia" : "circuito"
  return {
    slug, type, title, destino: country, country, region, priceFrom, priceNote: priceNote || undefined, nights,
    details: { overview: overview || null, program: { days, included, notIncluded: "" } },
    source: { file: url, hash: createHash("md5").update(url).digest("hex").slice(0, 10) },
    _image: image,
  }
}

async function heroToDisk(url, slug) {
  const buf = Buffer.from(await (await fetch(url, { headers: UA })).arrayBuffer())
  const base = sharp(buf).rotate()
  const full = await base.clone().resize({ width: 2000, height: 1400, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer()
  writeFileSync(resolve("public/destinos", `${slug}.jpg`), full)
  writeFileSync(resolve("public/destinos", `${slug}-thumb.jpg`), await base.clone().resize({ width: 800, height: 600, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 72, mozjpeg: true }).toBuffer())
  const m = await sharp(full).metadata()
  return { w: m.width, h: m.height }
}

const offers = []
const credits = {}
let i = 0
for (const slug of SLUGS) {
  i++
  const url = `https://www.catai.pt/viagens/${slug}`
  process.stdout.write(`[${String(i).padStart(2)}/${SLUGS.length}] ${slug} … `)
  try {
    const html = await (await fetch(url, { headers: UA })).text()
    if (/<title>\s*404/i.test(html)) { console.log("404 (ignorado)"); continue }
    const o = parseTrip(url, html)
    if (!o.destino) { console.log("sem dados (ignorado)"); continue }
    if (o._image) {
      const dim = await heroToDisk(o._image, o.slug)
      credits[o.slug] = { by: "Catai", license: "© Catai", source: url, ...dim }
      Object.assign(o, {})
    }
    const img = o._image; delete o._image
    offers.push(o)
    console.log(`ok · ${o.region}/${o.country} · ${o.priceFrom || "?"}€ · ${o.details.program.days.length} dias · ${img ? "img" : "SEM img"}`)
  } catch (e) {
    console.log("FALHOU:", e.message)
  }
  await new Promise((r) => setTimeout(r, 500))
}

writeFileSync(resolve("src/data/catai-offers.json"), JSON.stringify({ generatedAt: new Date().toISOString(), offers }, null, 2))
// funde créditos das imagens Catai no credits.json existente
const credPath = resolve("public/destinos/credits.json")
const { readFileSync } = await import("node:fs")
const existing = JSON.parse(readFileSync(credPath, "utf8"))
writeFileSync(credPath, JSON.stringify({ ...existing, ...credits }, null, 2))
console.log(`\nFIM · ${offers.length} viagens → src/data/catai-offers.json · imagens: ${Object.keys(credits).length}`)
