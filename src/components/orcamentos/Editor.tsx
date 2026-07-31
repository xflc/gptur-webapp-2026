import { Plus, Trash2, ChevronUp, ChevronDown, Layers, MapPin, Check, GripVertical } from "lucide-react"
import type { Quote, Item, Stage, Alternative } from "../../orcamentos/model"
import { newService, newAlternative, newStage, newBranch, updateService, removeById, moveItem, moveStage, reorderItem, reorderStage, branchLabel } from "../../orcamentos/factory"
import { cheapestBranch, money, lineValue } from "../../orcamentos/pricing"
import { useStore } from "../../orcamentos/store"
import { Field, Text, Num, Select, Btn, handleProps, dropProps, DRAG_ITEM, DRAG_STAGE } from "./ui"
import { ServiceRow } from "./ServiceRow"

export function Editor({ q }: { q: Quote }) {
  const edit = useStore((s) => s.edit)
  const patchS = (id: string, fn: (s: any) => void) => edit((q) => updateService(q, id, fn))
  const rate = q.taxRate, pax = q.pax

  const renderItem = (it: Item, addTo: (item: Item) => void) =>
    it.kind === "service" ? (
      <ServiceRow key={it.id} s={it} rate={rate} pax={pax} patch={(fn) => patchS(it.id, fn)} remove={() => edit((q) => removeById(q, it.id))} move={(d) => edit((q) => moveItem(q, it.id, d))} onReorder={(from) => edit((q) => reorderItem(q, from, it.id))} />
    ) : (
      <AlternativeEditor key={it.id} alt={it} rate={rate} pax={pax} onReorder={(from) => edit((q) => reorderItem(q, from, it.id))} />
    )

  return (
    <div className="space-y-6">
      {/* Framing */}
      <section className="rounded-xl border border-border bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Título da viagem" className="sm:col-span-2"><Text value={q.title || ""} onChange={(v) => edit((q) => { q.title = v })} placeholder="Lua de mel na Tailândia" /></Field>
          <Field label="Cliente"><Text value={q.client || ""} onChange={(v) => edit((q) => { q.client = v })} placeholder="Nome / empresa" /></Field>
          <Field label="Referência"><Text value={q.ref || ""} onChange={(v) => edit((q) => { q.ref = v })} placeholder="ORC-2026-001" /></Field>
          <Field label="Consultor"><Text value={q.consultant || ""} onChange={(v) => edit((q) => { q.consultant = v })} /></Field>
          <Field label="Nº de pessoas"><Num value={q.pax} min={1} onChange={(v) => edit((q) => { q.pax = Math.max(1, v) })} /></Field>
          <Field label="Taxa de imposto (%)"><Num value={Math.round(q.taxRate * 100)} min={0} onChange={(v) => edit((q) => { q.taxRate = (v || 0) / 100 })} /></Field>
          <Field label="Validade"><Text value={q.validity || ""} onChange={(v) => edit((q) => { q.validity = v })} placeholder="30 dias" /></Field>
          <Field label="Modo">
            <Select value={q.mode} onChange={(v) => edit((q) => { q.mode = v })} options={[{ id: "itinerary", label: "Itinerário (dia a dia)" }, { id: "flat", label: "Destino único" }]} />
          </Field>
          {q.mode === "itinerary"
            ? <Field label="Data de início (dias⇄datas)"><input type="date" className="w-full rounded-md border border-border bg-white px-2.5 py-1.5 text-sm" value={q.startDate || ""} onChange={(e) => edit((q) => { q.startDate = e.target.value })} /></Field>
            : <Field label="Duração (dias)"><Num value={q.durationDays || 0} min={0} onChange={(v) => edit((q) => { q.durationDays = v })} /></Field>}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label="Saudação"><Text value={q.greeting || ""} onChange={(v) => edit((q) => { q.greeting = v })} placeholder="Caros Bernardo e Teresa," /></Field>
          <Field label="Introdução" className="sm:col-span-2"><Text value={q.intro || ""} onChange={(v) => edit((q) => { q.intro = v })} placeholder="Segue a nossa proposta para..." /></Field>
        </div>
      </section>

      {/* General / flat services */}
      <Section title={q.mode === "flat" ? "Serviços" : "Serviços gerais"} sub={q.mode === "flat" ? "Todos os serviços da viagem" : "Voos, seguros, taxas — abrangem toda a viagem"} icon={<Layers size={16} />}>
        <div className="space-y-2">{q.general.map((it) => renderItem(it, (item) => edit((q) => q.general.push(item))))}</div>
        <AddRow onService={() => edit((q) => q.general.push(newService()))} onAlt={() => edit((q) => q.general.push(newAlternative()))} />
      </Section>

      {/* Itinerary */}
      {q.mode === "itinerary" && (
        <div className="space-y-4">
          {q.itinerary.map((st, i) => (
            <StageEditor key={st.id} st={st} idx={i} count={q.itinerary.length} rate={rate} pax={pax} renderItem={renderItem} onReorder={(from) => edit((q) => reorderStage(q, from, st.id))} />
          ))}
          <Btn variant="primary" onClick={() => edit((q) => q.itinerary.push(newStage()))}><MapPin size={14} /> Adicionar etapa</Btn>
        </div>
      )}

      <section className="rounded-xl border border-border bg-white p-4">
        <Field label="Notas / condições (rodapé)"><textarea className="min-h-20 w-full rounded-md border border-border bg-white px-2.5 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-teal-100" value={q.notes || ""} onChange={(e) => edit((q) => { q.notes = e.target.value })} placeholder="Condições de pagamento, o que inclui/não inclui, etc." /></Field>
      </section>
    </div>
  )
}

