// Client-facing quote document — brand-styled HTML, print-friendly (A4).
// Self-contained <style> so it renders identically in a preview pane or a print window.
import { Fragment } from "react"
import type { Quote, Item, Service, Stage } from "../../orcamentos/model"
import { CATEGORY_ORDER, categoryLabel, UNITS } from "../../orcamentos/model"
import { quoteTotals, cheapestBranch, lineValue, money, isRealService } from "../../orcamentos/pricing"
import { branchLabel } from "../../orcamentos/factory"

const unitShort = (u: string) => UNITS.find((x) => x.id === u)?.short || ""

function fmtDate(startDate: string | undefined, day: number | undefined): string | null {
  if (!startDate || !day) return null
  const d = new Date(startDate + "T00:00:00")
  if (isNaN(d.getTime())) return null
  d.setDate(d.getDate() + (day - 1))
  return d.toLocaleDateString("pt-PT", { day: "numeric", month: "long" })
}

function stageTiming(q: Quote, st: Stage): string {
  const parts: string[] = []
  if (st.dayStart) parts.push(st.dayEnd && st.dayEnd !== st.dayStart ? `Dias ${st.dayStart}–${st.dayEnd}` : `Dia ${st.dayStart}`)
  const d1 = fmtDate(q.startDate, st.dayStart)
  const d2 = fmtDate(q.startDate, st.dayEnd)
  if (d1) parts.push(d2 && d2 !== d1 ? `${d1} a ${d2}` : d1)
  return parts.join(" · ")
}

// helpers return keyed <tr> arrays so the parent <tbody> gets one flat keyed list
function serviceRow(s: Service, pax: number, extra = false) {
  if (!isRealService(s)) return null
  const line = lineValue(s, pax)
  return (
    <tr key={s.id} className={extra ? "extra" : ""}>
      <td className="desc">
        <span className="title">{s.title || "—"}</span>
        {extra && <span className="tag tag-extra">opcional</span>}
        {s.description && <span className="sub">{s.description}</span>}
      </td>
      <td className="qty">{s.qty > 1 ? `${s.qty}× ` : ""}{unitShort(s.unit)}</td>
      <td className="num">{money(line.net)}</td>
      <td className="num strong">{money(line.pvp)}</td>
    </tr>
  )
}

function itemRows(it: Item, pax: number): React.ReactNode[] {
  if (it.kind === "service") { const r = serviceRow(it, pax, !!it.optional); return r ? [r] : [] }
  const cheap = cheapestBranch(it, pax)
  const valid = it.branches.filter((b) => b.services.some(isRealService))
  const ordered = cheap ? [cheap, ...valid.filter((b) => b.id !== cheap.id)] : valid
  return [
    <tr key={`${it.id}-h`} className="althead">
      <td colSpan={4}>{it.title?.trim() || "Escolha uma opção"}</td>
    </tr>,
    ...ordered.map((b, i) => {
      const included = cheap?.id === b.id
      const total = b.services.reduce((a, s) => ({ net: a.net + lineValue(s, pax).net, pvp: a.pvp + lineValue(s, pax).pvp }), { net: 0, pvp: 0 })
      const real = b.services.filter(isRealService)
      const single = real.length === 1
      return (
        <tr key={b.id} className={`branch ${included ? "included" : "alt"}`}>
          <td className="desc">
            <span className="tag tag-opt">{branchLabel(b, i)}</span>
            <span className={`tag ${included ? "tag-inc" : "tag-alt"}`}>{included ? "incluída na base" : "alternativa"}</span>
            {single ? <span className="title">{real[0].title || "—"}</span> : <span className="sub">{real.map((s) => s.title).filter(Boolean).join(" · ")}</span>}
          </td>
          <td className="qty"></td>
          <td className="num">{money(total.net)}</td>
          <td className="num strong">{money(total.pvp)}</td>
        </tr>
      )
    }),
  ]
}

