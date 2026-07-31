// GPTur Orçamentos — data model (see BLUEPRINT.md §2–3).
// Services are the ATOMS (the only thing carrying money). Everything else aggregates.
// Store only raw input; every total is derived on the fly (see pricing.ts).

export type Unit = "por_pessoa" | "por_noite" | "por_grupo" | "por_unidade"

// how a per-unit price multiplies; only por_pessoa scales with pax
export const UNITS: { id: Unit; label: string; short: string }[] = [
  { id: "por_pessoa", label: "Por pessoa", short: "p/ pessoa" },
  { id: "por_noite", label: "Por noite", short: "p/ noite" },
  { id: "por_grupo", label: "Por grupo (total)", short: "p/ grupo" },
  { id: "por_unidade", label: "Por unidade", short: "p/ unidade" },
]

// The atom. Per-unit net/pvp; the document shows the line TOTAL (see pricing.ts).
export interface Service {
  kind: "service"
  id: string
  title: string
  description?: string
  supplier?: string // fornecedor / referência
  category: string // one of CATEGORIES ids (free text allowed)
  unit: Unit
  qty: number
  net: number // per-unit, ex-tax (canonical)
  pvp: number // per-unit, inc-tax (derived = net × (1+rate), stored)
  optional?: boolean // "extra": excluded from base, shown separately
}

// "Opção A/B…": a small bundle of services
export interface Branch {
  id: string
  label?: string // auto "Opção A" if empty
  services: Service[]
}

// "escolha uma opção": nests branches
export interface Alternative {
  kind: "alternative"
  id: string
  title?: string // e.g. "Passeio da tarde"
  branches: Branch[]
}

export type Item = Service | Alternative

// A day-range in ONE place. Revisiting a place = a new stage.
export interface Stage {
  id: string
  place: string
  dayStart?: number // travel day (1-based); date derived from quote.startDate
  dayEnd?: number
  description?: string
  items: Item[]
}

export interface Quote {
  id: string
  taxRate: number // one rate per quote (default 0.23)
  mode: "itinerary" | "flat"

  // framing around the numbers
  title?: string
  client?: string
  ref?: string
  consultant?: string
  pax: number
  validity?: string // e.g. "Válido até 30 dias"
  startDate?: string // ISO yyyy-mm-dd; the days⇄dates anchor
  durationDays?: number // flat mode header ("7 dias") without per-service dates
  greeting?: string
  intro?: string
  notes?: string

  general: Item[] // whole-trip services (voos, seguro, fee) + flat-mode bag
  itinerary: Stage[] // day-by-day program (itinerary mode)

  createdAt: number
  updatedAt: number
}

// Print grouping / quick-pick order (BLUEPRINT §6.1). Free text always allowed.
export const CATEGORIES: { id: string; label: string; chips: string[] }[] = [
  { id: "transporte", label: "Transporte", chips: ["Passagem aérea internacional", "Passagem aérea nacional", "Comboio", "Autocarro", "Cruzeiro", "Aluguer de viatura", "Transfer aeroporto / hotel", "Transfer hotel / aeroporto", "Fretamento de autocarro"] },
  { id: "hospedagem", label: "Hospedagem", chips: ["Hotel", "Pousada / Resort", "Apart-hotel / Hostel", "Estadia com pequeno-almoço", "Estadia all-inclusive"] },
  { id: "pacotes", label: "Pacotes e Roteiros", chips: ["Pacote completo (voo + hotel + passeios)", "Roteiro personalizado", "Excursão / day tour", "Pacote de lua de mel", "Viagem em grupo", "Turismo de incentivo", "Viagem corporativa"] },
  { id: "passeios", label: "Passeios e Experiências", chips: ["City tour", "Passeio guiado temático", "Bilhetes de atrações / museus", "Bilhetes de espetáculos / parques", "Atividade de aventura"] },
  { id: "documentacao", label: "Documentação e Assessoria", chips: ["Assessoria e emissão de visto", "Consultoria de documentação", "Legalização de documentos"] },
  { id: "seguros", label: "Seguros", chips: ["Seguro de viagem", "Seguro de cancelamento", "Seguro de bagagem"] },
  { id: "complementares", label: "Serviços Complementares", chips: ["Aluguer de equipamento", "Chip / internet de viagem", "Câmbio de moeda", "Assistência 24h", "Fee de assessoria e planeamento", "Emissão de e-tickets", "Destination wedding", "MICE (congressos / convenções)"] },
  { id: "estudantes", label: "Estudantes e Intercâmbio", chips: ["Programa de intercâmbio", "Curso de idiomas no estrangeiro", "Assessoria de visto de estudo"] },
  { id: "taxas", label: "Taxas e Cobranças", chips: ["Taxa de serviço da agência", "Taxa de emissão / reemissão", "Taxa de cancelamento / alteração", "Taxas de embarque (repasse)"] },
]

export const CATEGORY_ORDER = CATEGORIES.map((c) => c.id)
export const categoryLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label || id