function Section({ title, sub, icon, children }: { title: string; sub?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-secondary/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary">{icon}</span>
        <div><h3 className="font-display text-lg leading-none text-ink">{title}</h3>{sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}</div>
      </div>
      {children}
    </section>
  )
}

function AddRow({ onService, onAlt }: { onService: () => void; onAlt: () => void }) {
  return (
    <div className="mt-2 flex gap-2">
      <Btn onClick={onService}><Plus size={14} /> Serviço</Btn>
      <Btn onClick={onAlt}><Layers size={14} /> Alternativa (A/B)</Btn>
    </div>
  )
}

function StageEditor({ st, idx, count, rate, pax, renderItem, onReorder }: { st: Stage; idx: number; count: number; rate: number; pax: number; renderItem: (it: Item, addTo: (i: Item) => void) => React.ReactNode; onReorder?: (fromId: string) => void }) {
  const edit = useStore((s) => s.edit)
  const patchStage = (fn: (s: Stage) => void) => edit((q) => { const s = q.itinerary.find((x) => x.id === st.id); if (s) fn(s) })
  return (
    <section className="rounded-xl border border-border bg-secondary/40 p-4" {...(onReorder ? dropProps(DRAG_STAGE, onReorder) : {})}>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <div className="mb-0.5 flex flex-col items-center self-center text-muted-foreground/60">
          {onReorder && <span {...handleProps(DRAG_STAGE, st.id)} title="Arrastar para reordenar a etapa" className="cursor-grab hover:text-primary active:cursor-grabbing"><GripVertical size={16} /></span>}
          <div className="flex flex-col leading-none">
            <button onClick={() => edit((q) => moveStage(q, st.id, -1))} disabled={idx === 0} title="Subir" className="grid h-4 w-5 place-items-center rounded hover:bg-secondary hover:text-primary disabled:opacity-30"><ChevronUp size={14} /></button>
            <button onClick={() => edit((q) => moveStage(q, st.id, 1))} disabled={idx === count - 1} title="Descer" className="grid h-4 w-5 place-items-center rounded hover:bg-secondary hover:text-primary disabled:opacity-30"><ChevronDown size={14} /></button>
          </div>
        </div>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary text-xs font-bold text-white">{idx + 1}</span>
        <Field label="Local" className="min-w-[160px] flex-1"><Text value={st.place} onChange={(v) => patchStage((s) => { s.place = v })} placeholder="Tóquio" /></Field>
        <Field label="Dia início"><Num value={st.dayStart || 0} min={0} onChange={(v) => patchStage((s) => { s.dayStart = v })} className="w-20" /></Field>
        <Field label="Dia fim"><Num value={st.dayEnd || 0} min={0} onChange={(v) => patchStage((s) => { s.dayEnd = v })} className="w-20" /></Field>
        <div className="ml-auto flex items-center gap-0.5">
          <button onClick={() => edit((q) => removeById(q, st.id))} title="Remover etapa" className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-red-50 hover:text-destructive"><Trash2 size={15} /></button>
        </div>
      </div>
      <Field label="Descrição da etapa"><Text value={st.description || ""} onChange={(v) => patchStage((s) => { s.description = v })} placeholder="Chegada e dia livre para explorar o bairro de..." /></Field>
      <div className="mt-3 space-y-2">{st.items.map((it) => renderItem(it, (item) => patchStage((s) => s.items.push(item))))}</div>
      <div className="mt-2 flex gap-2">
        <Btn onClick={() => patchStage((s) => s.items.push(newService()))}><Plus size={14} /> Serviço</Btn>
        <Btn onClick={() => patchStage((s) => s.items.push(newAlternative()))}><Layers size={14} /> Alternativa (A/B)</Btn>
      </div>
    </section>
  )
}

