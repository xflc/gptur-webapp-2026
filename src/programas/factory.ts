import type { Program, Day } from "./model"

export const uid = () => Math.random().toString(36).slice(2, 10)

export const newDay = (title = ""): Day => ({ id: uid(), title, body: "" })

export const newProgram = (): Program => ({
  id: uid(),
  title: "", destino: "", country: "", region: "Europa", type: "circuito",
  tagline: "", overview: "", hero: "",
  nights: undefined, priceFrom: undefined,
  days: [newDay("1º Dia")],
  included: "", notIncluded: "", notes: "",
  groupTrip: false, departureStart: undefined, departureEnd: undefined, spots: undefined,
  createdAt: Date.now(), updatedAt: Date.now(),
})

export function removeDay(p: Program, id: string) {
  p.days = p.days.filter((d) => d.id !== id)
}
export function moveDay(p: Program, id: string, dir: -1 | 1) {
  const i = p.days.findIndex((d) => d.id === id)
  const j = i + dir
  if (i < 0 || j < 0 || j >= p.days.length) return
  ;[p.days[i], p.days[j]] = [p.days[j], p.days[i]]
}
export function reorderDay(p: Program, fromId: string, toId: string) {
  if (fromId === toId) return
  const from = p.days.findIndex((d) => d.id === fromId)
  const to = p.days.findIndex((d) => d.id === toId)
  if (from < 0 || to < 0) return
  const [m] = p.days.splice(from, 1)
  p.days.splice(to, 0, m)
}
