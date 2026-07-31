import { useState } from "react"
import { Trash2, ChevronUp, ChevronDown, Plus, GripVertical } from "lucide-react"
import type { Service } from "../../orcamentos/model"
import { CATEGORIES, UNITS } from "../../orcamentos/model"
import { lineValue, money } from "../../orcamentos/pricing"
import { MoneyPair, Num, Select, Text, handleProps, dropProps, DRAG_ITEM } from "./ui"

// One service line. `patch` mutates this service; move/remove are optional (branches hide move).
// `onReorder` enables drag-and-drop (a grip handle) — passed only for top-level items.
export function ServiceRow({
  s, rate, pax, patch, remove, move, onReorder,
}: {
  s: Service
  rate: number
  pax: number
  patch: (fn: (s: Service) => void) => void
  remove: () => void
  move?: (dir: -1 | 1) => void
  onReorder?: (fromId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const cat = CATEGORIES.find((c) => c.id === s.category)
  const line = lineValue(s, pax)

  return (
    <div className={`rounded-lg border p-2.5 ${s.optional ? "border-dashed border-gold-300 bg-gold-50/40" : "border-border bg-white"}`} {...(onReorder ? dropProps(DRAG_ITEM, onReorder) : {})}>
      <div className="flex flex-wrap items-end gap-2">
        {(onReorder || move) && (
          <div className="mb-0.5 flex flex-col items-center self-center text-muted-foreground/60">
            {onReorder && <span {...handleProps(DRAG_ITEM, s.id)} title="Arrastar para reordenar" className="cursor-grab hover:text-primary active:cursor-grabbing"><GripVertical size={15} /></span>}
            {move && (
              <div className="flex flex-col leading-none">
                <button onClick={() => move(-1)} title="Subir" className="grid h-4 w-5 place-items-center rounded hover:bg-secondary hover:text-primary"><ChevronUp size={13} /></button>
                <button onClick={() => move(1)} title="Descer" className="grid h-4 w-5 place-items-center rounded hover:bg-secondary hover:text-primary"><ChevronDown size={13} /></button>
              </div>
            )}
          </div>
        )}
        <div className="flex min-w-[180px] flex-1 flex-col gap-1">
          <Text value={s.title} onChange={(v) => patch((s) => { s.title = v })} placeholder="Descrição do serviço" />
        </div>
        <Select value={s.category} onChange={(v) => patch((s) => { s.category = v })} options={CATEGORIES.map((c) => ({ id: c.id, label: c.label }))} />
        <Select value={s.unit} onChange={(v) => patch((s) => { s.unit = v })} options={UNITS.map((u) => ({ id: u.id, label: u.label }))} />
        <label className="flex flex-col gap-0.5">
          <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">qtd</span>
          <Num value={s.qty} min={1} onChange={(v) => patch((s) => { s.qty = v })} className="w-16" />
        </label>
        <MoneyPair net={s.net} pvp={s.pvp} rate={rate} onChange={(net, pvp) => patch((s) => { s.net = net; s.pvp = pvp })} />
        <div className="ml-auto flex items-center gap-2">
          <div className="text-right">
            <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">total c/ imp.</div>
            <div className="text-sm font-semibold tabular-nums text-primary">{money(line.pvp)}</div>
          </div>
          <button onClick={remove} title="Remover" className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-red-50 hover:text-destructive"><Trash2 size={14} /></button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-foreground/70">
          <input type="checkbox" checked={!!s.optional} onChange={(e) => patch((s) => { s.optional = e.target.checked })} className="accent-[var(--gold-500)]" />
          Extra (fora do preço base)
        </label>
        <button onClick={() => setOpen((o) => !o)} className="text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline">
          {open ? "Menos" : "Detalhe / fornecedor"}
        </button>
        {cat && (
          <div className="flex flex-wrap gap-1">
            {cat.chips.slice(0, 6).map((c) => (
              <button key={c} onClick={() => patch((s) => { s.title = c })} className="rounded-full border border-border px-2 py-0.5 text-[0.62rem] text-muted-foreground transition hover:border-primary hover:text-primary">
                <Plus size={9} className="mr-0.5 inline" />{c}
              </button>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <Text value={s.description || ""} onChange={(v) => patch((s) => { s.description = v })} placeholder="Descrição / notas (ex.: quarto duplo, regime)" />
          <Text value={s.supplier || ""} onChange={(v) => patch((s) => { s.supplier = v })} placeholder="Fornecedor / referência" />
        </div>
      )}
    </div>
  )
}