function AlternativeEditor({ alt, rate, pax, onReorder }: { alt: Alternative; rate: number; pax: number; onReorder?: (fromId: string) => void }) {
  const edit = useStore((s) => s.edit)
  const patchS = (id: string, fn: (s: any) => void) => edit((q) => updateService(q, id, fn))
  const cheapest = cheapestBranch(alt, pax)
  const patchAlt = (fn: (a: Alternative) => void) => edit((q) => {
    const walk = (items: Item[]) => items.forEach((it) => { if (it.kind === "alternative" && it.id === alt.id) fn(it) })
    walk(q.general); q.itinerary.forEach((st) => walk(st.items))
  })
  return (
    <div className="rounded-lg border-2 border-dashed border-primary/30 bg-teal-50/30 p-3" {...(onReorder ? dropProps(DRAG_ITEM, onReorder) : {})}>
      <div className="mb-2 flex items-center gap-2">
        {onReorder && <span {...handleProps(DRAG_ITEM, alt.id)} title="Arrastar para reordenar" className="cursor-grab text-muted-foreground/60 hover:text-primary active:cursor-grabbing"><GripVertical size={15} /></span>}
        <Layers size={15} className="text-primary" />
        <Text value={alt.title || ""} onChange={(v) => patchAlt((a) => { a.title = v })} placeholder="Escolha uma opção (ex.: Passeio da tarde)" className="max-w-xs" />
        <span className="text-[0.62rem] text-muted-foreground">a mais barata entra no preço base</span>
      </div>
      <div className="space-y-2">
        {alt.branches.map((b, i) => {
          const isBase = cheapest?.id === b.id
          const total = b.services.reduce((acc, s) => acc + lineValue(s, pax).pvp, 0)
          return (
            <div key={b.id} className={`rounded-lg border p-2.5 ${isBase ? "border-primary bg-white" : "border-border bg-white/70"}`}>
              <div className="mb-2 flex items-center gap-2">
                {isBase ? <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[0.6rem] font-semibold text-white"><Check size={10} /> incluída na base</span>
                        : <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.6rem] font-medium text-muted-foreground">alternativa</span>}
                <Text value={b.label || ""} onChange={(v) => patchAlt((a) => { const br = a.branches.find((x) => x.id === b.id); if (br) br.label = v })} placeholder={branchLabel(b, i)} className="max-w-[160px]" />
                <span className="ml-auto text-xs font-semibold tabular-nums text-primary">{money(total)}</span>
                <button onClick={() => patchAlt((a) => { a.branches = a.branches.filter((x) => x.id !== b.id) })} title="Remover opção" className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:text-destructive"><Trash2 size={13} /></button>
              </div>
              <div className="space-y-2">
                {b.services.map((s) => (
                  <ServiceRow key={s.id} s={s} rate={rate} pax={pax} patch={(fn) => patchS(s.id, fn)} remove={() => edit((q) => removeById(q, s.id))} />
                ))}
              </div>
              <button onClick={() => patchAlt((a) => { const br = a.branches.find((x) => x.id === b.id); if (br) br.services.push(newService()) })} className="mt-2 text-xs text-primary underline-offset-2 hover:underline"><Plus size={11} className="mr-0.5 inline" />Serviço nesta opção</button>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex gap-2">
        <Btn onClick={() => patchAlt((a) => a.branches.push(newBranch(`Opção ${String.fromCharCode(65 + a.branches.length)}`)))}><Plus size={13} /> Opção</Btn>
        <button onClick={() => edit((q) => removeById(q, alt.id))} className="text-xs text-muted-foreground hover:text-destructive">Remover alternativa</button>
      </div>
    </div>
  )
}
