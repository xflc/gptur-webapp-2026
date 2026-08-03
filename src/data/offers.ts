import data from "./solferias-offers.json"
import catai from "./catai-offers.json"
import programas from "./programas.json"
import credits from "../../public/destinos/credits.json"

export interface HotelRow {
  name: string
  stars: number
  price: number | null
  nights: number | null
  board: string | null
}
export interface ProgramDay {
  header: string
  body: string
}
export interface OfferProgram {
  days: ProgramDay[]
  included: string
  notIncluded: string
}
export interface OfferDetails {
  overview?: string | null
  hotels?: HotelRow[]
  routes?: { day: string; route: string }[]
  program?: OfferProgram | null
}

// divide um texto de serviços (uma linha por item, ou separado por ; ou .) em itens de lista
export const splitServices = (s?: string) =>
  (s || "")
    .split(/\n+|;|(?<=\.)\s+(?=[A-ZÀ-Ú])/)
    .map((x) => x.replace(/^[\s;.]+|[\s;]+$/g, "").trim())
    .filter((x) => x.length > 2)
export interface Offer {
  slug: string
  type: "estadia" | "circuito"
  title?: string // nome do produto/circuito (ex.: "Japão Medieval"); Solférias: ausente
  destino: string // destino oficial (cidade na Solférias, país na Catai)
  country: string
  region: string
  priceFrom: number | null
  priceTo?: number | null
  priceNote?: string // nota do preço "desde" (ex.: companhia/datas base) — Catai
  hotels?: number
  nights?: number | null
  boards?: string[]
  details?: OfferDetails
  source: { file: string; hash: string; page?: number }
  // programas manuais (src/data/programas.json): imagem por link em vez de /destinos/<slug>.jpg
  image?: string
  thumb?: string
  heroW?: number
  heroH?: number
  // viagem de grupo com data fixa (inscrição) em vez de datas "sob consulta"
  groupTrip?: boolean
  departureStart?: string // ISO yyyy-mm-dd
  departureEnd?: string
  spots?: number // nº máximo de participantes
}

// intervalo de datas em português: "2 a 9 de fevereiro de 2027"
export function departureLabel(start?: string, end?: string): string | null {
  if (!start) return null
  const s = new Date(start + "T00:00:00")
  if (isNaN(+s)) return null
  const full = { day: "numeric", month: "long", year: "numeric" } as const
  if (!end) return s.toLocaleDateString("pt-PT", full)
  const e = new Date(end + "T00:00:00")
  if (isNaN(+e)) return s.toLocaleDateString("pt-PT", full)
  const month = (d: Date) => d.toLocaleDateString("pt-PT", { month: "long" })
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear())
    return `${s.getDate()} a ${e.getDate()} de ${month(e)} de ${e.getFullYear()}`
  if (s.getFullYear() === e.getFullYear())
    return `${s.getDate()} de ${month(s)} a ${e.getDate()} de ${month(e)} de ${e.getFullYear()}`
  return `${s.toLocaleDateString("pt-PT", full)} a ${e.toLocaleDateString("pt-PT", full)}`
}

// slug legível a partir do título ("Japão Medieval" → "japao-medieval")
const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")

// programas criados na ferramenta /programas e colados em programas.json (forma Program).
// Convertidos para a forma Offer para entrarem no catálogo e ganharem página em /ofertas/<slug>.
interface ProgramInput {
  id: string; slug?: string; title: string; destino?: string; country?: string; region?: string
  type?: "circuito" | "estadia"; overview?: string; hero?: string; heroW?: number; heroH?: number
  nights?: number; priceFrom?: number; days?: { title: string; body: string }[]
  included?: string; notIncluded?: string; notes?: string
  groupTrip?: boolean; departureStart?: string; departureEnd?: string; spots?: number
}
const programOffers: Offer[] = ((programas as { programs?: ProgramInput[] }).programs ?? []).map((p) => ({
  slug: p.slug || slugify(p.title || p.id),
  type: p.type || "circuito",
  title: p.title,
  destino: p.destino || p.country || p.title,
  country: p.country || "",
  region: p.region || "Europa",
  priceFrom: p.priceFrom ?? null,
  nights: p.nights ?? null,
  details: {
    overview: p.overview || null,
    program: { days: (p.days || []).map((d) => ({ header: d.title, body: d.body })), included: p.included || "", notIncluded: p.notIncluded || "" },
  },
  source: { file: "programa", hash: p.id },
  image: p.hero,
  thumb: p.hero,
  heroW: p.heroW,
  heroH: p.heroH,
  groupTrip: p.groupTrip,
  departureStart: p.departureStart,
  departureEnd: p.departureEnd,
  spots: p.spots,
}))

