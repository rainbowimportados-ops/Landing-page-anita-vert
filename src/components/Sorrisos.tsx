import { useEffect, useId, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import frontal from '../assets/sorrisos/sorriso-frontal.jpg'
import detalhe from '../assets/sorrisos/sorriso-detalhe.jpg'
import angulo from '../assets/sorrisos/sorriso-angulo.jpg'
import './sorrisos.css'

// Montagens originais: antes em cima e depois embaixo, confirmado pelo responsável.
// A janela apenas revela cada metade; não há retoque, morphing ou geração de dentes.
export const registros = [
  { url: frontal, titulo: 'Sorriso de frente', largura: 1642, altura: 2048 },
  { url: detalhe, titulo: 'Detalhes do sorriso', largura: 1642, altura: 2048 },
  { url: angulo, titulo: 'Outro ângulo', largura: 2048, altura: 2048 },
]

/**
 * `divisor` é a posição da linha, em % da largura: à esquerda fica o ANTES,
 * à direita o DEPOIS (convenção de leitura). 100 = só antes, 0 = só depois.
 */
export function ComparadorSorriso({ registro }: { registro: typeof registros[number] }) {
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
    <figure className="sorriso-comparador">
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
        <div className="sorriso-divisor" style={{ left: `${divisor}%` }} aria-hidden="true"><span>↔</span></div>
        <div className="sorriso-rotulos" aria-hidden="true">
          <span style={{ visibility: divisor > 12 ? 'visible' : 'hidden' }}>Antes</span>
          <span style={{ visibility: divisor < 88 ? 'visible' : 'hidden' }}>Depois</span>
        </div>
        <span className="sorriso-selo">Resultado real · Instituto Vert</span>
      </div>
      {falhou && <p role="status">Não foi possível carregar a foto. Tente atualizar a página.</p>}
      <figcaption className="sorriso-controles">
        <label htmlFor={id}>Arraste para comparar <span>{antes}% antes · {depois}% depois</span></label>
        <input id={id} type="range" min="0" max="100" value={divisor} disabled={bloqueado}
          aria-label={`Comparar antes e depois: ${registro.titulo}`} aria-valuetext={`${antes} por cento antes, ${depois} por cento depois`}
          onChange={(e) => mover(Number(e.target.value))} />
        <div className="sorriso-acoes">
          <button type="button" onClick={() => mover(100)} disabled={bloqueado}>Ver antes</button>
          <button type="button" onClick={reproduzindo ? parar : reproduzir} disabled={bloqueado}>{reproduzindo ? 'Pausar' : 'Reproduzir transição'}</button>
          <button type="button" onClick={() => mover(0)} disabled={bloqueado}>Ver depois</button>
        </div>
      </figcaption>
    </figure>
  )
}
