import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { alinhamentosRosto, type Alinhamento } from '../config/alinhamentos'
import { BarraControles, RotulosAntesDepois } from './Sorrisos'
import { CreditosMidiaPaciente, MarcaMidiaPaciente } from './MarcaMidiaPaciente'

/** Altura padrão dos dentes no quadro (0 = topo, 1 = base): deixa olhos e queixo à vista. */
/**
 * Zoom máximo sobre a foto enviada. Acima disso a foto deixaria de parecer a
 * original (vira só boca e nariz): nesse caso o alinhamento fica o mais próximo
 * possível, sem ampliar mais.
 */
const ZOOM_MAXIMO = 1.12
const DENTES_NO_QUADRO = 0.6
const PADRAO: Alinhamento = { antes: { x: 0.5, y: 0.45 }, depois: { x: 0.5, y: 0.45 } }

/**
 * Enquadramento das duas metades no mesmo quadro retrato (4:5), com os dentes
 * de antes e de depois no mesmo ponto. Escolhe a posição horizontal dos dentes
 * e o menor zoom que cobrem o quadro inteiro nas duas fotos, sem sobrar borda.
 */
function enquadrar({ antes, depois, dentesNoQuadro = DENTES_NO_QUADRO }: Alinhamento) {
  const proporcaoMetade = 1500 / 600 // altura ÷ largura de cada metade
  const proporcaoQuadro = 5 / 4
  let melhor = { tx: 0.5, k: Infinity }
  for (let tx = 0.2; tx <= 0.8; tx += 0.005) {
    let k = 1.04
    for (const p of [antes, depois]) {
      k = Math.max(k, tx / p.x, (1 - tx) / (1 - p.x))
      // vertical: a metade (altura proporcaoMetade·k em larguras de quadro) cobre o quadro
      const alturaRel = proporcaoMetade / proporcaoQuadro // altura da metade ÷ altura do quadro, com k = 1
      k = Math.max(k, dentesNoQuadro / (alturaRel * p.y), (1 - dentesNoQuadro) / (alturaRel * (1 - p.y)))
    }
    if (k < melhor.k) melhor = { tx, k }
  }
  melhor.k = Math.min(melhor.k, ZOOM_MAXIMO)
  const alturaRel = proporcaoMetade / proporcaoQuadro
  const { k, tx } = melhor
  // Posição ideal (dentes no ponto comum), presa ao intervalo em que a metade
  // ainda cobre o quadro inteiro: nunca aparece borda vazia.
  const preso = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
  const camada = (p: { x: number; y: number }, deslocamento: 0 | 1): CSSProperties => ({
    width: `${200 * k}%`,
    left: `${preso(tx - (deslocamento + p.x) * k, 1 - (deslocamento + 1) * k, -deslocamento * k) * 100}%`,
    top: `${preso(dentesNoQuadro - alturaRel * k * p.y, 1 - alturaRel * k, 0) * 100}%`,
  })
  return { antes: camada(antes, 0), depois: camada(depois, 1) }
}

/**
 * Comparador de rosto para montagens com antes à esquerda e depois à direita.
 * Cada foto ocupa o quadro inteiro e as duas ficam sobrepostas com os dentes
 * alinhados: arrastar para a direita mostra mais do antes, para a esquerda
 * mais do depois, e no meio as duas ficam lado a lado.
 */
export function ComparadorRosto({ url, titulo, className = '' }: { url: string; titulo: string; className?: string }) {
  const [divisor, setDivisor] = useState(50)
  const [reproduzindo, setReproduzindo] = useState(false)
  const quadro = useRef(0)
  const id = useId()
  const camadas = enquadrar(alinhamentosRosto[url] ?? PADRAO)
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
    <figure className={`sorriso-comparador sorriso-comparador--rosto ${className}`}>
      <div
        className="sorriso-janela rosto-janela"
        onPointerDown={(e) => {
          if (e.button !== 0) return
          e.currentTarget.setPointerCapture(e.pointerId)
          arrastar(e)
        }}
        onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) arrastar(e) }}
        onPointerUp={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId) }}
      >
        <div className="rosto-camada">
          <img src={url} alt={`${titulo}: depois do tratamento`} style={camadas.depois} loading="lazy" draggable={false} />
        </div>
        <div className="rosto-camada" style={{ clipPath: `inset(0 ${100 - divisor}% 0 0)` }}>
          <img src={url} alt={`${titulo}: antes do tratamento`} style={camadas.antes} loading="lazy" draggable={false} />
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
      <CreditosMidiaPaciente />
    </figure>
  )
}
