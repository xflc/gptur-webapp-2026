export type Region =
  | "África"
  | "América"
  | "Ásia"
  | "Europa"
  | "Médio Oriente"
  | "Oceânia"
  | "Portugal"

export interface ItineraryDay {
  day: string
  route: string
  body: string
}

export interface TripDetails {
  groupTravel?: boolean
  meals?: string
  overview: string[]
  highlights?: string[]
  otherDates?: string[]
  itinerary: ItineraryDay[]
  included: string[]
  notIncluded?: string[]
  notes?: string[]
  documentation?: string[]
  gallery?: string[]
}

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
  details?: TripDetails
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
    details: {
      groupTravel: true,
      meals: "Pensão completa · 24 refeições",
      overview: [
        "Da capital imperial às margens do Rio Li, a China Clássica reúne num só circuito os grandes ícones de uma civilização com mais de cinco mil anos. Caminhe sobre a Grande Muralha, encare o exército de guerreiros de terracota e deixe-se surpreender pelo contraste entre a Pequim milenar e a Xangai do futuro.",
        "Uma viagem em grupo com guia em português durante todo o percurso, pensada para quem quer compreender a China — a sua história, a sua espiritualidade e a energia das suas cidades — sem abdicar do conforto.",
      ],
      highlights: [
        "Grande Muralha em Mutianyu, o troço mais espetacular e menos concorrido",
        "Guerreiros de terracota de Xi'an, Património da Humanidade",
        "Cruzeiro pelo Rio Li, entre os picos cársicos de Guilin",
        "Cidade Proibida e Praça de Tiananmen, o coração de Pequim",
        "O Bund e os jardins clássicos de Xangai",
      ],
      otherDates: [
        "16 a 26 de setembro de 2026",
        "14 a 24 de outubro de 2026",
        "8 a 18 de abril de 2027",
      ],
      itinerary: [
        {
          day: "1º Dia",
          route: "Lisboa ou Porto (avião) – Pequim",
          body: "Comparência no aeroporto para embarque em voo com destino a Pequim. Refeições e noite a bordo.",
        },
        {
          day: "2º Dia",
          route: "Pequim",
          body: "Chegada a Pequim, capital da China. Receção pelo nosso guia e transfer para o hotel. Restante dia livre para uma primeira aproximação à cidade. Jantar e alojamento.",
        },
        {
          day: "3º Dia",
          route: "Pequim",
          body: "Dia dedicado ao coração imperial: a imensa Praça de Tiananmen e a Cidade Proibida, palácio dos imperadores das dinastias Ming e Qing. À tarde, o Templo do Céu, obra-prima da arquitetura religiosa, rodeado do seu parque. Almoço e jantar incluídos.",
        },
        {
          day: "4º Dia",
          route: "Pequim – Grande Muralha – Palácio de Verão",
          body: "Excursão à Grande Muralha, no troço de Mutianyu, onde a subida de teleférico revela panorâmicas inesquecíveis. Regresso a Pequim com visita ao Palácio de Verão, residência estival da corte, à beira do Lago Kunming. Almoço e jantar.",
        },
        {
          day: "5º Dia",
          route: "Pequim – Xi'an (comboio de alta velocidade)",
          body: "Manhã livre e viagem em comboio de alta velocidade até Xi'an, antiga capital e ponto de partida da Rota da Seda. Passeio pelo Bairro Muçulmano. Alojamento.",
        },
        {
          day: "6º Dia",
          route: "Xi'an",
          body: "Visita ao exército de guerreiros de terracota, milhares de figuras que velavam o túmulo do primeiro imperador. À tarde, subida às muralhas Ming e visita à Pequena Pagoda do Ganso Selvagem. Almoço e jantar.",
        },
        {
          day: "7º Dia",
          route: "Xi'an – Guilin (avião)",
          body: "Voo para Guilin, na região de paisagens cársicas mais célebre da China. Tempo para passear junto aos lagos e às colinas que emolduram a cidade. Alojamento.",
        },
        {
          day: "8º Dia",
          route: "Guilin – Cruzeiro no Rio Li – Yangshuo",
          body: "Cruzeiro pelo Rio Li até Yangshuo, entre pães-de-açúcar verdejantes, campos de arroz e aldeias de pescadores — a paisagem que inspirou séculos de pintura chinesa. Almoço a bordo. Alojamento.",
        },
        {
          day: "9º Dia",
          route: "Guilin – Xangai (avião)",
          body: "Voo para Xangai, a metrópole mais cosmopolita da China. Primeiro contacto com o Bund e a sua marginal histórica, frente à silhueta futurista de Pudong. Jantar e alojamento.",
        },
        {
          day: "10º Dia",
          route: "Xangai",
          body: "Visita ao Jardim Yuyuan, ao Templo do Buda de Jade e à Cidade Antiga. Tarde livre para compras na Nanjing Road ou passeio pela zona da antiga Concessão Francesa. Alojamento.",
        },
        {
          day: "11º Dia",
          route: "Xangai (avião) – Lisboa ou Porto",
          body: "Em hora a combinar, transfer ao aeroporto para embarque em voo de regresso a Portugal. Fim da viagem e dos nossos serviços.",
        },
      ],
      included: [
        "Passagem aérea em classe económica, com taxas incluídas",
        "Comboio de alta velocidade Pequim–Xi'an e voos domésticos",
        "Alojamento em hotéis 4* e 5* em quarto duplo",
        "Regime de pensão completa (24 refeições)",
        "Guia acompanhante em português durante todo o circuito",
        "Guias locais e todas as entradas mencionadas no programa",
        "Seguro de viagem",
      ],
      notIncluded: [
        "Vistos e taxas consulares",
        "Bebidas às refeições e despesas de caráter pessoal",
        "Gorjetas a guias e motoristas",
        "Excursões e atividades assinaladas como opcionais",
      ],
      notes: [
        "Programa sujeito a alterações de ordem operacional, mantendo-se o conteúdo das visitas.",
        "Preço por pessoa em quarto duplo. Suplemento de quarto individual sob consulta.",
        "Poderão existir pequenas diferenças entre os programas de cada partida.",
      ],
      documentation: [
        "Passaporte com validade mínima de 6 meses após a data de regresso.",
        "Visto de entrada na China obrigatório para cidadãos portugueses (tratado pela agência mediante procuração).",
        "Recomenda-se consultar o Centro de Vacinação Internacional antes da partida.",
      ],
      gallery: [
        img("china-greatwall"),
        img("china-terracotta-xian"),
        img("china-liriver-guilin"),
        img("china-shanghai-bund"),
      ],
    },
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