export function QuoteDocument({ q }: { q: Quote }) {
  const t = quoteTotals(q)
  const generalByCat = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: q.general.filter((it) => it.kind === "service" && it.category === cat) as Service[],
  })).filter((g) => g.items.length)
  const generalAlts = q.general.filter((it) => it.kind === "alternative") as Item[]
  const dateStr = new Date().toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="qdoc">
      <style>{CSS}</style>

      <header className="qhead">
        <div className="brand">
          <img src="/gptur-logo-white.png" alt="GPTur" className="logo" />
          <div className="rnavt">RNAVT nº 1817</div>
        </div>
        <div className="meta">
          <div className="metatitle">{q.title?.trim() || "Proposta de viagem"}</div>
          <table className="metatab">
            <tbody>
              {q.client && <tr><th>Cliente</th><td>{q.client}</td></tr>}
              {q.ref && <tr><th>Referência</th><td>{q.ref}</td></tr>}
              <tr><th>Data</th><td>{dateStr}</td></tr>
              <tr><th>Viajantes</th><td>{q.pax}</td></tr>
              {q.consultant && <tr><th>Consultor</th><td>{q.consultant}</td></tr>}
              {q.validity && <tr><th>Validade</th><td>{q.validity}</td></tr>}
            </tbody>
          </table>
        </div>
      </header>

      {(q.greeting || q.intro) && (
        <section className="intro">
          {q.greeting && <p className="greeting">{q.greeting}</p>}
          {q.intro && <p>{q.intro}</p>}
        </section>
      )}

      {/* General / flat services grouped by category */}
      {(generalByCat.length > 0 || generalAlts.length > 0) && (
        <section className="block">
          {q.mode === "itinerary" && <h2>Serviços gerais</h2>}
          <table className="lines">
            <thead><tr><th>Serviço</th><th></th><th className="num">Sem impostos</th><th className="num">Com impostos</th></tr></thead>
            <tbody>
              {generalByCat.map((g) => (
                <Fragment key={g.cat}>
                  <tr className="cathead"><td colSpan={4}>{categoryLabel(g.cat)}</td></tr>
                  {g.items.map((s) => serviceRow(s, q.pax, !!s.optional))}
                </Fragment>
              ))}
              {generalAlts.flatMap((it) => itemRows(it, q.pax))}
            </tbody>
          </table>
        </section>
      )}

      {/* Itinerary */}
      {q.mode === "itinerary" && q.itinerary.filter((st) => st.place || st.items.length || st.description).map((st, i) => (
        <section className="block stage" key={st.id}>
          <h2>
            <span className="stagen">{i + 1}</span>
            {st.place || "Etapa"}
            {stageTiming(q, st) && <span className="timing">{stageTiming(q, st)}</span>}
          </h2>
          {st.description && <p className="stagedesc">{st.description}</p>}
          {st.items.length > 0 && (
            <table className="lines">
              <tbody>{st.items.flatMap((it) => itemRows(it, q.pax))}</tbody>
            </table>
          )}
        </section>
      ))}

      {/* Totals */}
      <section className="totals">
        <table>
          <tbody>
            <tr><th>Preço base (sem impostos)</th><td>{money(t.baseNet)}</td></tr>
            <tr className="big"><th>Preço base (com impostos)</th><td>{money(t.basePvp)}</td></tr>
            <tr><th>Por pessoa ({t.pax}) com impostos</th><td>{money(t.perPaxPvp)}</td></tr>
            {t.extrasNet > 0 && <tr className="extras"><th>Extras / opcionais (com impostos)</th><td>{money(t.extrasPvp)}</td></tr>}
          </tbody>
        </table>
        <p className="taxnote">Valores em euros. IVA a {Math.round(t.rate * 100)}%. As opções mais económicas estão incluídas no preço base; alternativas e extras são apresentados à parte.</p>
      </section>

      {q.notes && (
        <section className="notes">
          <h3>Condições</h3>
          <p>{q.notes}</p>
        </section>
      )}

      <footer className="qfoot">
        GPTur · RNAVT nº 1817 · R. Helena Vaz da Silva, 11, 1750-405 Lisboa · +351 217 530 021 · lisboa@gptur.pt
      </footer>
    </div>
  )
}

