import { useEffect, useRef, useState } from "react"
import { Images, Plus, Copy, Trash2, Download, Upload, Eye, Sparkles, PanelLeftClose, PanelLeftOpen, AlertTriangle } from "lucide-react"
import { useStore } from "../../programas/store"
import { buildExamples } from "../../programas/examples"
import { ProgramEditor } from "./ProgramEditor"

export default function ProgramasApp() {
  const { programs, currentId, create, select, duplicate, remove } = useStore()
  const importPrograms = useStore((s) => s.importPrograms)
  const p = programs.find((x) => x.id === currentId) ?? null
  const fileRef = useRef<HTMLInputElement>(null)
  const [sideOpen, setSideOpen] = useState(true)

  useEffect(() => { if (!currentId && programs.length) select(programs[0].id) }, [currentId, programs, select])

  const exportJSON = () => {
    if (!p) return
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `${(p.title || "programa").replace(/[^\w-]+/g, "-").toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    file.text().then((t) => { try { importPrograms(JSON.parse(t)) } catch { alert("Ficheiro inválido.") } })
    e.target.value = ""
  }

  return (
    <div className="flex min-h-screen bg-cream text-foreground">
      <aside className={`${sideOpen ? "flex w-60" : "hidden"} shrink-0 flex-col border-r border-border bg-white`}>
        <div className="flex items-center gap-2 border-b border-border px-4 py-3.5">
          <Images size={18} className="text-primary" />
          <span className="font-display text-lg text-ink">Programas</span>
          <button onClick={() => setSideOpen(false)} title="Ocultar lista" className="ml-auto grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary"><PanelLeftClose size={18} /></button>
        </div>
        <div className="space-y-2 p-3">
          <button onClick={create} className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary py-2 text-sm font-semibold text-white transition hover:bg-teal-700"><Plus size={15} /> Novo</button>
          <button onClick={() => importPrograms(buildExamples())} title="Importa programas de demonstração" className="flex w-full items-center justify-center gap-1.5 rounded-md border border-border py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary"><Sparkles size={13} /> Carregar exemplos</button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto px-2">
          {programs.length === 0 && <p className="px-2 py-6 text-center text-xs text-muted-foreground">Sem programas ainda.</p>}
          {programs.map((x) => (
            <button key={x.id} onClick={() => select(x.id)} className={`group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition ${x.id === currentId ? "bg-primary/10 text-primary" : "hover:bg-secondary"}`}>
              <span className="min-w-0 flex-1 truncate">{x.title?.trim() || "Sem título"}</span>
              {!x.hero && <AlertTriangle size={13} className="shrink-0 text-gold-500" />}
            </button>
          ))}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-border bg-white px-4 py-2.5">
          {!sideOpen && <button onClick={() => setSideOpen(true)} title="Mostrar lista" className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary"><PanelLeftOpen size={18} /></button>}
          {p ? (
            <>
              <h2 className="min-w-0 flex-1 truncate font-display text-xl text-ink">{p.title?.trim() || "Novo programa"}</h2>
              <button onClick={() => window.open(`/programas/ver?id=${p.id}`, "_blank")} disabled={!p.hero} title={p.hero ? "Pré-visualizar" : "Falta a foto do hero"} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-40"><Eye size={15} /> Ver programa</button>
              <button onClick={() => duplicate(p.id)} title="Duplicar" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary"><Copy size={16} /></button>
              <button onClick={exportJSON} title="Exportar JSON" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary"><Download size={16} /></button>
              <button onClick={() => fileRef.current?.click()} title="Importar JSON" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary"><Upload size={16} /></button>
              <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImport} />
              <button onClick={() => { if (confirm("Eliminar este programa?")) remove(p.id) }} title="Eliminar" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-destructive"><Trash2 size={16} /></button>
            </>
          ) : <span className="font-display text-xl text-ink">Programas</span>}
        </header>
        {p ? (
          <div className="flex-1 overflow-y-auto p-5"><ProgramEditor p={p} /></div>
        ) : (
          <div className="grid flex-1 place-items-center text-center">
            <div>
              <p className="text-muted-foreground">Nenhum programa selecionado.</p>
              <button onClick={create} className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"><Plus size={15} /> Criar programa</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
