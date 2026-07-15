#!/usr/bin/env node
/**
 * Foto bonita por destino via Wikimedia Commons — SEM conta/API key —
 * preferindo as coleções curadas "Quality images" e "Featured pictures"
 * (fotos avaliadas, alta resolução, uso comercial). Fallback: melhor foto
 * horizontal da pesquisa. Guarda em public/destinos/<slug>.jpg + créditos.
 *
 * Uso: npm run fetch:images   (para refazer: apagar public/destinos/*.jpg)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs"
import { resolve, join } from "node:path"
import sharp from "sharp"

const OUT = resolve("public/destinos")
mkdirSync(OUT, { recursive: true })
const have = new Set(readdirSync(OUT))
const offers = JSON.parse(readFileSync(resolve("src/data/solferias-offers.json"), "utf8")).offers
const creditsPath = join(OUT, "credits.json")
const credits = existsSync(creditsPath) ? JSON.parse(readFileSync(creditsPath, "utf8")) : {}

const UA = { "User-Agent": "gptur-site/1.0 (altalisboa@gptur.pt)" }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function jget(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, { headers: UA })
    if (r.ok) return r
    if (r.status === 429) { await sleep(2000 * (i + 1)); continue }
    throw new Error("HTTP " + r.status)
  }
  throw new Error("HTTP 429")
}
const strip = (s) => (s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()

// exclui falsos positivos comuns em "Quality images" (espécimes, selos, mapas…)
const NEG = "-Conus -shell -seashell -Murex -Cypraea -snail -specimen -mollusc -stamp -coin -banknote -map -diagram -herbarium -butterfly -beetle -moth"
// pesquisa Commons; filt = restrição de categoria (qualidade) ou ""
async function commonsSearch(term, filt) {
  const q = encodeURIComponent(`${term} ${filt} ${NEG}`.trim())
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=20&gsrsearch=${q}&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1600&origin=*`
  let pages
  try { pages = Object.values((await (await jget(url)).json())?.query?.pages || {}) } catch { return null }
  const cand = pages
    .map((p) => p.imageinfo?.[0]).filter(Boolean)
    .filter((i) => /\.(jpe?g|png)$/i.test(i.url) && i.width >= 1000 && i.width >= i.height) // foto horizontal grande
    .sort((a, b) => b.width - a.width)
  const i = cand[0]
  if (!i) return null
  const md = i.extmetadata || {}
  return { url: i.thumburl || i.url, by: strip(md.Artist?.value) || "—", license: strip(md.LicenseShortName?.value), source: i.descriptionurl }
}

async function download(src, dest) {
  const buf = Buffer.from(await (await jget(src)).arrayBuffer())
  const out = await sharp(buf).rotate().resize({ width: 1400, height: 1000, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toBuffer()
  writeFileSync(dest, out)
}

// termo icónico por destino (pt/inglês) para bons resultados
const QUERY = {
  "africa-boa-vista": "Boa Vista Cape Verde dunes beach", "africa-fogo": "Fogo Cape Verde volcano",
  "africa-gambia": "Gambia", "africa-mocambique": "Mozambique beach", "africa-quenia": "Kenya safari",
  "africa-sal": "Sal Cape Verde", "africa-santiago": "Santiago Cape Verde", "africa-santo-antao": "Santo Antão Cape Verde",
  "africa-sao-vicente": "Mindelo Cape Verde", "africa-senegal": "Senegal", "africa-zanzibar": "Zanzibar beach",
  "algarve-de-alvor-a-portimao-13": "Alvor Algarve", "algarve-momentos-75": "Praia da Rocha Algarve",
  "america-aruba": "Aruba beach", "america-bahamas": "Bahamas beach", "america-colombia": "Cartagena Colombia",
  "america-costa-rica": "Costa Rica", "america-curacao": "Willemstad Curaçao", "america-e-u-a": "New York City",
  "america-flor-ianopolis": "Florianópolis", "america-fortaleza": "Fortaleza Brazil", "america-fortaleza-circuito-13": "Fortaleza Brazil",
  "america-joao-pessoa": "João Pessoa", "america-maceio": "Maceió", "america-natal": "Natal Brazil",
  "america-recife": "Recife", "america-rio-de-janeiro": "Rio de Janeiro", "america-rio-de-janeiro-circuito-57": "Rio de Janeiro Sugarloaf",
  "america-rio-de-janeiro-circuito-59": "Amazon river Brazil", "america-salvador-da-bahia": "Salvador Bahia",
  "asia-abu-dhabi": "Sheikh Zayed Mosque Abu Dhabi", "asia-dubai": "Dubai skyline", "asia-oma": "Muscat Oman",
  "asia-qatar": "Doha Qatar", "asia-ras-al-khaimah": "Ras Al Khaimah",
  "egito-cairo-circuito-25": "Pyramids of Giza", "egito-cairo-circuito-26": "Luxor temple Egypt",
  "egito-cairo-circuito-27": "Great Sphinx Giza", "egito-cairo-circuito-28": "Abu Simbel",
  "egito-el-alamein": "Marina El Alamein", "egito-hurghada": "Hurghada", "egito-marsa-alam": "Marsa Alam",
  "egito-sharm-el-sheik": "Sharm el-Sheikh", "europa-formentera": "Formentera", "europa-ibiza": "Ibiza",
  "europa-maiorca": "Mallorca", "europa-menorca": "Menorca", "gran-canaria-fuerteventura": "Fuerteventura",
  "gran-canaria-gran-canaria": "Maspalomas Gran Canaria", "gran-canaria-lanzarote": "Lanzarote",
  "gran-canaria-tenerife": "Teide Tenerife", "grecia-atenas": "Acropolis Athens",
  "grecia-especial-cruzeiros-circuito-28": "Santorini", "ilhas-idilicas-mauricia": "Mauritius beach",
  "ilhas-idilicas-play-madagascar": "Madagascar baobab", "ilhas-idilicas-play-maldivas": "Maldives",
  "ilhas-idilicas-play-seicheles": "Seychelles beach", "malta-malta": "Valletta Malta",
  "marrocos-agadir": "Agadir beach Morocco", "marrocos-casablanca": "Hassan II Mosque", "marrocos-fez": "Fez Morocco",
  "marrocos-marraquexe": "Marrakech", "marrocos-saidia": "Saïdia Morocco",
  "portugal-faial": "Faial Azores", "portugal-faial-circuito-34": "Faial Azores", "portugal-madeira": "Madeira Portugal",
  "portugal-madeira-circuito-16": "Madeira mountains", "portugal-madeira-circuito-17": "Funchal Madeira",
  "portugal-porto-santo": "Porto Santo Madeira", "portugal-sao-miguel": "Sete Cidades Azores",
  "portugal-terceira": "Angra do Heroísmo", "tunisia-djerba": "Djerba", "tunisia-enfidha": "Sousse Tunisia",
  "tunisia-hammamet": "Hammamet", "tunisia-monastir": "Monastir Tunisia",
}
function candidates(o) {
  const base = (QUERY[o.slug] || o.destino).replace(/\s+/g, " ").trim()
  const w = base.split(" ")
  const cs = []
  for (let n = w.length; n >= 1; n--) cs.push(w.slice(0, n).join(" "))
  return [...new Set(cs.filter((x) => x.length > 1))]
}

let ok = 0, skip = 0, fail = 0
for (const o of offers) {
  const file = `${o.slug}.jpg`
  if (have.has(file)) { skip++; continue }
  let hit = null, tag = ""
  outer: for (const q of candidates(o)) {
    for (const [filt, label] of [['incategory:"Quality images"', "Q"], ['incategory:"Featured pictures on Wikimedia Commons"', "F"], ["", "·"]]) {
      hit = await commonsSearch(q, filt)
      if (hit) { tag = label; break outer }
    }
  }
  try {
    if (!hit) throw new Error("sem resultado")
    await download(hit.url, join(OUT, file))
    credits[o.slug] = { by: hit.by, license: hit.license, source: hit.source }
    have.add(file); ok++
    console.log(`🖼️ ${tag} ${o.destino.slice(0, 20).padEnd(20)} ${hit.license.slice(0, 12).padEnd(12)} ${hit.by.slice(0, 28)}`)
  } catch (e) { fail++; console.log(`✗    ${o.destino.slice(0, 20).padEnd(20)} ${e.message}`) }
  await sleep(400)
}
writeFileSync(creditsPath, JSON.stringify(credits, null, 2))
console.log(`\nFIM · ok:${ok} · já tinha:${skip} · falhou:${fail}  (Q=quality, F=featured, ·=normal)`)
