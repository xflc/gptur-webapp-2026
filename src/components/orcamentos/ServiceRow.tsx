import { useState } from "react"
import { Trash2, ChevronUp, ChevronDown, Plus, GripVertical } from "lucide-react"
import type { Service, Unit } from "../../orcamentos/model"
import { CATEGORIES, UNITS } from "../../orcamentos/model"
import { lineValue, money } from "../../orcamentos/pricing"
import { MoneyPair, Text, handleProps, dropProps, DRAG_ITEM } from "./ui"

const chip = "rounded border border-border bg-white px-1.5 py-1 text-xs outline-none focus:border-primary"

// One service line. Layout reads like an invoice row: content left, money right,
// utilities on the edges. `pricing` decides the money zone:
//  - "detalhado": sem/com IVA per service (companies)
//  - "simples": no per-service price (just a description); only an *extra* carries a price
export function ServiceRow({
  s, rate, pax, pricing, patch, remove, move, onReorder,
}: {
  s: Service
  rate: number
  pax: number
  pricing: "simples" | "detalhado"
  patch: (fn: (s: Service) => void) => void
  remove: () => void
  move?: (dir: -1 | 1) => void
  onReorder?: (fromId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const cat = CATEGORIES.find((c) => c.id === s.category)
  const line = lineValue(s, pax)
  const detalhado = pricing === "detalhado"

  const unitQty = (
    <>
      <select value={s.unit} onChange={(e) => patch((s) => { s.unit = e.target.value as Unit })} className={chip}>
        {UNITS.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
      </select>
      <label className="flex items-center gap-1">qtd<input type="number" min={1} value={s.qty} onChange={(e) => patch((s) => { s.qty = parseInt(e.target.value) || 1 })} className={`${chip} w-12`} /></label>
    </>
  )

  return (
    <div className={`rounded-lg border p-2.5 ${s.optional ? "border-dashed border-gold-300 bg-gold-50/40" : "border-border bg-white"}`} {...(onReorder ? dropProps(DRAG_ITEM, onReorder) : {})}>
      <div className="flex items-start gap-2">
        {/* reorder gutter */}
        {(onReorder || move) && (
          <div className="mt-1 flex flex-col items-center text-muted-foreground/60">
            {onReorder && <span {...handleProps(DRAG_ITEM, s.id)} title="Arrastar para reordenar" className="cursor-grab hover:text-primary active:cursor-grabbing"><GripVertical size={15} /></span>}
            {move && (
              <div className="flex flex-col leading-none">
                <button onClick={() => move(-1)} title="Subir" className="grid h-4 w-5 place-items-center rounded hover:bg-secondary hover:text-primary"><ChevronUp size={13} /></button>
                <button onClick={() => move(1)} title="Descer" className="grid h-4 w-5 place-items-center rounded hover:bg-secondary hover:text-primary"><ChevronDown size={13} /></button>
              </div>
            )}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {/* row 1: title · money · delete */}
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1"><Text value={s.title} onChange={(v) => patch((s) => { s.title = v })} placeholder="Descrição do serviço" /></div>

            {detalhado ? (
              <MoneyPair net={s.net} pvp={s.pvp} rate={rate} onChange={(net, pvp) => patch((s) => { s.net = net; s.pvp = pvp })} />
            ) : s.optional ? (
              <label className="flex shrink-0 flex-col gap-0.5">
                <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-gold-600">preço do extra</span>
                <input type="number" step="0.01" min={0} value={s.net || ""} onChange={(e) => { const v = parseFloat(e.target.value) || 0; patch((s) => { s.net = v; s.pvp = v }) }} className="w-24 rounded-md border border-border bg-white px-2 py-1.5 text-right text-sm tabular-nums outline-none focus:border-primary focus:ring-2 focus:ring-teal-100" />
              </label>
            ) : (
              <span className="mt-1.5 shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-[0.62rem] font-medium text-primary">incluído</span>
            )}

            <button onClick={remove} title="Remover" className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded text-muted-foreground hover:bg-red-50 hover:text-destructive"><Trash2 size={14} /></button>
          </div>

          {/* row 2: meta */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            <select value={s.category} onChange={(e) => patch((s) => { s.category = e.target.value })} className={chip}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            {detalhado && <>{unitQty}<span className="font-semibold text-primary">= {money(line.pvp)}</span></>}
            <label className="flex cursor-pointer items-center gap-1.5 text-foreground/70">
              <input type="checkbox" checked={!!s.optional} onChange={(e) => patch((s) => { s.optional = e.target.checked })} className="accent-[var(--gold-500)]" /> Extra
            </label>
            <button onClick={() => setOpen((o) => !o)} className="underline-offset-2 hover:text-primary hover:underline">{open ? "Menos" : "Detalhe"}</button>
          </div>

          {open && (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <Text value={s.description || ""} onChange={(v) => patch((s) => { s.description = v })} placeholder="Descrição / notas (ex.: quarto duplo, 3 noites, regime PA)" />
              <Text value={s.supplier || ""} onChange={(v) => patch((s) => { s.supplier = v })} placeholder="Fornecedor / referência" />
              {!detalhado && <div className="flex items-center gap-2 text-xs text-muted-foreground">{unitQty}</div>}
              {cat && (
                <div className="flex flex-wrap gap-1">
                  {cat.chips.slice(0, 6).map((c) => (
                    <button key={c} onClick={() => patch((s) => { s.title = c })} className="rounded-full border border-border px-2 py-0.5 text-[0.62rem] text-muted-foreground hover:border-primary hover:text-primary"><Plus size={9} className="mr-0.5 inline" />{c}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
