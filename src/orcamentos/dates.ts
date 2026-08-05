// Datas puras (yyyy-mm-dd), sem horas nem fusos. O "Dia N" deriva das datas por
// etapa (Dia 1 = data de partida, ou a mais cedo do itinerário) e pode ser
// sobreposto manualmente (st.dayStart/dayEnd) apesar do cálculo.
// Ancoramos em UTC só para a aritmética de dias ser exata; nunca há horas.
import type { Quote, Stage } from "./model"

const parse = (iso?: string) => {
  const m = iso && /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null
}
const toISO = (d: Date) => d.toISOString().slice(0, 10)

export function tripStartISO(q: Quote): string | undefined {
  if (q.startDate) return q.startDate
  const ds = q.itinerary.map((s) => s.dateStart).filter(Boolean).sort() as string[]
  return ds[0]
}

export function dayFromDate(q: Quote, dateStr?: string): number | undefined {
  const a = parse(tripStartISO(q)), b = parse(dateStr)
  if (!a || !b) return undefined
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1
}

export function dateFromDay(q: Quote, day?: number): string | undefined {
  const a = parse(tripStartISO(q))
  if (!a || !day) return undefined
  a.setUTCDate(a.getUTCDate() + (day - 1))
  return toISO(a)
}

// dia efetivo: override manual se existir, senão calculado a partir da data
export function stageDayRange(q: Quote, st: Stage): { ds?: number; de?: number } {
  const ds = st.dayStart ?? dayFromDate(q, st.dateStart)
  const de = st.dayEnd ?? dayFromDate(q, st.dateEnd) ?? ds
  return { ds, de }
}

// datas efetivas: a data se existir, senão derivada do dia + partida (dados antigos)
export function stageDateRange(q: Quote, st: Stage): { start?: string; end?: string } {
  return {
    start: st.dateStart || dateFromDay(q, st.dayStart),
    end: st.dateEnd || dateFromDay(q, st.dayEnd),
  }
}

export const fmtDate = (iso?: string) => {
  const d = parse(iso)
  return d ? d.toLocaleDateString("pt-PT", { day: "numeric", month: "long", timeZone: "UTC" }) : null
}
