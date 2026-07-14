import data from "./solferias-offers.json"

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
  source: { file: string; hash: string; page?: number }
}

export const offers: Offer[] = (data.offers as Offer[])
export const offersGeneratedAt: string = data.generatedAt

export const offerRegions: string[] = [...new Set(offers.map((o) => o.region))].sort()

export const offerImage = (seed: string) => `https://picsum.photos/seed/sf-${seed}/1200/800`

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
