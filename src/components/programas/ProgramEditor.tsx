import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical, CalendarDays } from "lucide-react"
import type { Program, Day } from "../../programas/model"
import { REGIONS } from "../../programas/model"
import { newDay, removeDay, moveDay, reorderDay } from "../../programas/factory"
import { useStore } from "../../programas/store"
import { Field, Text, Num, Select, Btn, handleProps, dropProps } from "../orcamentos/ui"
import { ImageField } from "./ImageField"

const DRAG_DAY = "application/x-prog-day"
const area = "min-h-20 w-full rounded-md border border-border bg-white px-2.5 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-teal-100"

export function ProgramEditor({ p }: { p: Program }) {
  const edit = useStore((s) => s.edit)

  return (
    <div className="space-y-6">
      {/* Hero photo */}
      <section className="rounded-xl border border-border bg-white p-4">
        <h3 className="mb-3 font-display text-lg text-ink">Foto principal (hero)</h3>
        <ImageField
          hero={p.hero} heroW={p.heroW} heroH={p.heroH}
          onChange={(url, w, h) => edit((p) => { p.hero = url; p.heroW = w; p.heroH = h })}
          onClear={() => edit((p) => { p.hero = ""; p.heroW = undefined; p.heroH = undefined })}
        />
      </section>

      {/* Framing */}
      <section className="rounded-xl border border-border bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Título" className="sm:col-span-2"><Text value={p.title} onChange={(v) => edit((p) => { p.title = v })} placeholder="Japão Medieval" /></Field>
          <Field label="Destino"><Text value={p.destino} onChange={(v) => edit((p) => { p.destino = v })} placeholder="Tóquio · Quioto · Osaka" /></Field>
          <Field label="País"><Text value={p.country} onChange={(v) => edit((p) => { p.country = v })} placeholder="Japão" /></Field>
          <Field label="Região"><Select value={p.region} onChange={(v) => edit((p) => { p.region = v })} options={REGIONS.map((r) => ({ id: r, label: r }))} /></Field>
          <Field label="Tipo"><Select value={p.type} onChange={(v) => edit((p) => { p.type = v })} options={[{ id: "circuito", label: "Roteiro / circuito" }, { id: "estadia", label: "Estadia / destino único" }]} /></Field>
          <Field label="Nº de noites"><Num value={p.nights || 0} min={0} onChange={(v) => edit((p) => { p.nights = v || undefined })} /></Field>
          <Field label="Desde (€ p/ pessoa)"><Num value={p.priceFrom || 0} min={0} onChange={(v) => edit((p) => { p.priceFrom = v || undefined })} /></Field>
          <Field label="Subtítulo" className="sm:col-span-2 lg:col-span-4"><Text value={p.tagline} onChange={(v) => edit((p) => { p.tagline = v })} placeholder="Templos milenares, jardins zen e a energia de Tóquio" /></Field>
        </div>
        <Field label="Descrição / apresentação" className="mt-3">
          <textarea className={area} value={p.overview} onChange={(e) => edit((p) => { p.overview = e.target.value })} placeholder="Uma viagem pelo Japão clássico, de..." />
        </Field>
      </section>

      {/* Program days */}
      <section className="rounded-xl border border-border bg-secondary/40 p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary"><CalendarDays size={16} /></span>
          <div><h3 className="font-display text-lg leading-none text-ink">Programa</h3><p className="mt-0.5 text-xs text-muted-foreground">Dia a dia da viagem</p></div>
        </div>
        <div className="space-y-2">
          {p.days.map((d, i) => (
            <DayRow key={d.id} d={d} idx={i} count={p.days.length} />
          ))}
        </div>
        <div className="mt-2"><Btn onClick={() => edit((p) => p.days.push(newDay(`${p.days.length + 1}º Dia`)))}><Plus size={14} /> Adicionar dia</Btn></div>
      </section>

      {/* Includes / excludes */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-white p-4">
          <Field label="Inclui (um por linha)"><textarea className={area} value={p.included} onChange={(e) => edit((p) => { p.included = e.target.value })} placeholder={"Voos internacionais\nAlojamento em quarto duplo\nGuia local em português"} /></Field>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <Field label="Não inclui (um por linha)"><textarea className={area} value={p.notIncluded} onChange={(e) => edit((p) => { p.notIncluded = e.target.value })} placeholder={"Refeições não indicadas\nDespesas de carácter pessoal\nVistos"} /></Field>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-white p-4">
        <Field label="Notas / condições"><textarea className={area} value={p.notes} onChange={(e) => edit((p) => { p.notes = e.target.value })} placeholder="Preços por pessoa. Datas de partida sob consulta." /></Field>
      </section>
    </div>
  )
}

function DayRow({ d, idx, count }: { d: Day; idx: number; count: number }) {
  const edit = useStore((s) => s.edit)
  const patch = (fn: (d: Day) => void) => edit((p) => { const x = p.days.find((y) => y.id === d.id); if (x) fn(x) })
  return (
    <div className="rounded-lg border border-border bg-white p-2.5" {...dropProps(DRAG_DAY, (from) => edit((p) => reorderDay(p, from, d.id)))}>
      <div className="flex items-start gap-2">
        <div className="mt-1 flex flex-col items-center text-muted-foreground/60">
          <span {...handleProps(DRAG_DAY, d.id)} title="Arrastar" className="cursor-grab hover:text-primary active:cursor-grabbing"><GripVertical size={15} /></span>
          <div className="flex flex-col leading-none">
            <button onClick={() => edit((p) => moveDay(p, d.id, -1))} disabled={idx === 0} className="grid h-4 w-5 place-items-center rounded hover:bg-secondary hover:text-primary disabled:opacity-30"><ChevronUp size={13} /></button>
            <button onClick={() => edit((p) => moveDay(p, d.id, 1))} disabled={idx === count - 1} className="grid h-4 w-5 place-items-center rounded hover:bg-secondary hover:text-primary disabled:opacity-30"><ChevronDown size={13} /></button>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Text value={d.title} onChange={(v) => patch((d) => { d.title = v })} placeholder={`${idx + 1}º Dia · Local`} className="font-medium" />
            <button onClick={() => edit((p) => removeDay(p, d.id))} title="Remover dia" className="grid h-7 w-7 shrink-0 place-items-center rounded text-muted-foreground hover:bg-red-50 hover:text-destructive"><Trash2 size={14} /></button>
          </div>
          <textarea className={area} value={d.body} onChange={(e) => patch((d) => { d.body = e.target.value })} placeholder="Chegada a Tóquio. Transfer para o hotel e resto do dia livre para..." />
        </div>
      </div>
    </div>
  )
}