const CSS = `
.qdoc { --teal:#2a6b61; --teal-d:#1f4741; --gold:#c1971f; --cream:#f9f7f2; --ink:#26302e; --line:#e2e6df; --muted:#5f6b67;
  font-family:"Manrope",system-ui,sans-serif; color:var(--ink); background:#fff; margin:0 auto; padding:15mm 16mm;
  font-size:12.5px; line-height:1.5; box-sizing:border-box; }
/* imprimir fundos/cores (logo em caixa teal, bolinhas dos dias, badges) */
.qdoc, .qdoc * { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.qdoc h2,.qdoc h3 { font-family:"Cormorant Garamond",Georgia,serif; font-weight:600; letter-spacing:-.01em; color:var(--teal-d); }
.qhead { display:flex; justify-content:space-between; gap:24px; border-bottom:2px solid var(--teal); padding-bottom:16px; margin-bottom:20px; }
.brand { display:flex; flex-direction:column; gap:10px; align-items:flex-start; }
.brand .logo { height:44px; width:auto; background:var(--teal); border-radius:6px; padding:8px 12px; }
.brand .rnavt { font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); }
.meta { text-align:right; }
.metatitle { font-family:"Cormorant Garamond",serif; font-size:26px; font-weight:600; color:var(--ink); margin-bottom:8px; }
.metatab { margin-left:auto; border-collapse:collapse; font-size:11.5px; }
.metatab th { text-align:right; color:var(--muted); font-weight:600; text-transform:uppercase; letter-spacing:.06em; font-size:9.5px; padding:1px 8px 1px 0; }
.metatab td { text-align:left; padding:1px 0; }
.intro { margin:0 0 20px; }
.intro .greeting { font-weight:600; margin-bottom:4px; }
.intro p { margin:0 0 6px; }
.block { margin-bottom:20px; break-inside:avoid; }
.block h2 { font-size:19px; margin:0 0 8px; display:flex; align-items:center; gap:10px; }
.stagen { display:inline-grid; place-items:center; width:22px; height:22px; border-radius:50%; background:var(--teal); color:#fff; font-family:"Manrope"; font-size:11px; font-weight:700; }
.timing { font-family:"Manrope"; font-size:10.5px; font-weight:600; text-transform:uppercase; letter-spacing:.06em; color:var(--gold); margin-left:auto; }
.stagedesc { margin:0 0 8px; color:#3a4744; }
table.lines { width:100%; border-collapse:collapse; }
table.lines thead th { text-align:left; font-size:9px; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); border-bottom:1px solid var(--line); padding:4px 6px; }
table.lines thead th.num, table.lines td.num { text-align:right; white-space:nowrap; }
table.lines td { padding:5px 6px; border-bottom:1px solid var(--line); vertical-align:top; }
.cathead td, .althead td { font-family:"Cormorant Garamond",serif; font-size:14px; color:var(--teal); font-weight:600; padding-top:9px; border-bottom:1px solid var(--line); }
.althead td { font-style:italic; }
td.desc .title { font-weight:600; }
td.desc .sub { display:block; color:var(--muted); font-size:10.5px; }
td.qty { color:var(--muted); font-size:10.5px; white-space:nowrap; }
td.num.strong { font-weight:700; color:var(--teal-d); }
tr.extra td { background:#fffdf3; }
tr.branch.alt td { color:#586460; }
tr.branch.included td.num.strong { color:var(--teal); }
.tag { display:inline-block; font-size:8.5px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; padding:1px 6px; border-radius:10px; margin-right:6px; vertical-align:middle; }
.tag-inc { background:var(--teal); color:#fff; }
.tag-alt { background:#eef1ee; color:var(--muted); }
.tag-extra { background:#faedbf; color:#5f481a; }
.tag-opt { background:#eef6f4; color:var(--teal); }
.totals { margin:22px 0 12px; break-inside:avoid; }
.totals table { margin-left:auto; border-collapse:collapse; min-width:320px; }
.totals th { text-align:left; padding:5px 18px 5px 0; color:var(--muted); font-weight:600; }
.totals td { text-align:right; padding:5px 0; font-weight:700; font-variant-numeric:tabular-nums; }
.totals tr.big th { color:var(--ink); font-size:14px; }
.totals tr.big td { font-size:20px; color:var(--teal); }
.totals tr.big { border-top:1px solid var(--line); border-bottom:2px solid var(--teal); }
.totals tr.extras td, .totals tr.extras th { color:var(--gold); }
.taxnote { text-align:right; font-size:10px; color:var(--muted); margin-top:8px; max-width:420px; margin-left:auto; }
.notes { margin-top:18px; padding-top:12px; border-top:1px solid var(--line); }
.notes h3 { font-size:15px; margin:0 0 4px; }
.notes p { white-space:pre-wrap; color:#3a4744; }
.qfoot { margin-top:24px; padding-top:12px; border-top:1px solid var(--line); text-align:center; font-size:10px; color:var(--muted); }
@media print { .qdoc { font-size:11.5px; } .block,.totals,.qhead,.stage { break-inside:avoid; } }
`
