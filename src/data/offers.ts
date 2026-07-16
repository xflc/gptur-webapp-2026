import data from "./solferias-offers.json"
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
  destino: string
  country: string
  region: string
  priceFrom: number | null
  priceTo?: number | null
  hotels?: number
  nights?: number | null
  boards?: string[]
  details?: OfferDetails
  source: { file: string; hash: string; page?: number }
}

export const offers: Offer[] = (data.offers as Offer[])
export const offersGeneratedAt: string = data.generatedAt

export const offerRegions: string[] = [...new Set(offers.map((o) => o.region))].sort()

export const offerImage = (slug: string) => `/destinos/${slug}.jpg`

// metadados da imagem (fonte/dimensões) gravados por scripts/extract-images.mjs
type ImageMeta = { placeholder?: boolean; reusedFrom?: string; w?: number; h?: number }
const imageMeta = credits as Record<string, ImageMeta>

// imagem digna de hero/destaque: não é placeholder, é horizontal e ≥1250px de
// largura (Maurícia, a 1250px, é o limite aceitável — abaixo disso exclui-se).
export const hasHeroImage = (slug: string) => {
  const c = imageMeta[slug]
  return !!c && !c.placeholder && (c.w ?? 0) >= 1250 && (c.w ?? 0) >= (c.h ?? 1)
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
