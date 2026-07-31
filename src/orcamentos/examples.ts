// Exemplos de demonstração — cobrem itinerário vs destino único, as 4 unidades,
// alternativas A/B, extras, datas (dias⇄datas), grupos grandes e taxas por grupo.
import type { Quote, Service, Item, Stage, Branch } from "./model"
import { uid } from "./factory"

const r2 = (n: number) => Math.round((n + 1e-9) * 100) / 100

// builder de serviço com pvp derivado da taxa
function maker(rate: number) {
  return (title: string, net: number, o: Partial<Service> = {}): Service => ({
    kind: "service", id: uid(), title, category: "transporte", unit: "por_pessoa", qty: 1,
    net, pvp: r2(net * (1 + rate)), optional: false, ...o,
  })
}
const alt = (title: string, branches: { label: string; services: Service[] }[]): Item => ({
  kind: "alternative", id: uid(), title, branches: branches.map((b): Branch => ({ id: uid(), label: b.label, services: b.services })),
})
const stage = (place: string, dayStart: number, dayEnd: number, description: string, items: Item[]): Stage => ({ id: uid(), place, dayStart, dayEnd, description, items })

function base(rate: number, extra: Partial<Quote>): Quote {
  return { id: uid(), taxRate: rate, mode: "itinerary", pax: 2, general: [], itinerary: [], createdAt: Date.now(), updatedAt: Date.now(), ...extra }
}

// 1) Lua de mel na Tailândia — itinerário complexo, alternativas, extras, datas
function tailandia(): Quote {
  const s = maker(0.23)
  return base(0.23, {
    title: "Lua de mel na Tailândia", client: "Francisco & Madalena", ref: "ORC-2026-0148", consultant: "Rute", pax: 2,
    validity: "30 dias", startDate: "2026-09-14",
    greeting: "Caros Francisco e Madalena,", intro: "É com muito gosto que apresentamos a proposta para a vossa lua de mel, desenhada ao pormenor para os 18 dias que vão passar na Tailândia.",
    notes: "Preços por pessoa em quarto duplo, salvo indicação. Inclui voos, alojamento, transferes e experiências indicadas. Não inclui despesas de carácter pessoal nem vistos. Sinal de 30% na reserva; restante 30 dias antes da partida.",
    general: [
      s("Voo internacional Lisboa · Banguecoque (ida e volta)", 985, { category: "transporte" }),
      s("Seguro de viagem premium", 68, { category: "seguros" }),
      s("Fee de assessoria e planeamento", 120, { category: "complementares", unit: "por_grupo" }),
    ],
    itinerary: [
      stage("Banguecoque", 1, 4, "Chegada e três noites na capital, entre templos, mercados e a vida noturna de Sukhumvit.", [
        s("Transfer aeroporto · hotel", 45, { category: "transporte", unit: "por_grupo" }),
        s("Hotel 5* centro (3 noites, PA)", 140, { category: "hospedagem", unit: "por_noite", qty: 3, description: "Quarto Deluxe, pequeno-almoço incluído" }),
        s("City tour templos + Grande Palácio", 58, { category: "passeios" }),
      ]),
      stage("Chiang Mai", 5, 8, "Voo para o norte: natureza, cultura e o santuário de elefantes.", [
        s("Voo doméstico BKK · CNX", 92, { category: "transporte" }),
        s("Hotel boutique (3 noites, PA)", 96, { category: "hospedagem", unit: "por_noite", qty: 3 }),
        alt("Experiência a dois", [
          { label: "Opção A", services: [s("Dia no santuário de elefantes", 78, { category: "passeios" })] },
          { label: "Opção B", services: [s("Aula de cozinha tailandesa + mercado", 46, { category: "passeios" })] },
        ]),
      ]),
      stage("Krabi & Ilhas Phi Phi", 9, 18, "Final em cheio à beira-mar: praias de areia branca e passeios de barco pelas ilhas.", [
        s("Voo doméstico CNX · KBV", 112, { category: "transporte" }),
        s("Resort à beira-mar (9 noites, TI)", 195, { category: "hospedagem", unit: "por_noite", qty: 9, description: "Bungalow com acesso à praia, tudo incluído" }),
        s("Passeio de barco às ilhas Phi Phi", 88, { category: "passeios" }),
        s("Jantar romântico privado na praia", 130, { category: "passeios", unit: "por_grupo", optional: true }),
        s("Upgrade suite com vista mar (9 noites)", 60, { category: "hospedagem", unit: "por_noite", qty: 9, optional: true }),
      ]),
    ],
  })
}

