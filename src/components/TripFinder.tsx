import { useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  regions: string[]
}

const selectClass =
  "h-11 w-full rounded-md border border-input bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"

export default function TripFinder({ regions }: Props) {
  const [region, setRegion] = useState("")
  const [type, setType] = useState("")
  const [budget, setBudget] = useState(6000)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (region) params.set("regiao", region)
    if (type) params.set("tipo", type)
    if (budget < 12000) params.set("max", String(budget))
    window.location.href = `/catalogo?${params.toString()}`
  }

  return (
    <form
      id="finder"
      onSubmit={submit}
      className="rounded-xl border border-border bg-white p-6 shadow-sm"
    >
      <h3 className="font-display text-2xl text-primary">Encontre aqui a sua viagem</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Filtre por destino, tipo e orçamento.
      </p>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="eyebrow mb-1.5 block text-[0.65rem] text-muted-foreground">Destino</span>
          <select className={selectClass} value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">Todos os destinos</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="eyebrow mb-1.5 block text-[0.65rem] text-muted-foreground">Tipo de viagem</span>
          <select className={selectClass} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Todas</option>
            <option value="estadia">Estadia / praia</option>
            <option value="circuito">Circuito</option>
          </select>
        </label>

        <label className="block">
          <span className="eyebrow mb-1.5 flex items-center justify-between text-[0.65rem] text-muted-foreground">
            <span>Orçamento até</span>
            <span className="text-primary">{budget >= 12000 ? "sem limite" : `${budget.toLocaleString("pt-PT")} €`}</span>
          </span>
          <input
            type="range"
            min={500}
            max={12000}
            step={100}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-sand accent-primary"
          />
        </label>
      </div>

      <Button type="submit" className="mt-6 w-full" size="lg">
        <Search /> Procurar viagens
      </Button>
    </form>
  )
}
