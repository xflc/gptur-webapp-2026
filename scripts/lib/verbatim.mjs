/**
 * Extração VERBATIM do texto de um programa, via `pdftotext` (poppler) em
 * modo de ordem-de-leitura (sem -layout), que preserva a ordem correta:
 * itinerário dia-a-dia → Serviços Incluídos → Serviços Não Incluídos.
 * Requer poppler instalado (brew install poppler).
 */
import { execFileSync } from "node:child_process"

export function pdfPageText(file, page, span = 0) {
  try {
    return execFileSync(
      "pdftotext",
      ["-f", String(page), "-l", String(page + span), "-nopgbrk", "-enc", "UTF-8", file, "-"],
      { encoding: "utf8", maxBuffer: 2e7 }
    )
  } catch {
    return ""
  }
}

const incLabel = /SERVI[ÇC]OS INCLU[ÍI]DOS NO PRE[ÇC]O/i
const notLabel = /SERVI[ÇC]OS N[ÃA]O INCLU[ÍI]DOS NO PRE[ÇC]O/i
const isHeaderStart = (l) => /^\s*\d{1,2}\s*º\s*(?:AO\s*\d{1,2}\s*º\s*)?(?:E\s*\d{1,2}\s*º\s*)?DIAS?\b/i.test(l)
const isAllCaps = (l) => /[A-ZÀ-Ú]/.test(l) && l === l.toUpperCase() && !/[.;:]/.test(l) && l.length < 60
// ruído a ignorar: tabela de hotéis, caixas de preço, rodapé, dias-da-semana
const isNoise = (l) =>
  /\d+\s*NOITES\s*\||www\.|Pre[çc]o indicativo|pessoa em duplo|^\d{1,4}\s*€?$|Início do programa|^(Segundas?|Ter[çc]as?|Quartas?|Quintas?|Sextas?|S[áa]bados?|Domingos?)\b/i.test(l)

export function parseProgram(raw) {
  const lines = raw.split("\n")
  const days = []
  let cur = null
  const included = [], notIncluded = []
  let mode = "body" // body | inc | not

  for (const rawLine of lines) {
    const l = rawLine.trim()
    if (incLabel.test(l)) { mode = "inc"; continue }
    if (notLabel.test(l)) { mode = "not"; continue }
    if (l === "") { if (mode === "inc" || mode === "not") mode = "body"; continue } // fim do bloco inclui/não-inclui
    if (isHeaderStart(l)) { cur = { header: l, body: [] }; days.push(cur); mode = "body"; continue }
    if (isNoise(l)) continue

    if (mode === "inc") { included.push(l); continue }
    if (mode === "not") { notIncluded.push(l); continue }
    if (!cur) continue
    if (cur.body.length === 0 && isAllCaps(l)) { cur.header += " " + l; continue } // continuação do cabeçalho
    cur.body.push(l)
  }

  return finalize(days, included, notIncluded)
}

const dayNum = (h) => { const m = h.match(/(\d{1,2})/); return m ? +m[1] : 999 }

function finalize(days, included, notIncluded) {
  const clean = (arr) => arr.join(" ").replace(/\s+/g, " ").trim()
  const byNum = new Map()
  for (const d of days) {
    const n = dayNum(d.header)
    if (!byNum.has(n) || (!byNum.get(n).body.length && d.body.length)) byNum.set(n, d)
  }
  const ordered = [...byNum.values()].sort((a, b) => dayNum(a.header) - dayNum(b.header))
  return {
    days: ordered.map((d) => ({ header: d.header.replace(/\s+/g, " ").trim(), body: clean(d.body) })).filter((d) => d.header),
    included: clean(included),
    notIncluded: clean(notIncluded),
  }
}

// Extrai o programa completo, estendendo para a página seguinte quando o
// circuito continua (dia máximo da 1ª página < total "N Dias"), e limita
// pelos dias reais do programa (evita puxar o programa seguinte).
export function extractProgram(file, page) {
  if (!page) return null
  const t1 = pdfPageText(file, page, 0)
  const dias = (t1.match(/(\d{1,2})\s*Dias/i) || [])[1]
  let prog = parseProgram(t1)
  const maxLead = (p) => Math.max(0, ...p.days.map((d) => dayNum(d.header)).filter((n) => n < 900))
  if (dias && maxLead(prog) < +dias) {
    const prog2 = parseProgram(pdfPageText(file, page, 1))
    if (prog2.days.length > prog.days.length) prog = prog2
  }
  if (dias) prog.days = prog.days.filter((d) => dayNum(d.header) <= +dias)
  return prog
}
