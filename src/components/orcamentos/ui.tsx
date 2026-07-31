import type { ReactNode } from "react"
import { netToPvp, pvpToNet } from "../../orcamentos/pricing"

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

const inputCls =
  "w-full rounded-md border border-border bg-white px-2.5 py-1.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-teal-100"

export function Text({ value, onChange, placeholder = "", className = "" }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return <input className={`${inputCls} ${className}`} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
}

export function Num({ value, onChange, min, step = 1, className = "" }: { value: number; onChange: (v: number) => void; min?: number; step?: number; className?: string }) {
  return (
    <input
      type="number" className={`${inputCls} ${className}`} value={Number.isFinite(value) ? value : ""} min={min} step={step}
      onChange={(e) => onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
    />
  )
}

export function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { id: T; label: string }[] }) {
  return (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
    </select>
  )
}

// Linked ex-tax / inc-tax inputs (BLUEPRINT §4.4): type either, the other fills in.
export function MoneyPair({ net, pvp, rate, onChange }: { net: number; pvp: number; rate: number; onChange: (net: number, pvp: number) => void }) {
  const money = "w-24 rounded-md border border-border bg-white px-2 py-1.5 text-right text-sm tabular-nums outline-none focus:border-primary focus:ring-2 focus:ring-teal-100"
  return (
    <div className="flex items-end gap-2">
      <label className="flex flex-col gap-0.5">
        <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">sem impostos</span>
        <input type="number" step="0.01" min={0} className={money} value={net || ""} onChange={(e) => { const v = parseFloat(e.target.value) || 0; onChange(v, netToPvp(v, rate)) }} />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-gold-600">com impostos</span>
        <input type="number" step="0.01" min={0} className={money} value={pvp || ""} onChange={(e) => { const v = parseFloat(e.target.value) || 0; onChange(pvpToNet(v, rate), v) }} />
      </label>
    </div>
  )
}

export function Btn({ children, onClick, variant = "ghost", title, className = "" }: { children: ReactNode; onClick: () => void; variant?: "primary" | "ghost" | "danger"; title?: string; className?: string }) {
  const v = {
    primary: "bg-primary text-white hover:bg-teal-700",
    ghost: "border border-border bg-white text-foreground/80 hover:border-primary hover:text-primary",
    danger: "border border-border bg-white text-muted-foreground hover:border-destructive hover:text-destructive",
  }[variant]
  return (
    <button type="button" title={title} onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${v} ${className}`}>
      {children}
    </button>
  )
}
