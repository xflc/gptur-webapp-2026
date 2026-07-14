#!/usr/bin/env node
/**
 * Importador de programas de viagem a partir de PDFs de parceiros (ex.: Solférias).
 *
 * Uso:
 *   npm run import -- partner-pdfs/00047085.pdf --dry-run
 *   npm run import -- partner-pdfs/00047085.pdf
 *   npm run import -- partner-pdfs/00047085.pdf --pages 1-30 --chunk 6
 *
 * Passos:
 *   1. Extrai o texto de cada página (pdfjs-dist).
 *   2. --dry-run: mostra estatísticas (texto vs. imagem) e uma amostra — não chama a API.
 *   3. Caso contrário: divide em blocos e usa o Claude para estruturar cada
 *      programa no nosso schema Trip; grava rascunhos JSON em
 *      partner-pdfs/imported/<nome>.json para revisão humana.
 *
 * Ambiente (só necessário fora do --dry-run):
 *   ANTHROPIC_API_KEY   chave da API (ou do gateway)
 *   ANTHROPIC_BASE_URL  opcional — endpoint do gateway (ex.: SIXT LLM Gateway)
 *   IMPORT_MODEL        opcional — modelo (default: claude-sonnet-5)
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { basename, resolve, join } from "node:path"

// ---------- args ----------
const argv = process.argv.slice(2)
const pdfPath = argv.find((a) => !a.startsWith("--"))
const has = (f) => argv.includes(f)
const opt = (f, d) => {
  const i = argv.indexOf(f)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d
}

if (!pdfPath) {
  console.error("Uso: npm run import -- <ficheiro.pdf> [--dry-run] [--pages 1-30] [--chunk 6]")
  process.exit(1)
}

const dryRun = has("--dry-run")
const chunkSize = Number(opt("--chunk", "6"))
const pageRange = opt("--pages", null)
const model = process.env.IMPORT_MODEL || "claude-sonnet-5"

// ---------- pdf text extraction ----------
async function extractPages(path) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
  const data = new Uint8Array(readFileSync(path))
  const doc = await pdfjs.getDocument({ data, isEvalSupported: false, useSystemFonts: true }).promise
  const pages = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const text = content.items.map((it) => it.str).join(" ").replace(/\s+/g, " ").trim()
    pages.push({ n: i, text })
  }
  return pages
}

function parseRange(range, max) {
  if (!range) return [1, max]
  const [a, b] = range.split("-").map(Number)
  return [Math.max(1, a || 1), Math.min(max, b || max)]
}

// ---------- Claude extraction ----------
const REGIONS = ["África", "América", "Ásia", "Europa", "Médio Oriente", "Oceânia", "Portugal"]

const programTool = {
  name: "save_programs",
  description: "Guarda os programas de viagem encontrados no texto.",
  input_schema: {
    type: "object",
    properties: {
      programs: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Nome do programa/viagem" },
            country: { type: "string" },
            region: { type: "string", enum: REGIONS },
            price: { type: "number", description: "Preço 'desde' por pessoa em euros, só o número" },
            dates: { type: "string", description: "Datas ou período, tal como aparece" },
            durationDays: { type: "number" },
            tagline: { type: "string", description: "Uma frase curta e apelativa" },
            overview: { type: "array", items: { type: "string" }, description: "1-3 parágrafos de descrição" },
            itinerary: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "string", description: "ex.: '1º Dia'" },
                  route: { type: "string" },
                  body: { type: "string" },
                },
                required: ["day", "route", "body"],
              },
            },
            included: { type: "array", items: { type: "string" } },
            notIncluded: { type: "array", items: { type: "string" } },
            meals: { type: "string" },
          },
          required: ["title", "price", "region"],
        },
      },
    },
    required: ["programs"],
  },
}

const PROMPT = `És um assistente que extrai programas de viagem de catálogos de operadores turísticos (em português de Portugal).
O texto abaixo foi extraído de um PDF e pode estar desorganizado. Identifica CADA programa de viagem distinto e devolve os dados estruturados através da ferramenta save_programs.
Regras:
- Não inventes dados. Se um campo não existir no texto, omite-o.
- 'price' é o valor "desde"/"a partir de" por pessoa, apenas o número (ex.: 1625).
- Escolhe 'region' de entre a lista permitida, com base no país/destino.
- Ignora páginas de capa, índices, condições gerais e publicidade — só programas reais.
- Mantém o texto do itinerário fiel ao original, apenas limpo.
Texto:
`

async function structureChunk(anthropic, text) {
  const res = await anthropic.messages.create({
    model,
    max_tokens: 8000,
    tools: [programTool],
    tool_choice: { type: "tool", name: "save_programs" },
    messages: [{ role: "user", content: PROMPT + text }],
  })
  const block = res.content.find((b) => b.type === "tool_use")
  return block?.input?.programs ?? []
}

const slugify = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60)

// ---------- main ----------
const abs = resolve(pdfPath)
console.log(`\n📄  A ler ${basename(abs)} …`)
const allPages = await extractPages(abs)
const [from, to] = parseRange(pageRange, allPages.length)
const pages = allPages.filter((p) => p.n >= from && p.n <= to)

const totalChars = pages.reduce((s, p) => s + p.text.length, 0)
const avgChars = Math.round(totalChars / pages.length)

console.log(`   Páginas: ${allPages.length} (a processar ${from}-${to})`)
console.log(`   Texto extraído: ${totalChars.toLocaleString("pt-PT")} caracteres (~${avgChars}/página)`)

if (avgChars < 80) {
  console.log(
    "\n⚠️  Muito pouco texto por página — este PDF é provavelmente feito de IMAGENS (brochura/scan)."
  )
  console.log(
    "   Nesse caso precisamos da variante com visão do Claude (renderizar páginas → imagem). Diz-me e adiciono."
  )
}

if (dryRun) {
  const sample = pages.find((p) => p.text.length > 120) || pages[0]
  console.log(`\n— Amostra da página ${sample.n} —\n`)
  console.log(sample.text.slice(0, 1200))
  console.log("\n(dry-run: não foi chamada a API. Remove --dry-run para extrair programas.)\n")
  process.exit(0)
}

// ---- full run: needs API ----
const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  console.error("\n❌  Falta ANTHROPIC_API_KEY. Define a chave (ou usa --dry-run).\n")
  process.exit(1)
}
const { default: Anthropic } = await import("@anthropic-ai/sdk")
const anthropic = new Anthropic({
  apiKey,
  ...(process.env.ANTHROPIC_BASE_URL ? { baseURL: process.env.ANTHROPIC_BASE_URL } : {}),
})

// chunk pages into groups (with 1-page overlap to not cut programs)
const chunks = []
for (let i = 0; i < pages.length; i += chunkSize) {
  const group = pages.slice(i, i + chunkSize + 1)
  chunks.push(group.map((p) => `[Página ${p.n}]\n${p.text}`).join("\n\n"))
}
console.log(`\n🤖  A estruturar ${chunks.length} blocos com ${model} …`)

const seen = new Map()
for (let i = 0; i < chunks.length; i++) {
  process.stdout.write(`   bloco ${i + 1}/${chunks.length} … `)
  try {
    const programs = await structureChunk(anthropic, chunks[i])
    let added = 0
    for (const p of programs) {
      const slug = slugify(p.title || "")
      if (!slug || seen.has(slug)) continue
      seen.set(slug, { slug, image: "", ...p })
      added++
    }
    console.log(`${programs.length} programas (${added} novos)`)
  } catch (e) {
    console.log(`erro: ${e.message}`)
  }
}

const results = [...seen.values()]
const outDir = join(process.cwd(), "partner-pdfs", "imported")
mkdirSync(outDir, { recursive: true })
const outFile = join(outDir, basename(abs).replace(/\.pdf$/i, "") + ".json")
writeFileSync(outFile, JSON.stringify(results, null, 2))

console.log(`\n✅  ${results.length} programas gravados em ${outFile}`)
console.log("   Reveja o JSON e depois corremos o passo de fusão para o site.\n")
