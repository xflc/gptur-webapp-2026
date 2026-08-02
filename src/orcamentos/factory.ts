// Factory helpers: fresh nodes + a tree walker so update/remove/move work at any depth.
import type { Quote, Service, Alternative, Stage, Branch, Item, Unit } from "./model"

export const uid = () => Math.random().toString(36).slice(2, 10)

export const newService = (o: Partial<Service> = {}): Service => ({
  kind: "service", id: uid(), title: "", category: "transporte",
  unit: "por_pessoa", qty: 1, net: 0, pvp: 0, optional: false, ...o,
})

export const newBranch = (label?: string): Branch => ({ id: uid(), label, services: [newService()] })

export const newAlternative = (): Alternative => ({
  kind: "alternative", id: uid(), title: "", branches: [newBranch("Opção A"), newBranch("Opção B")],
})

export const newStage = (): Stage => ({ id: uid(), place: "", items: [] })

export const newQuote = (): Quote => ({
  id: uid(), taxRate: 0.23, mode: "itinerary", pricing: "simples", finalPrice: 0,
  title: "", client: "", ref: "", consultant: "", pax: 2,
  validity: "", startDate: "", greeting: "", intro: "", notes: "",
  general: [], itinerary: [newStage()],
  createdAt: Date.now(), updatedAt: Date.now(),
})

// auto label "Opção A/B/…" when a branch has none
export const branchLabel = (b: Branch, i: number) => b.label?.trim() || `Opção ${String.fromCharCode(65 + i)}`

// --- tree walker: every editable node lives in general, a stage's items, or a branch's services ---
type Node = Item | Stage | Branch

export function updateService(q: Quote, id: string, fn: (s: Service) => void) {
  eachService(q, (s) => { if (s.id === id) fn(s) })
}

export function eachService(q: Quote, fn: (s: Service) => void) {
  const walkItems = (items: Item[]) => items.forEach((it) => {
    if (it.kind === "service") fn(it)
    else it.branches.forEach((b) => b.services.forEach(fn))
  })
  walkItems(q.general)
  q.itinerary.forEach((st) => walkItems(st.items))
}

// remove any node (item / stage / branch / service) by id, in place
export function removeById(q: Quote, id: string) {
  q.general = q.general.filter((it) => !dropItem(it, id))
  q.itinerary = q.itinerary.filter((st) => st.id !== id)
  q.itinerary.forEach((st) => { st.items = st.items.filter((it) => !dropItem(it, id)) })
}
function dropItem(it: Item, id: string): boolean {
  if (it.id === id) return true
  if (it.kind === "alternative") {
    it.branches = it.branches.filter((b) => b.id !== id)
    it.branches.forEach((b) => { b.services = b.services.filter((s) => s.id !== id) })
  }
  return false
}

// move an item ±1 within its list (general or a stage)
export function moveItem(q: Quote, id: string, dir: -1 | 1) {
  const lists: Item[][] = [q.general, ...q.itinerary.map((s) => s.items)]
  for (const list of lists) {
    const i = list.findIndex((it) => it.id === id)
    if (i < 0) continue
    const j = i + dir
    if (j < 0 || j >= list.length) return
    ;[list[i], list[j]] = [list[j], list[i]]
    return
  }
}

export function moveStage(q: Quote, id: string, dir: -1 | 1) {
  const i = q.itinerary.findIndex((s) => s.id === id)
  const j = i + dir
  if (i < 0 || j < 0 || j >= q.itinerary.length) return
  ;[q.itinerary[i], q.itinerary[j]] = [q.itinerary[j], q.itinerary[i]]
}

// drag-and-drop: mover fromId para a posição de toId (dentro da mesma lista)
export function reorderItem(q: Quote, fromId: string, toId: string) {
  if (fromId === toId) return
  for (const list of [q.general, ...q.itinerary.map((s) => s.items)]) {
    const from = list.findIndex((i) => i.id === fromId)
    const to = list.findIndex((i) => i.id === toId)
    if (from < 0 || to < 0) continue
    const [m] = list.splice(from, 1)
    list.splice(to, 0, m)
    return
  }
}

export function reorderStage(q: Quote, fromId: string, toId: string) {
  if (fromId === toId) return
  const from = q.itinerary.findIndex((s) => s.id === fromId)
  const to = q.itinerary.findIndex((s) => s.id === toId)
  if (from < 0 || to < 0) return
  const [m] = q.itinerary.splice(from, 1)
  q.itinerary.splice(to, 0, m)
}
