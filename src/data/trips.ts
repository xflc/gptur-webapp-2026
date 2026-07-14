export type Region =
  | "África"
  | "América"
  | "Ásia"
  | "Europa"
  | "Médio Oriente"
  | "Oceânia"
  | "Portugal"

export interface Trip {
  slug: string
  title: string
  region: Region
  country: string
  price: number
  dates: string
  durationDays: number
  image: string
  tagline: string
  featured?: boolean
  withAuthor?: boolean
}

// Placeholder imagery via picsum (stable, real photos) — swap for
// destination photography when available.
const img = (seed: string) =>
  `https://picsum.photos/seed/${seed}/1200/800`

export const trips: Trip[] = [
  {
    slug: "china-classica",
    title: "China Clássica",
    region: "Ásia",
    country: "China",
    price: 4045,
    dates: "19 AGO 2026 – 29 AGO 2026",
    durationDays: 11,
    image: img("china-greatwall"),
    tagline: "Da Grande Muralha aos guerreiros de terracota, com guia em português.",
    featured: true,
  },
  {
    slug: "istambul-dois-continentes",
    title: "Istambul: a cidade dos dois continentes",
    region: "Médio Oriente",
    country: "Turquia",
    price: 1675,
    dates: "3 SET 2026 – 6 SET 2026",
    durationDays: 4,
    image: img("istanbul-bosphorus"),
    tagline: "Onde a Europa encontra a Ásia, entre bazares e minaretes.",
    featured: true,
  },
  {
    slug: "marrocos-1000-kasbahs",
    title: "Marrocos – Circuito dos 1000 Kasbahs",
    region: "África",
    country: "Marrocos",
    price: 1625,
    dates: "7 SET 2026 – 13 SET 2026",
    durationDays: 7,
    image: img("morocco-desert"),
    tagline: "Medinas, dunas e kasbahs de barro no coração do Magrebe.",
    featured: true,
  },
  {
    slug: "inglaterra-jane-austen",
    title: "A Inglaterra de Jane Austen",
    region: "Europa",
    country: "Inglaterra",
    price: 1695,
    dates: "9 SET 2026 – 13 SET 2026",
    durationDays: 5,
    image: img("england-countryside"),
    tagline: "Uma viagem literária pelos cenários da grande romancista.",
    featured: true,
    withAuthor: true,
  },
  {
    slug: "circuito-acoriano",
    title: "Circuito Açoriano",
    region: "Portugal",
    country: "Portugal",
    price: 2000,
    dates: "12 SET 2026 – 19 SET 2026",
    durationDays: 8,
    image: img("azores-green"),
    tagline: "Vulcões, lagoas e o verde infinito no meio do Atlântico.",
    featured: true,
  },
  {
    slug: "cabo-verde-4-ilhas",
    title: "Cabo Verde (4 Ilhas)",
    region: "África",
    country: "Cabo Verde",
    price: 2500,
    dates: "13 SET 2026 – 20 SET 2026",
    durationDays: 8,
    image: img("capeverde-ocean"),
    tagline: "Morabeza, morna e praias douradas ilha a ilha.",
    featured: true,
  },
  {
    slug: "asia-central",
    title: "Ásia Central: Quirguistão, Uzbequistão e Tajiquistão",
    region: "Ásia",
    country: "Uzbequistão",
    price: 3575,
    dates: "14 SET 2026 – 24 SET 2026",
    durationDays: 11,
    image: img("samarkand-silkroad"),
    tagline: "Pela Rota da Seda, entre madraças e estepes.",
    featured: true,
  },
  {
    slug: "italia-classica",
    title: "Itália Clássica",
    region: "Europa",
    country: "Itália",
    price: 2745,
    dates: "19 SET 2026 – 26 SET 2026",
    durationDays: 8,
    image: img("italy-rome"),
    tagline: "Roma, Florença e Veneza — a essência do Grand Tour.",
    featured: true,
  },
  {
    slug: "guatemala-honduras-maia",
    title: "Guatemala e Honduras – Nos trilhos do Império Maia",
    region: "América",
    country: "Guatemala",
    price: 3950,
    dates: "20 SET 2026 – 30 SET 2026",
    durationDays: 11,
    image: img("guatemala-maya"),
    tagline: "Templos na selva e mercados de cor viva.",
    featured: true,
  },
  {
    slug: "perolas-do-baltico",
    title: "Pérolas do Báltico",
    region: "Europa",
    country: "Estónia",
    price: 1850,
    dates: "26 SET 2026 – 3 OUT 2026",
    durationDays: 8,
    image: img("baltic-tallinn"),
    tagline: "Tallinn, Riga e Vilnius, capitais de conto medieval.",
    featured: true,
  },
  {
    slug: "grande-circuito-brasileiro",
    title: "Grande Circuito Brasileiro",
    region: "América",
    country: "Brasil",
    price: 6300,
    dates: "26 SET 2026 – 7 OUT 2026",
    durationDays: 12,
    image: img("brazil-rio"),
    tagline: "Do Rio às Cataratas do Iguaçu, o Brasil de norte a sul.",
    featured: true,
  },
  {
    slug: "colombia-tesouros",
    title: "Tesouros escondidos da Colômbia",
    region: "América",
    country: "Colômbia",
    price: 5600,
    dates: "3 OUT 2026 – 17 OUT 2026",
    durationDays: 15,
    image: img("colombia-cartagena"),
    tagline: "Cartagena colonial, café e o Caribe colombiano.",
    featured: true,
  },
]

export const regions: Region[] = [
  "África",
  "América",
  "Ásia",
  "Europa",
  "Médio Oriente",
  "Oceânia",
  "Portugal",
]

export const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

export const destinations = [
  "Açores", "África do Sul", "Albânia", "Alemanha", "Argentina", "Arménia",
  "Austrália", "Áustria", "Azerbaijão", "Brasil", "Butão", "Cabo Verde",
  "Canadá", "China", "Chipre", "Colômbia", "Coreia do Sul", "Costa Rica",
  "Croácia", "Cuba", "Egito", "Escócia", "Espanha", "Estados Unidos",
  "Etiópia", "Filipinas", "Finlândia", "França", "Geórgia", "Grécia",
  "Gronelândia", "Guatemala", "Índia", "Indonésia", "Inglaterra", "Islândia",
  "Itália", "Japão", "Jordânia", "Luxemburgo", "Madagáscar", "Madeira",
  "Malásia", "Malta", "Marrocos", "México", "Moçambique", "Mongólia",
  "Montenegro", "Nepal", "Noruega", "Omã", "Panamá", "Paquistão", "Patagónia",
  "Peru", "Portugal", "Quénia", "Quirguistão", "Roménia", "Ruanda",
  "São Tomé", "Senegal", "Sérvia", "Singapura", "Sri Lanka", "Suíça",
  "Tailândia", "Tanzânia", "Tibete", "Timor-Leste", "Turquia", "Uganda",
  "Uzbequistão", "Vietname",
]
