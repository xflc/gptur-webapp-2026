import { useEffect, useRef, useState } from "react"
import { FileText, Plus, Copy, Trash2, Download, Upload, Lock, LogOut, FileDown, Sparkles } from "lucide-react"
import { useStore } from "../../orcamentos/store"
import { quoteTotals, money } from "../../orcamentos/pricing"
import { buildExamples } from "../../orcamentos/examples"
import { Editor } from "./Editor"

// Deliberately-insecure client-side gate (BLUEPRINT §7). Theatre, not real security.
const ACCESS_CODE = "gptur1979"
const AUTH_KEY = "gptur-orcamentos-auth"

export default function OrcamentosApp() {
  const [authed, setAuthed] = useState(false)
  useEffect(() => { setAuthed(sessionStorage.getItem(AUTH_KEY) === "1") }, [])
  if (!authed) return <Login onOk={() => setAuthed(true)} />
  return <Shell onLogout={() => { sessionStorage.removeItem(AUTH_KEY); setAuthed(false) }} />
}

function Login({ onOk }: { onOk: () => void }) {
  const [code, setCode] = useState("")
  const [err, setErr] = useState(false)
  const submit = () => {
    if (code === ACCESS_CODE) { sessionStorage.setItem(AUTH_KEY, "1"); onOk() } else setErr(true)
  }
  return (
    <div className="grid min-h-screen place-items-center bg-ink px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary"><Lock size={22} /></span>
          <h1 className="mt-3 font-display text-2xl text-ink">Orçamentos GPTur</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ferramenta interna. Introduza o código de acesso.</p>
        </div>
        <input
          type="password" autoFocus value={code} placeholder="Código de acesso"
          onChange={(e) => { setCode(e.target.value); setErr(false) }} onKeyDown={(e) => e.key === "Enter" && submit()}
          className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 ${err ? "border-destructive focus:ring-red-100" : "border-border focus:border-primary focus:ring-teal-100"}`}
        />
        {err && <p className="mt-1.5 text-xs text-destructive">Código incorreto.</p>}
        <button onClick={submit} className="mt-4 w-full rounded-md bg-primary py-2 text-sm font-semibold text-white transition hover:bg-teal-700">Entrar</button>
      </div>
    </div>
  )
}

function Shell({ onLogout }: { onLogout: () => void }) {
  const { quotes, currentId, create, select, duplicate, remove } = useStore()
  const importQuotes = useStore((s) => s.importQuotes)
  const q = quotes.find((x) => x.id === currentId) ?? null
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (!currentId && quotes.length) select(quotes[0].id) }, [currentId, quotes, select])

  const exportJSON = () => {
    if (!q) return
    const blob = new Blob([JSON.stringify(q, null, 2)], { type: "application/json" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `${(q.ref || q.title || "orcamento").replace(/[^\w-]+/g, "-")}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    file.text().then((t) => { try { importQuotes(JSON.parse(t)) } catch { alert("Ficheiro inválido.") } })
    e.target.value = ""
  }

  return (
    <div className="flex min-h-screen bg-cream text-foreground">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-white">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3.5">
          <FileText size={18} className="text-primary" />
          <span className="font-display text-lg text-ink">Orçamentos</span>
        </div>
        <div className="space-y-2 p-3">
          <button onClick={create} className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary py-2 text-sm font-semibold text-white transition hover:bg-teal-700"><Plus size={15} /> Novo</button>
          <button onClick={() => importQuotes(buildExamples())} title="Importa 4 orçamentos de demonstração" className="flex w-full items-center justify-center gap-1.5 rounded-md border border-border py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary"><Sparkles size={13} /> Carregar exemplos</button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto px-2">
          {quotes.length === 0 && <p className="px-2 py-6 text-center text-xs text-muted-foreground">Sem orçamentos ainda.</p>}
          {quotes.map((x) => (
            <button key={x.id} onClick={() => select(x.id)} className={`group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition ${x.id === currentId ? "bg-primary/10 text-primary" : "hover:bg-secondary"}`}>
              <span className="min-w-0 flex-1 truncate">{x.title?.trim() || x.client?.trim() || "Sem título"}</span>
            </button>
          ))}
        </div>
        <div className="border-t border-border p-3">
          <button onClick={onLogout} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"><LogOut size={13} /> Sair</button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col">
        {q ? (
          <>
            <header className="flex items-center gap-2 border-b border-border bg-white px-5 py-2.5">
              <h2 className="min-w-0 flex-1 truncate font-display text-xl text-ink">{q.title?.trim() || "Novo orçamento"}</h2>
              <button onClick={() => window.open(`/orcamentos/imprimir?id=${q.id}`, "_blank")} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-teal-700"><FileDown size={15} /> Gerar PDF</button>
              <button onClick={() => duplicate(q.id)} title="Duplicar" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary"><Copy size={16} /></button>
              <button onClick={exportJSON} title="Exportar JSON" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary"><Download size={16} /></button>
              <button onClick={() => fileRef.current?.click()} title="Importar JSON" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary"><Upload size={16} /></button>
              <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImport} />
              <button onClick={() => { if (confirm("Eliminar este orçamento?")) remove(q.id) }} title="Eliminar" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-destructive"><Trash2 size={16} /></button>
            </header>
            <div className="flex-1 overflow-y-auto p-5"><Editor q={q} /></div>
            <TotalsBar q={q} />
          </>
        ) : (
          <div className="grid flex-1 place-items-center text-center">
            <div>
              <p className="text-muted-foreground">Nenhum orçamento selecionado.</p>
              <button onClick={create} className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"><Plus size={15} /> Criar orçamento</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function TotalsBar({ q }: { q: ReturnType<typeof useStore.getState>["quotes"][number] }) {
  const t = quoteTotals(q)
  return (
    <footer className="flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-border bg-white px-5 py-3">
      <Stat label="Base sem impostos" value={money(t.baseNet)} />
      <Stat label="Base com impostos" value={money(t.basePvp)} big />
      <Stat label={`Por pessoa (${t.pax}) c/ imp.`} value={money(t.perPaxPvp)} />
      {t.extrasNet > 0 && <Stat label="Extras c/ imp." value={money(t.extrasPvp)} gold />}
      <div className="ml-auto text-xs text-muted-foreground">IVA {Math.round(t.rate * 100)}%</div>
    </footer>
  )
}
function Stat({ label, value, big, gold }: { label: string; value: string; big?: boolean; gold?: boolean }) {
  return (
    <div>
      <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-semibold tabular-nums ${big ? "text-lg text-primary" : gold ? "text-gold-600" : "text-foreground"}`}>{value}</div>
    </div>
  )
}
