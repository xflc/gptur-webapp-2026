import data from "./solferias-offers.json"
import catai from "./catai-offers.json"
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

// divide um texto de serviços (separado por ; ou .) em itens de lista
export const splitServices = (s?: string) =>
  (s || "")
    .split(/;|(?<=\.)\s+(?=[A-ZÀ-Ú])/)
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
}

export const offers: Offer[] = [...(data.offers as Offer[]), ...(catai.offers as Offer[])]
export const offersGeneratedAt: string = data.generatedAt

export const offerRegions: string[] = [...new Set(offers.map((o) => o.region))].sort()

export const offerImage = (slug: string) => `/destinos/${slug}.jpg`
// miniatura (cartões); a full fica para o hero e página da oferta
export const offerThumb = (slug: string) => `/destinos/${slug}-thumb.jpg`

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
