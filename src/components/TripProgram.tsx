import { useState } from "react"
import { Check, X, Info, FileText } from "lucide-react"
import type { TripDetails } from "@/data/trips"

const tabs = [
  { key: "itinerario", label: "Itinerário" },
  { key: "condicoes", label: "Preço e Condições" },
  { key: "notas", label: "Notas" },
  { key: "documentacao", label: "Documentação" },
] as const

type TabKey = (typeof tabs)[number]["key"]

export default function TripProgram({ details }: { details: TripDetails }) {
  const [active, setActive] = useState<TabKey>("itinerario")

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              active === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Itinerário — timeline */}
      <div className={active === "itinerario" ? "block" : "hidden"}>
        <ol className="mt-8 space-y-0">
          {details.itinerary.map((d, i) => (
            <li key={i} className="relative flex gap-5 pb-8 last:pb-0">
              {i < details.itinerary.length - 1 && (
                <span className="absolute left-[19px] top-10 h-full w-px bg-border" />
              )}
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal-50 text-xs font-bold text-primary ring-1 ring-teal-200">
                {i + 1}
              </span>
              <div className="pt-1">
                <p className="eyebrow text-[0.62rem] text-gold-500">{d.day}</p>
                <h4 className="mt-0.5 font-display text-xl text-ink">{d.route}</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{d.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Preço e Condições */}
      <div className={active === "condicoes" ? "block" : "hidden"}>
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <div>
            <h4 className="font-display text-xl text-ink">O preço inclui</h4>
            <ul className="mt-4 space-y-2.5">
              {details.included.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-foreground/80">
                  <Check size={18} className="mt-0.5 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          {details.notIncluded && (
            <div>
              <h4 className="font-display text-xl text-ink">Não inclui</h4>
              <ul className="mt-4 space-y-2.5">
                {details.notIncluded.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
                    <X size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Notas */}
      <div className={active === "notas" ? "block" : "hidden"}>
        <ul className="mt-8 space-y-3">
          {(details.notes ?? []).map((item, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-foreground/80">
              <Info size={18} className="mt-0.5 shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Documentação */}
      <div className={active === "documentacao" ? "block" : "hidden"}>
        <ul className="mt-8 space-y-3">
          {(details.documentation ?? []).map((item, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-foreground/80">
              <FileText size={18} className="mt-0.5 shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