// 2) Circuito Itália Clássica em grupo — muitas pessoas, por_grupo, taxas, alternativa
function italiaGrupo(): Quote {
  const s = maker(0.23)
  return base(0.23, {
    title: "Itália Clássica — viagem de grupo", client: "Associação Cultural Lumen", ref: "ORC-2026-0091", consultant: "GPTur", pax: 32,
    validity: "Até 15/07/2026", startDate: "2026-10-03",
    greeting: "Exmos. Senhores,", intro: "Segue a proposta para o circuito clássico por Itália, para o grupo de 32 participantes, de Roma a Veneza.",
    notes: "Base 32 participantes em quarto duplo. Guia acompanhante em português durante todo o circuito. Suplemento de quarto individual sob consulta.",
    general: [
      s("Voo de grupo Lisboa · Roma / Veneza · Lisboa", 215, { category: "transporte" }),
      s("Seguro de grupo", 22, { category: "seguros" }),
      s("Guia acompanhante (todo o circuito)", 1850, { category: "complementares", unit: "por_grupo" }),
      s("Taxa de serviço da agência", 480, { category: "taxas", unit: "por_grupo" }),
    ],
    itinerary: [
      stage("Roma", 1, 3, "Três noites na Cidade Eterna: Coliseu, Vaticano e centro histórico.", [
        s("Autocarro fretado (todo o circuito)", 3200, { category: "transporte", unit: "por_grupo" }),
        s("Hotel 4* (3 noites, PA)", 92, { category: "hospedagem", unit: "por_noite", qty: 3 }),
        s("Visita guiada Vaticano + Capela Sistina", 46, { category: "passeios" }),
        alt("Jantar de boas-vindas", [
          { label: "Opção A", services: [s("Jantar em trattoria típica", 32, { category: "passeios" })] },
          { label: "Opção B", services: [s("Jantar de gala com espetáculo", 68, { category: "passeios" })] },
        ]),
      ]),
      stage("Florença", 4, 5, "A capital da Toscana e do Renascimento.", [
        s("Comboio de alta velocidade Roma · Florença", 39, { category: "transporte" }),
        s("Hotel 4* (2 noites, PA)", 88, { category: "hospedagem", unit: "por_noite", qty: 2 }),
        s("City tour a pé + Galeria Uffizi", 38, { category: "passeios" }),
      ]),
      stage("Veneza", 6, 7, "Duas noites na cidade dos canais.", [
        s("Comboio Florença · Veneza", 44, { category: "transporte" }),
        s("Hotel 4* (2 noites, PA)", 124, { category: "hospedagem", unit: "por_noite", qty: 2 }),
        s("Passeio de gôndola (grupo)", 620, { category: "passeios", unit: "por_grupo" }),
        s("Excursão a Murano e Burano", 42, { category: "passeios", optional: true }),
      ]),
    ],
  })
}

// 3) Escapadela a Sevilha — destino único (flat), simples
function sevilha(): Quote {
  const s = maker(0.23)
  return base(0.23, {
    mode: "flat", title: "Fim de semana em Sevilha", client: "Ana & João", ref: "ORC-2026-0203", consultant: "Rute", pax: 2,
    durationDays: 3, validity: "15 dias",
    greeting: "Olá Ana e João,", intro: "Uma escapadela de três dias a Sevilha, com voos, hotel no centro e uma noite de flamenco.",
    notes: "Preços por pessoa. Taxas de cidade a pagar no hotel.",
    general: [
      s("Voo Lisboa · Sevilha (ida e volta)", 124, { category: "transporte" }),
      s("Hotel 4* centro histórico (2 noites, PA)", 86, { category: "hospedagem", unit: "por_noite", qty: 2 }),
      s("City tour + tablao flamenco", 62, { category: "passeios" }),
      s("Seguro de viagem", 16, { category: "seguros" }),
    ],
  })
}

// 4) Maldivas — estadia (flat) com extra opcional
function maldivas(): Quote {
  const s = maker(0.23)
  return base(0.23, {
    mode: "flat", title: "Maldivas — estadia de sonho", client: "Sr. e Sra. Costa", ref: "ORC-2026-0177", consultant: "GPTur", pax: 2,
    durationDays: 9, validity: "30 dias",
    intro: "Sete noites num resort overwater, em regime de tudo incluído, com transfer de hidroavião.",
    notes: "Bungalow sobre a água. Tudo incluído (refeições e bebidas selecionadas).",
    general: [
      s("Voo internacional Lisboa · Malé", 1450, { category: "transporte" }),
      s("Transfer de hidroavião (ida e volta)", 320, { category: "transporte" }),
      s("Resort overwater (7 noites, TI)", 485, { category: "hospedagem", unit: "por_noite", qty: 7, description: "Water Villa com piscina privada" }),
      s("Seguro premium com cobertura alargada", 95, { category: "seguros" }),
      s("Jantar privado no banco de areia", 260, { category: "passeios", unit: "por_grupo", optional: true }),
    ],
  })
}

export const buildExamples = (): Quote[] => [tailandia(), italiaGrupo(), sevilha(), maldivas()]