export const offers: Offer[] = [...(data.offers as Offer[]), ...(catai.offers as Offer[]), ...programOffers]
export const offersGeneratedAt: string = data.generatedAt

// overrides de imagem por link (programas manuais); senão cai em /destinos/<slug>.jpg
const imageBy = new Map<string, string>()
const thumbBy = new Map<string, string>()
const heroDims = new Map<string, { w: number; h: number }>()
for (const o of offers) {
  if (o.image) { imageBy.set(o.slug, o.image); heroDims.set(o.slug, { w: o.heroW ?? 2000, h: o.heroH ?? 1000 }) }
  if (o.thumb || o.image) thumbBy.set(o.slug, (o.thumb || o.image) as string)
}

export const offerRegions: string[] = [...new Set(offers.map((o) => o.region))].sort()

export const offerImage = (slug: string) => imageBy.get(slug) ?? `/destinos/${slug}.jpg`
// miniatura (cartões); a full fica para o hero e página da oferta
export const offerThumb = (slug: string) => thumbBy.get(slug) ?? `/destinos/${slug}-thumb.jpg`

// baralha um array de forma determinística com um seed do dia (YYYYMMDD), para
// os cartões não aparecerem sempre agrupados pela mesma origem. Muda a cada dia
// (recalculado no build); mesma ordem para todos dentro do mesmo dia.
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export function shuffleByDay<T>(arr: T[], salt = 0): T[] {
  const d = new Date()
  const seed = (d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()) + salt
  return shuffleSeed(arr, seed)
}

// baralha com uma seed fixa (determinístico, não muda com o dia) — usado para
// escolher a combinação de destinos do hero. seed 0 = sem baralhar (ordem original).
export function shuffleSeed<T>(arr: T[], seed: number): T[] {
  if (!seed) return [...arr]
  const rnd = mulberry32(seed)
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// rótulo do tipo de viagem (estadia = fica num destino; circuito = percurso)
export const typeLabel = (t: string) => (t === "circuito" ? "Roteiro" : "Destino único")

// operador turístico da oferta (pela origem dos dados)
export const offerOperator = (o: Offer) =>
  /programa/i.test(o.source?.file || "") ? "GPTur" : /catai/i.test(o.source?.file || "") ? "Catai" : "Solférias"

// título a mostrar (nome do circuito, ou o destino se não houver nome de produto)
export const offerTitle = (o: Offer) => o.title || o.destino
// localização (destino + país, sem repetir quando são iguais)
export const offerLocation = (o: Offer) =>
  [...new Set([o.destino, o.country].filter(Boolean))].join(", ")

// metadados da imagem (fonte/dimensões) gravados por scripts/extract-images.mjs
type ImageMeta = { placeholder?: boolean; reusedFrom?: string; w?: number; h?: number }
const imageMeta = credits as Record<string, ImageMeta>

// imagem digna de hero/destaque: não é placeholder, horizontal e de alta
// resolução (≥1500px). Exclui heros de brochuras de baixa resolução (Golfo,
// Ilhas Idílicas), que ficam disponíveis apenas no catálogo.
export const hasHeroImage = (slug: string) => {
  const h = heroDims.get(slug)
  if (h) return h.w >= 1500 && h.w >= h.h
  const c = imageMeta[slug]
  return !!c && !c.placeholder && (c.w ?? 0) >= 1500 && (c.w ?? 0) >= (c.h ?? 1)
}

const BOARD: Record<string, string> = {
  SA: "Só Alojamento",
  APA: "Alojamento e Pequeno-Almoço",
  MP: "Meia Pensão",
  PC: "Pensão Completa",
  TI: "Tudo Incluído",
}
export const boardLabel = (b: string) =>
  b.split("+").map((x) => BOARD[x.trim()] || x.trim()).join(" + ")

export const getOffer = (slug: string) => offers.find((o) => o.slug === slug)
