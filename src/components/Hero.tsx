import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Slide {
  region?: string
  title: string
  dates: string
  image: string
  href: string
  tagline: string
}

// PRNG determinístico (igual ao de offers.ts) para escolher a seleção do dia no
// browser — num site estático a data do build ficaria congelada, por isso a
// rotação diária tem de correr no cliente com a data real de quem visita.
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
// baralha pela seed do dia (YYYYMMDD) e escolhe uma oferta por região (até 5)
function pickForToday(pool: Slide[]): Slide[] {
  const d = new Date()
  const rnd = mulberry32(d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate())
  const a = [...pool]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  const out: Slide[] = []
  for (const s of a) {
    if (!out.some((x) => x.region === s.region)) out.push(s)
    if (out.length >= 5) break
  }
  return out
}

export default function Hero({ slides, pool }: { slides: Slide[]; pool?: Slide[] }) {
  // arranca com a seleção do build (SSR, sem flash de hidratação) e, depois de
  // montar, troca para a seleção do dia calculada com a data real do browser.
  const [active, setActive] = useState<Slide[]>(slides)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = active.length

  const go = (n: number) => setIndex((n + count) % count)

  useEffect(() => {
    if (!pool || pool.length === 0) return
    const today = pickForToday(pool)
    if (today.length && today.some((s, i) => s.href !== active[i]?.href)) {
      setActive(today)
      setIndex(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 6000)
    return () => clearInterval(id)
  }, [count, paused])

  return (
    <section id="inicio" className="relative h-[68vh] min-h-[460px] w-full overflow-hidden bg-ink">
      {active.map((slide, i) => (
        <div
          key={slide.title}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={i !== index}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="h-full w-full object-cover"
            loading={i === 0 ? "eager" : "lazy"}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
        </div>
      ))}

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-5 lg:px-8">
        <div className="max-w-xl">
          <span className="eyebrow inline-block bg-accent px-3 py-1 text-accent-foreground">
            Marque a próxima viagem connosco
          </span>
          <h1 className="mt-4 line-clamp-2 font-display text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
            {active[index].title}
          </h1>
          <p className="mt-3 max-w-md text-base text-white/85 line-clamp-3">
            {active[index].tagline}
          </p>
          <p className="mt-4 eyebrow text-white/70">{active[index].dates}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => (window.location.href = active[index].href)}>
              Ver oferta
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-ink"
              onClick={() => (window.location.hash = "#finder")}
            >
              Encontre a sua viagem
            </Button>
          </div>
        </div>
      </div>

      <button
        onClick={() => go(index - 1)}
        aria-label="Anterior"
        className="absolute left-4 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/25 text-white backdrop-blur transition hover:bg-white/40"
      >
        <ChevronLeft />
      </button>
      <button
        onClick={() => go(index + 1)}
        aria-label="Seguinte"
        className="absolute right-4 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/25 text-white backdrop-blur transition hover:bg-white/40"
      >
        <ChevronRight />
      </button>

      <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3">
        <button
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "Retomar" : "Pausar"}
          className="grid h-6 w-6 place-items-center rounded-full bg-white/25 text-white backdrop-blur transition hover:bg-white/40"
        >
          {paused ? <Play size={13} /> : <Pause size={13} />}
        </button>
        <div className="flex items-center gap-2">
          {active.map((s, i) => (
            <button
              key={s.title}
              onClick={() => go(i)}
              aria-label={`Ir para ${s.title}`}
              className={`h-2.5 rounded-full transition-all ${
                i === index ? "w-7 bg-white" : "w-2.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
