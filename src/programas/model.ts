// GPTur Programas — data model for a publishable site trip program (not a quote).
// Same spirit as orçamentos, but the output is a site offer page, and a hero photo
// (min resolution) is required. No tax, no per-service price.

export interface Day {
  id: string
  title: string // "1º Dia · Chegada a Tóquio"
  body: string
}

export interface Program {
  id: string
  title: string // "Japão Medieval"
  destino: string // "Tóquio · Quioto · Osaka"
  country: string
  region: string // one of REGIONS
  type: "circuito" | "estadia"
  tagline: string // subtitle / eyebrow line
  overview: string // main description
  hero: string // image URL or (uploaded) data URL — required, ≥ MIN_HERO_W wide
  heroW?: number // original dimensions (record of the source quality)
  heroH?: number
  nights?: number
  priceFrom?: number // "desde X€ por pessoa" (optional)
  days: Day[]
  included: string // one item per line
  notIncluded: string
  notes: string
  // viagem de grupo com data fixa (inscrição) em vez de datas sob consulta
  groupTrip?: boolean
  departureStart?: string // ISO yyyy-mm-dd
  departureEnd?: string
  spots?: number
  createdAt: number
  updatedAt: number
}

export const REGIONS = ["Portugal", "Europa", "África", "Ásia", "América", "Oceânia", "Médio Oriente"]

// A hero photo must be at least this wide to look good full-bleed.
// (temporariamente mais permissivo para testar — subir para 1500 depois)
export const MIN_HERO_W = 800
