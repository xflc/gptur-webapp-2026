// One zustand store, persisted to localStorage. Mutations go through edit(fn):
// structuredClone the current quote → mutate draft → bump updatedAt → write back.
import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Quote } from "./model"
import { newQuote } from "./factory"

interface State {
  quotes: Quote[]
  currentId: string | null
  // actions
  create: () => void
  select: (id: string) => void
  duplicate: (id: string) => void
  remove: (id: string) => void
  edit: (fn: (q: Quote) => void) => void
  importQuotes: (data: Quote | Quote[]) => void
  current: () => Quote | null
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      quotes: [],
      currentId: null,

      create: () => {
        const q = newQuote()
        set((s) => ({ quotes: [q, ...s.quotes], currentId: q.id }))
      },
      select: (id) => set({ currentId: id }),
      duplicate: (id) => {
        const src = get().quotes.find((q) => q.id === id)
        if (!src) return
        const copy: Quote = { ...structuredClone(src), id: crypto.randomUUID().slice(0, 8), createdAt: Date.now(), updatedAt: Date.now(), title: (src.title || "Orçamento") + " (cópia)" }
        set((s) => ({ quotes: [copy, ...s.quotes], currentId: copy.id }))
      },
      remove: (id) =>
        set((s) => {
          const quotes = s.quotes.filter((q) => q.id !== id)
          return { quotes, currentId: s.currentId === id ? (quotes[0]?.id ?? null) : s.currentId }
        }),
      edit: (fn) =>
        set((s) => {
          const i = s.quotes.findIndex((q) => q.id === s.currentId)
          if (i < 0) return s
          const draft = structuredClone(s.quotes[i])
          fn(draft)
          draft.updatedAt = Date.now()
          const quotes = s.quotes.slice()
          quotes[i] = draft
          return { quotes }
        }),
      importQuotes: (data) => {
        const arr = (Array.isArray(data) ? data : [data]).filter((q) => q && q.id)
        if (!arr.length) return
        set((s) => ({ quotes: [...arr, ...s.quotes], currentId: arr[0].id }))
      },
      current: () => {
        const s = get()
        return s.quotes.find((q) => q.id === s.currentId) ?? null
      },
    }),
    { name: "gptur-orcamentos-v4" },
  ),
)
