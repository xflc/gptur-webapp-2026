import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Slide {
  title: string
  dates: string
  image: string
  href: string
  tagline: string
}

export default function Hero({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0)
  const count = slides.length

  const go = (n: number) => setIndex((n + count) % count)

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 6000)
    return () => clearInterval(id)
  }, [count])

  return (
    <section id="inicio" className="relative h-[68vh] min-h-[460px] w-full overflow-hidden bg-ink">
      {slides.map((slide, i) => (
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
          <h1 className="mt-4 font-display text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
            {slides[index].title}
          </h1>
          <p className="mt-3 max-w-md text-base text-white/85">
            {slides[index].tagline}
          </p>
          <p className="mt-4 eyebrow text-white/70">{slides[index].dates}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => (window.location.href = slides[index].href)}>
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

      <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {slides.map((s, i) => (
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
    </section>
  )
}
