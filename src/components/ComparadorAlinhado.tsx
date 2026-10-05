import { useId, useRef, type CSSProperties, type PointerEvent } from 'react'
import { enquadrar, proporcaoDoPar, type ParAlinhado } from '../lib/casos'
import { BarraControles, RotulosAntesDepois } from './Sorrisos'
import { CreditosMidiaPaciente, MarcaMidiaPaciente } from './MarcaMidiaPaciente'
import { useLarguraNitida, useTransicao } from './useTransicao'

export function ComparadorAlinhado({
  par,
  titulo,
  proporcao,
  className = '',
  creditos = true,
}: {
  par: ParAlinhado
  titulo: string
  /** Largura ÷ altura do quadro. Padrão: a da foto de antes, entre 0,75 e 1,5. */
  proporcao?: number
  className?: string
  creditos?: boolean
}) {
  const figura = useRef<HTMLElement>(null)
  const { divisor, reproduzindo, mover, alternar } = useTransicao(figura)
  const id = useId()
  const razao = proporcao ?? proporcaoDoPar(par)
  const camadas = enquadrar(par, razao)
  const larguraMaxima = useLarguraNitida(
    Math.min(par.antes.largura * (par.antes.recorte?.w ?? 1), par.depois.largura * (par.depois.recorte?.w ?? 1)),
  )

  function arrastar(evento: PointerEvent<HTMLDivElement>) {
    const area = evento.currentTarget.getBoundingClientRect()
    mover(((evento.clientX - area.left) / area.width) * 100)
  }

  const antes = Math.round(divisor)

  return (
    <figure ref={figura} className={`sorriso-comparador sorriso-comparador--rosto ${className}`}
      style={{ '--proporcao': razao, '--largura-nitida': `${larguraMaxima}px` } as CSSProperties}>
      <div
        className="sorriso-janela rosto-janela"
        style={{ aspectRatio: String(razao) }}
        onPointerDown={(e) => {
          if (e.button !== 0) return
          e.currentTarget.setPointerCapture(e.pointerId)
          arrastar(e)
        }}
        onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) arrastar(e) }}
        onPointerUp={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId) }}
      >
        <div className="rosto-camada">
          <img src={par.depois.src} alt={`${titulo}: depois do tratamento`} style={camadas.depois} loading="lazy" draggable={false} />
        </div>
        <div className="rosto-camada" style={{ clipPath: `inset(0 ${100 - divisor}% 0 0)` }}>
          <img src={par.antes.src} alt={`${titulo}: antes do tratamento`} style={camadas.antes} loading="lazy" draggable={false} />
        </div>
        <MarcaMidiaPaciente />
        <div className="sorriso-divisor sorriso-divisor--sutil" style={{ left: `${divisor}%` }} aria-hidden="true" />
        <RotulosAntesDepois antes={divisor > 12} depois={divisor < 88} />
      </div>
      <BarraControles
        reproduzindo={reproduzindo}
        aoVerAntes={() => mover(100)}
        aoReproduzir={alternar}
        aoVerDepois={() => mover(0)}
      />
      {/* O arraste é visual; teclado e leitores de tela usam este controle. */}
      <label htmlFor={id} className="sr-only">Comparar antes e depois: {titulo}</label>
      <input id={id} className="sr-only" type="range" min="0" max="100" value={divisor}
        aria-valuetext={`${antes} por cento antes, ${100 - antes} por cento depois`}
        onChange={(e) => mover(Number(e.target.value))} />
      {creditos && <CreditosMidiaPaciente />}
    </figure>
  )
}
