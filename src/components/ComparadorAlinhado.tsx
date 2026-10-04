import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { enquadrar, proporcaoDoPar, type ParAlinhado } from '../lib/casos'
import { BarraControles, RotulosAntesDepois } from './Sorrisos'
import { CreditosMidiaPaciente, MarcaMidiaPaciente } from './MarcaMidiaPaciente'

/**
 * Comparador de arrastar com antes e depois sobrepostos e os dentes no mesmo
 * ponto. Cada foto ocupa o quadro inteiro: arrastar para a direita mostra mais
 * do antes, para a esquerda mais do depois; no meio ficam lado a lado.
 * Serve tanto para montagens (metades de uma imagem) quanto para fotos soltas.
 */
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
  const [divisor, setDivisor] = useState(50)
  const [reproduzindo, setReproduzindo] = useState(false)
  const quadro = useRef(0)
  const id = useId()
  const razao = proporcao ?? proporcaoDoPar(par)
  const camadas = enquadrar(par, razao)
  useEffect(() => () => cancelAnimationFrame(quadro.current), [])

  function parar() {
    cancelAnimationFrame(quadro.current)
    setReproduzindo(false)
  }
  function mover(valor: number) {
    parar()
    setDivisor(Math.max(0, Math.min(100, valor)))
  }
  function arrastar(evento: PointerEvent<HTMLDivElement>) {
    const area = evento.currentTarget.getBoundingClientRect()
    mover(((evento.clientX - area.left) / area.width) * 100)
  }
  /** Transição do antes para o depois: a linha corre da direita para a esquerda. */
  function reproduzir() {
    parar()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDivisor(0)
      return
    }
    setReproduzindo(true)
    const inicio = performance.now()
    setDivisor(100)
    function passo(agora: number) {
      const progresso = Math.min(1, (agora - inicio) / 2600)
      const suave = progresso * progresso * (3 - 2 * progresso)
      setDivisor(100 - suave * 100)
      if (progresso < 1) quadro.current = requestAnimationFrame(passo)
      else setReproduzindo(false)
    }
    quadro.current = requestAnimationFrame(passo)
  }

  const antes = Math.round(divisor)

  return (
    <figure className={`sorriso-comparador sorriso-comparador--rosto ${className}`} style={{ '--proporcao': razao } as CSSProperties}>
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
        aoReproduzir={reproduzindo ? parar : reproduzir}
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
