import { useEffect, useState } from "react"
import { Calendar, MapPin, Check, X, Users, CalendarDays } from "lucide-react"
import type { Program } from "../../programas/model"
import { departureLabel } from "../../data/offers"

const lines = (s: string) => s.split(/\n+/).map((x) => x.trim()).filter(Boolean)

// Renders a program as it would look on the site (offer-page style). Reads from localStorage (?id=).
export default function ProgramPreview() {
  const [p, setP] = useState<Program | null>(null)
  const [status, setStatus] = useState<"loading" | "ok" | "missing">("loading")

  useEffect(() => {
    try {
      const id = new URLSearchParams(location.search).get("id")
      const data = JSON.parse(localStorage.getItem("gptur-programas-v1") || "null")
      const arr: Program[] = data?.state?.programs || []
      const found = arr.find((x) => x.id === id) || arr.find((x) => x.id === data?.state?.currentId) || null
      if (found) { setP(found); setStatus("ok"); document.title = `${found.title || "Programa"} · GPTur` } else setStatus("missing")
    } catch { setStatus("missing") }
  }, [])

  if (status === "missing") return <p className="p-10 text-muted-foreground">Programa não encontrado. Abra a partir da ferramenta.</p>
  if (!p) return null

  const inc = lines(p.included), exc = lines(p.notIncluded)
  const departure = p.groupTrip ? departureLabel(p.departureStart, p.departureEnd) : null

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center gap-2 bg-primary px-5 py-3">
        <img src="/gptur-logo-white.png" alt="GPTur" className="h-8 w-auto" />
        <span className="ml-auto rounded-full bg-white/15 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-widest text-white">Pré-visualização</span>
      </div>

      {/* Hero */}
      <section className="relative h-[46vh] min-h-[340px] w-full overflow-hidden bg-ink">
        {p.hero && <img src={p.hero} alt={p.title} className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/15" />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-7xl px-5 pb-9 lg:px-8">
            <div className="flex flex-wrap items-center gap-2">
              {p.groupTrip && <span className="eyebrow flex items-center gap-1 bg-primary px-2.5 py-1 text-[0.6rem] text-white"><Users size={11} /> Viagem de grupo</span>}
              <span className="eyebrow bg-accent px-2.5 py-1 text-[0.6rem] text-accent-foreground">{p.type === "circuito" ? "Roteiro" : "Destino único"}</span>
              <span className="eyebrow bg-white/15 px-2.5 py-1 text-[0.6rem] text-white backdrop-blur">{p.region}</span>
            </div>
            <h1 className="mt-3 font-display text-4xl leading-tight text-white sm:text-5xl">{p.title || "Sem título"}</h1>
            {p.destino && <p className="mt-1 text-white/85">{p.destino}</p>}
            {p.tagline && <p className="mt-2 max-w-2xl text-white/80">{p.tagline}</p>}
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="bg-white py-14">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[1fr_340px] lg:px-8">
          <div>
            {p.overview && <p className="text-[0.98rem] leading-relaxed text-foreground/85">{p.overview}</p>}

            {departure && (
              <div className="mt-6 flex items-start gap-3 rounded-lg border border-teal-200 bg-teal-50/60 p-5 text-sm">
                <CalendarDays size={18} className="mt-0.5 shrink-0 text-primary" />
                <p className="text-foreground/80"><span className="font-semibold text-ink">Viagem de grupo com partida a {departure}.</span>{p.spots ? ` Lugares limitados a ${p.spots} participantes.` : ""} As inscrições fazem-se connosco.</p>
              </div>
            )}

            {p.days.some((d) => d.title || d.body) && (
              <div className="mt-10">
                <h2 className="mb-6 font-display text-3xl text-ink">Programa</h2>
                <ol className="space-y-0">
                  {p.days.filter((d) => d.title || d.body).map((d, i, a) => (
                    <li key={d.id} className="relative flex gap-5 pb-8 last:pb-0">
                      {i < a.length - 1 && <span className="absolute left-[19px] top-11 h-full w-px bg-border" />}
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal-50 text-xs font-bold text-primary ring-1 ring-teal-200">{i + 1}</span>
                      <div className="pt-1">
                        <h4 className="font-display text-lg leading-snug text-ink">{d.title || `${i + 1}º Dia`}</h4>
                        {d.body && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{d.body}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {(inc.length > 0 || exc.length > 0) && (
              <div className="mt-10 grid gap-8 sm:grid-cols-2">
                {inc.length > 0 && (
                  <div>
                    <h3 className="font-display text-xl text-ink">Serviços incluídos</h3>
                    <ul className="mt-4 space-y-2.5">
                      {inc.map((s, i) => <li key={i} className="flex gap-2.5 text-sm text-foreground/80"><Check size={17} className="mt-0.5 shrink-0 text-primary" /><span>{s}</span></li>)}
                    </ul>
                  </div>
                )}
                {exc.length > 0 && (
                  <div>
                    <h3 className="font-display text-xl text-ink">Não incluído</h3>
                    <ul className="mt-4 space-y-2.5">
                      {exc.map((s, i) => <li key={i} className="flex gap-2.5 text-sm text-muted-foreground"><X size={17} className="mt-0.5 shrink-0 text-muted-foreground" /><span>{s}</span></li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {p.notes && <p className="mt-8 rounded-lg border border-border bg-cream p-5 text-sm text-muted-foreground">{p.notes}</p>}
          </div>

          {/* Sidebar */}
          <aside>
            <div className="sticky top-6 rounded-xl border border-border bg-card p-6 shadow-sm">
              {p.priceFrom ? (
                <>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Desde</div>
                  <div className="font-display text-4xl text-primary">{p.priceFrom.toLocaleString("pt-PT")} €</div>
                  <div className="text-xs text-muted-foreground">por pessoa</div>
                </>
              ) : (
                <>
                  <div className="font-display text-2xl text-primary">Preço sob consulta</div>
                  <p className="mt-1 text-xs text-muted-foreground">Para mais informações, entre em contacto connosco.</p>
                </>
              )}
              <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm text-foreground/80">
                {departure && <p className="flex items-center gap-2"><CalendarDays size={15} className="text-primary" /> Partida: {departure}</p>}
                {p.groupTrip && p.spots ? <p className="flex items-center gap-2"><Users size={15} className="text-primary" /> Máx. {p.spots} participantes</p> : null}
                {p.nights ? <p className="flex items-center gap-2"><Calendar size={15} className="text-primary" /> {p.nights} noites</p> : null}
                {p.destino && <p className="flex items-center gap-2"><MapPin size={15} className="text-primary" /> {p.destino}</p>}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
