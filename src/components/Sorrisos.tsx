import { useEffect, useId, useRef, useState } from 'react'
import type { PointerEvent, ReactNode } from 'react'
import { IconImagem, IconPausa, IconPlay } from './Icon'
import './sorrisos.css'

// Montagens originais: antes em cima e depois embaixo. A janela apenas revela
// cada metade; não há retoque, morphing ou geração de dentes.
export type Registro = { url: string; titulo: string; largura: number; altura: number }

/** Barra de controles de vidro sobre a foto, igual para todos os comparadores. */
export function BarraControles({
  reproduzindo,
  bloqueado = false,
  aoVerAntes,
  aoReproduzir,
  aoVerDepois,
}: {
  reproduzindo: boolean
  bloqueado?: boolean
  aoVerAntes: () => void
  aoReproduzir: () => void
  aoVerDepois: () => void
}) {
  const parar = (e: PointerEvent) => e.stopPropagation()
  return (
    <div className="sorriso-barra" onPointerDown={parar}>
      <button type="button" onClick={aoVerAntes} disabled={bloqueado}>
        <IconImagem className="h-[18px] w-[18px]" /> <span>Ver antes</span>
      </button>
      <button type="button" onClick={aoReproduzir} disabled={bloqueado}>
        {reproduzindo ? <IconPausa className="h-[18px] w-[18px]" /> : <IconPlay className="h-[18px] w-[18px]" />}
        <span className="rotulo-longo">{reproduzindo ? 'Pausar' : 'Reproduzir transição'}</span>
        <span className="rotulo-curto" aria-hidden="true">{reproduzindo ? 'Pausar' : 'Reproduzir'}</span>
      </button>
      <button type="button" onClick={aoVerDepois} disabled={bloqueado}>
        <IconImagem className="h-[18px] w-[18px]" /> <span>Ver depois</span>
      </button>
    </div>
  )
}

export function SeloResultado() {
  return (
    <span className="sorriso-selo">
      Resultado real
      <br />
      Instituto VERT
    </span>
  )
}

export function RotulosAntesDepois({ antes = true, depois = true }: { antes?: boolean; depois?: boolean }) {
  return (
    <div className="sorriso-rotulos" aria-hidden="true">
      <span style={{ visibility: antes ? 'visible' : 'hidden' }}>Antes</span>
      <span style={{ visibility: depois ? 'visible' : 'hidden' }}>Depois</span>
    </div>
  )
}

/**
 * `divisor` é a posição da linha, em % da largura: à esquerda fica o ANTES,
 * à direita o DEPOIS (convenção de leitura). 100 = só antes, 0 = só depois.
 */
export function ComparadorSorriso({
  registro,
  className = '',
  children,
}: {
  registro: Registro
  className?: string
  children?: ReactNode
}) {
  const [divisor, setDivisor] = useState(50)
  const [reproduzindo, setReproduzindo] = useState(false)
  const [carregou, setCarregou] = useState(false)
  const [falhou, setFalhou] = useState(false)
  const quadro = useRef(0)
  const id = useId()
  const bloqueado = !carregou || falhou
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
      const progresso = Math.min(1, (agora - inicio) / 2400)
      const suave = progresso * progresso * (3 - 2 * progresso)
      setDivisor(100 - suave * 100)
      if (progresso < 1) quadro.current = requestAnimationFrame(passo)
      else setReproduzindo(false)
    }
    quadro.current = requestAnimationFrame(passo)
  }

  const antes = Math.round(divisor)
  const depois = 100 - antes

  return (
    <figure className={`sorriso-comparador ${className}`}>
      <div className="sorriso-janela" style={{ aspectRatio: `${registro.largura} / ${registro.altura / 2}` }}
        onPointerDown={(e) => {
          if (e.button !== 0 || bloqueado) return
          e.currentTarget.setPointerCapture(e.pointerId)
          arrastar(e)
        }}
        onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) arrastar(e) }}
        onPointerUp={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId) }}>
        <div className="sorriso-metade sorriso-depois">
          <img src={registro.url} alt={`${registro.titulo}: depois do tratamento`} width={registro.largura} height={registro.altura} loading="lazy" draggable={false}
            onLoad={() => setCarregou(true)} onError={() => setFalhou(true)} />
        </div>
        <div className="sorriso-metade" style={{ clipPath: `inset(0 ${100 - divisor}% 0 0)` }}>
          <img src={registro.url} alt={`${registro.titulo}: antes do tratamento`} width={registro.largura} height={registro.altura} loading="lazy" draggable={false} />
        </div>
        <div className="sorriso-divisor" style={{ left: `${divisor}%` }} aria-hidden="true"><span>‹ ›</span></div>
        <RotulosAntesDepois antes={divisor > 12} depois={divisor < 88} />
        <BarraControles reproduzindo={reproduzindo} bloqueado={bloqueado}
          aoVerAntes={() => mover(100)} aoReproduzir={reproduzindo ? parar : reproduzir} aoVerDepois={() => mover(0)} />
        <SeloResultado />
        {children}
      </div>
      {falhou && <p role="status" className="mt-2 text-sm">Não foi possível carregar a foto. Tente atualizar a página.</p>}
      {/* O arraste é visual; teclado e leitores de tela usam este controle. */}
      <label htmlFor={id} className="sr-only">Comparar antes e depois: {registro.titulo}</label>
      <input id={id} className="sr-only" type="range" min="0" max="100" value={divisor} disabled={bloqueado}
        aria-valuetext={`${antes} por cento antes, ${depois} por cento depois`}
        onChange={(e) => mover(Number(e.target.value))} />
    </figure>
  )
}
