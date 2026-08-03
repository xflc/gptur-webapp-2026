import type { Program } from "./model"
import { uid, newDay } from "./factory"

const day = (title: string, body: string) => ({ ...newDay(title), body })

export const buildExamples = (): Program[] => [
  {
    id: uid(),
    title: "Tailândia Essencial",
    destino: "Banguecoque · Chiang Mai · Krabi",
    country: "Tailândia",
    region: "Ásia",
    type: "circuito",
    tagline: "Templos dourados, elefantes e as praias do Andamão",
    overview:
      "Um roteiro completo pelo melhor da Tailândia: a energia de Banguecoque, a cultura do norte em Chiang Mai e o descanso final nas ilhas do sul. Um equilíbrio perfeito entre cultura, natureza e praia.",
    hero: "/honeymoons/tailandia/1.jpg",
    heroW: 1600, heroH: 1200,
    nights: 10, priceFrom: 1890,
    days: [
      day("1º Dia · Lisboa / Banguecoque", "Partida em voo com destino a Banguecoque. Noite a bordo."),
      day("2º ao 4º Dia · Banguecoque", "Chegada e visita à capital: o Grande Palácio, o Wat Pho e os mercados. Dias para explorar a cidade ao seu ritmo."),
      day("5º ao 7º Dia · Chiang Mai", "Voo para o norte. Santuário ético de elefantes, templos na montanha e a vida tranquila do norte tailandês."),
      day("8º ao 11º Dia · Krabi e ilhas", "Transfer para o sul. Praias de areia branca, passeios de barco pelas ilhas Phi Phi e tempo para relaxar."),
      day("12º Dia · Regresso", "Transfer para o aeroporto e voo de regresso a Lisboa."),
    ],
    included: "Voos internacionais e domésticos\nAlojamento em quarto duplo\nPequenos-almoços\nTransferes e passeios indicados\nGuia local em português",
    notIncluded: "Refeições não mencionadas\nDespesas de carácter pessoal\nVistos e taxas\nSeguro de viagem",
    notes: "Preços por pessoa em quarto duplo. Datas de partida e disponibilidade sob consulta.",
    createdAt: Date.now(), updatedAt: Date.now(),
  },
  {
    id: uid(),
    title: "Austrália Selvagem",
    destino: "Sydney · Uluru · Great Barrier Reef",
    country: "Austrália",
    region: "Oceânia",
    type: "circuito",
    tagline: "Da ópera de Sydney ao coração vermelho do outback",
    overview:
      "Uma grande viagem pela Austrália, do cosmopolitismo de Sydney à imensidão do deserto central e à vida marinha da Grande Barreira de Coral. Natureza em estado puro, à escala de um continente.",
    hero: "/destinos/belezas-da-australia.jpg",
    heroW: 1920, heroH: 1080,
    nights: 13, priceFrom: 4250,
    days: [
      day("1º ao 4º Dia · Sydney", "Chegada e descoberta de Sydney: a Ópera, a ponte do porto e as praias de Bondi."),
      day("5º ao 7º Dia · Uluru", "Voo para o centro vermelho. O nascer do sol sobre Uluru e a cultura aborígene."),
      day("8º ao 13º Dia · Cairns e Grande Barreira", "A norte tropical: floresta de Daintree e mergulho na Grande Barreira de Coral."),
      day("14º Dia · Regresso", "Voo de regresso a Portugal."),
    ],
    included: "Voos internacionais e domésticos\nAlojamento\nExcursões indicadas\nEntradas nos parques nacionais",
    notIncluded: "Refeições não indicadas\nAtividades opcionais\nVisto eletrónico (ETA)",
    notes: "Programa indicativo. Sujeito a confirmação de espaço aéreo e disponibilidade.",
    createdAt: Date.now(), updatedAt: Date.now(),
  },
]
