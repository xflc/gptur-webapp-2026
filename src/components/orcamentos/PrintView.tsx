import { useEffect, useState } from "react"
import { QuoteDocument } from "./QuoteDocument"
import type { Quote } from "../../orcamentos/model"

// Reads the quote from the app's localStorage (?id=…) and renders just the document.
// Paper size and margins are preset via a dynamic @page rule so the print/PDF dialog
// starts with them (A4, or a single page cut exactly to the document's height).
const MARGINS: Record<string, { label: string; pad: string }> = {
  normais: { label: "Normais", pad: "15mm 16mm" },
  estreitas: { label: "Estreitas", pad: "9mm 11mm" },
  amplas: { label: "Amplas", pad: "22mm 24mm" },
}
const PX_PER_MM = 96 / 25.4

export default function PrintView() {
  const [q, setQ] = useState<Quote | null>(null)
  const [status, setStatus] = useState<"loading" | "ok" | "missing">("loading")
  const [paper, setPaper] = useState<"fit" | "a4">("fit")
  const [margin, setMargin] = useState("normais")

  useEffect(() => {
    try {
      const id = new URLSearchParams(location.search).get("id")
      const data = JSON.parse(localStorage.getItem("gptur-orcamentos-v4") || "null")
      const quotes: Quote[] = data?.state?.quotes || []
      const found = quotes.find((x) => x.id === id) || quotes.find((x) => x.id === data?.state?.currentId) || null
      if (found) { setQ(found); setStatus("ok") } else setStatus("missing")
    } catch { setStatus("missing") }
  }, [])

  // tab title = "Orçamento · <viagem>" (também vira o nome sugerido do PDF ao guardar)
  useEffect(() => {
    if (q) document.title = `Orçamento · ${q.title?.trim() || q.client?.trim() || "GPTur"}`
  }, [q])

  // preset paper size + margins via an @page rule.
  // A4: margins come from @page (so every page has them); page-única: margins are the
  // document's own padding and the page height is cut to the content (one page, no breaks).
  useEffect(() => {
    if (status !== "ok") return
    const styleEl = document.getElementById("pagerule") || Object.assign(document.head.appendChild(document.createElement("style")), { id: "pagerule" })
    const pad = MARGINS[margin].pad
    const screenPad = `.qdoc { padding: ${pad} !important; }` // preview always shows the margins

    if (paper === "a4") {
      styleEl.textContent = `${screenPad} @media print { .qdoc { padding: 0 !important; } } @page { size: 210mm 297mm; margin: ${pad}; }`
      return
    }
    // page-única: measure the document height (with its padding) → cut the page to it
    const apply = () => {
      const doc = document.querySelector<HTMLElement>(".qdoc")
      const h = doc ? Math.ceil(doc.getBoundingClientRect().height / PX_PER_MM) + 1 : 297
      styleEl.textContent = `${screenPad} @page { size: 210mm ${h}mm; margin: 0; }`
    }
    styleEl.textContent = screenPad
    const t = setTimeout(apply, 60)
    ;(document as any).fonts?.ready?.then(() => requestAnimationFrame(apply))
    return () => clearTimeout(t)
  }, [status, paper, margin])

  if (status === "missing") return <p style={{ padding: 40, fontFamily: "Manrope, sans-serif" }}>Orçamento não encontrado. Abra a partir da ferramenta.</p>
  if (!q) return null

  return (
    <>
      <div className="noprint toolbar">
        <button onClick={() => window.print()}>Guardar / Imprimir PDF</button>
        <label>Papel
          <select value={paper} onChange={(e) => setPaper(e.target.value as any)}>
            <option value="fit">Página única (ajustada ao documento)</option>
            <option value="a4">A4</option>
          </select>
        </label>
        <label>Margens
          <select value={margin} onChange={(e) => setMargin(e.target.value)}>
            {Object.entries(MARGINS).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
          </select>
        </label>
      </div>
      <div className="sheet"><QuoteDocument q={q} /></div>
    </>
  )
}
