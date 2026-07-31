import { useEffect, useState } from "react"
import { QuoteDocument } from "./QuoteDocument"
import type { Quote } from "../../orcamentos/model"

// Reads the quote from the app's localStorage (?id=…) and renders just the document.
export default function PrintView() {
  const [q, setQ] = useState<Quote | null>(null)
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading")

  useEffect(() => {
    try {
      const id = new URLSearchParams(location.search).get("id")
      const data = JSON.parse(localStorage.getItem("gptur-orcamentos-v4") || "null")
      const quotes: Quote[] = data?.state?.quotes || []
      const found = quotes.find((x) => x.id === id) || quotes.find((x) => x.id === data?.state?.currentId) || null
      if (found) { setQ(found); setState("ok") } else setState("missing")
    } catch { setState("missing") }
  }, [])

  if (state === "missing") return <p style={{ padding: 40, fontFamily: "Manrope, sans-serif" }}>Orçamento não encontrado. Abra a partir da ferramenta.</p>
  if (!q) return null

  return (
    <>
      <div className="noprint toolbar">
        <button onClick={() => window.print()}>Guardar / Imprimir PDF</button>
        <span>Na caixa de impressão, escolha “Guardar como PDF”.</span>
      </div>
      <div className="sheet"><QuoteDocument q={q} /></div>
    </>
  )
}
