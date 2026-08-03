import { useRef, useState } from "react"
import { ImagePlus, AlertTriangle, Check, Trash2 } from "lucide-react"
import { MIN_HERO_W } from "../../programas/model"

// Reads an uploaded image, REJECTS if narrower than MIN_HERO_W, otherwise compresses
// (max 1600px wide, JPEG) and returns a data URL + the ORIGINAL dimensions.
function processImage(file: File): Promise<{ url: string; w: number; h: number } | { error: string }> {
  return new Promise((resolve) => {
    const img = new Image()
    const src = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(src)
      const w = img.naturalWidth, h = img.naturalHeight
      if (w < MIN_HERO_W) { resolve({ error: `Imagem demasiado pequena: ${w}×${h}px. Mínimo ${MIN_HERO_W}px de largura.` }); return }
      if (w < h) { resolve({ error: `A imagem é vertical (${w}×${h}). Use uma imagem horizontal para o hero.` }); return }
      const maxW = 1600
      const scale = Math.min(1, maxW / w)
      const cw = Math.round(w * scale), ch = Math.round(h * scale)
      const canvas = document.createElement("canvas")
      canvas.width = cw; canvas.height = ch
      canvas.getContext("2d")!.drawImage(img, 0, 0, cw, ch)
      resolve({ url: canvas.toDataURL("image/jpeg", 0.82), w, h })
    }
    img.onerror = () => { URL.revokeObjectURL(src); resolve({ error: "Não foi possível ler a imagem." }) }
    img.src = src
  })
}

export function ImageField({ hero, heroW, heroH, onChange, onClear }: {
  hero: string
  heroW?: number
  heroH?: number
  onChange: (url: string, w: number, h: number) => void
  onClear: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const pick = async (file?: File) => {
    if (!file) return
    setBusy(true); setError(null)
    const r = await processImage(file)
    setBusy(false)
    if ("error" in r) setError(r.error)
    else onChange(r.url, r.w, r.h)
  }

  return (
    <div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      {hero ? (
        <div className="group relative overflow-hidden rounded-xl border border-border">
          <img src={hero} alt="Hero" className="aspect-[16/9] w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-2.5 text-xs text-white">
            <span className="inline-flex items-center gap-1"><Check size={13} className="text-teal-300" /> {heroW && heroH ? `${heroW}×${heroH}px original` : "imagem"}</span>
            <div className="flex gap-1.5">
              <button onClick={() => ref.current?.click()} className="rounded bg-white/20 px-2 py-1 font-medium backdrop-blur hover:bg-white/30">Trocar</button>
              <button onClick={onClear} className="grid h-7 w-7 place-items-center rounded bg-white/20 backdrop-blur hover:bg-red-500/70"><Trash2 size={13} /></button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={() => ref.current?.click()} disabled={busy} className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition hover:border-primary hover:text-primary">
          <ImagePlus size={26} />
          <span className="text-sm font-medium">{busy ? "A processar…" : "Carregar foto do hero"}</span>
          <span className="text-xs">Horizontal, mínimo {MIN_HERO_W}px de largura</span>
        </button>
      )}
      {error && <p className="mt-2 flex items-start gap-1.5 text-xs text-destructive"><AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}</p>}
    </div>
  )
}
