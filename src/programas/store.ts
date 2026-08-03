// One zustand store, persisted to localStorage. Mirrors the orçamentos store.
import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Program } from "./model"
import { newProgram } from "./factory"

interface State {
  programs: Program[]
  currentId: string | null
  create: () => void
  select: (id: string) => void
  duplicate: (id: string) => void
  remove: (id: string) => void
  edit: (fn: (p: Program) => void) => void
  importPrograms: (data: Program | Program[]) => void
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      programs: [],
      currentId: null,
      create: () => {
        const p = newProgram()
        set((s) => ({ programs: [p, ...s.programs], currentId: p.id }))
      },
      select: (id) => set({ currentId: id }),
      duplicate: (id) => {
        const src = get().programs.find((p) => p.id === id)
        if (!src) return
        const copy: Program = { ...structuredClone(src), id: Math.random().toString(36).slice(2, 10), createdAt: Date.now(), updatedAt: Date.now(), title: (src.title || "Programa") + " (cópia)" }
        set((s) => ({ programs: [copy, ...s.programs], currentId: copy.id }))
      },
      remove: (id) =>
        set((s) => {
          const programs = s.programs.filter((p) => p.id !== id)
          return { programs, currentId: s.currentId === id ? (programs[0]?.id ?? null) : s.currentId }
        }),
      edit: (fn) =>
        set((s) => {
          const i = s.programs.findIndex((p) => p.id === s.currentId)
          if (i < 0) return s
          const draft = structuredClone(s.programs[i])
          fn(draft)
          draft.updatedAt = Date.now()
          const programs = s.programs.slice()
          programs[i] = draft
          return { programs }
        }),
      importPrograms: (data) => {
        const arr = (Array.isArray(data) ? data : [data]).filter((p) => p && p.id)
        if (!arr.length) return
        set((s) => ({ programs: [...arr, ...s.programs], currentId: arr[0].id }))
      },
    }),
    { name: "gptur-programas-v1" },
  ),
)
