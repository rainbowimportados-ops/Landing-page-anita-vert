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

export function ComparadorSorriso({ registro }: { registro: typeof registros[number] }) {
  const [posicao, setPosicao] = useState(50)
  const [reproduzindo, setReproduzindo] = useState(false)
  const [carregou, setCarregou] = useState(false)
  const [falhou, setFalhou] = useState(false)
  const quadro = useRef(0)
  const id = useId()
  useEffect(() => () => cancelAnimationFrame(quadro.current), [])

  function parar() {
    cancelAnimationFrame(quadro.current)
    setReproduzindo(false)
  }
  function mostrar(valor: number) {
    parar()
    setPosicao(Math.max(0, Math.min(100, valor)))
  }
  function arrastar(evento: PointerEvent<HTMLDivElement>) {
    const area = evento.currentTarget.getBoundingClientRect()
    mostrar((evento.clientX - area.left) / area.width * 100)
  }
  function reproduzir() {
    parar()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPosicao(100)
      return
    }
    setReproduzindo(true)
    const inicio = performance.now()
    setPosicao(0)
    function passo(agora: number) {
      const progresso = Math.min(1, (agora - inicio) / 2400)
      setPosicao(progresso * progresso * (3 - 2 * progresso) * 100)
      if (progresso < 1) quadro.current = requestAnimationFrame(passo)
      else setReproduzindo(false)
    }
    quadro.current = requestAnimationFrame(passo)
  }

  return (
    <figure className="sorriso-comparador">
      <div className="sorriso-janela" style={{ aspectRatio: `${registro.largura} / ${registro.altura / 2}` }}
        onPointerDown={(e) => {
          if (e.button !== 0 || !carregou || falhou) return
          e.currentTarget.setPointerCapture(e.pointerId)
          arrastar(e)
        }}
        onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) arrastar(e) }}
        onPointerUp={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId) }}>
        <div className="sorriso-metade">
          <img src={registro.url} alt={`${registro.titulo}: antes do tratamento`} width={registro.largura} height={registro.altura} loading="lazy" draggable={false}
            onLoad={() => setCarregou(true)} onError={() => setFalhou(true)} />
        </div>
        <div className="sorriso-metade sorriso-depois" style={{ clipPath: `inset(0 ${100 - posicao}% 0 0)` }}>
          <img src={registro.url} alt={`${registro.titulo}: depois do tratamento`} width={registro.largura} height={registro.altura} loading="lazy" draggable={false} />
        </div>
        <div className="sorriso-divisor" style={{ left: `${posicao}%` }} aria-hidden="true"><span>↔</span></div>
        <div className="sorriso-rotulos" aria-hidden="true">
          <span style={{ visibility: posicao > 12 ? 'visible' : 'hidden' }}>Depois</span>
          <span style={{ visibility: posicao < 88 ? 'visible' : 'hidden' }}>Antes</span>
        </div>
      </div>
      {falhou && <p role="status">Não foi possível carregar a foto. Tente atualizar a página.</p>}
      <figcaption className="sorriso-controles">
        <label htmlFor={id}>Arraste para comparar <span>{Math.round(posicao)}% do depois</span></label>
        <input id={id} type="range" min="0" max="100" value={posicao} disabled={!carregou || falhou}
          aria-label={`Revelar depois: ${registro.titulo}`} aria-valuetext={`${Math.round(posicao)} por cento do depois`}
          onChange={(e) => mostrar(Number(e.target.value))} />
        <div className="sorriso-acoes">
          <button type="button" onClick={() => mostrar(0)} disabled={!carregou || falhou}>Ver antes</button>
          <button type="button" onClick={reproduzindo ? parar : reproduzir} disabled={!carregou || falhou}>{reproduzindo ? 'Pausar' : 'Reproduzir transição'}</button>
          <button type="button" onClick={() => mostrar(100)} disabled={!carregou || falhou}>Ver depois</button>
        </div>
      </figcaption>
    </figure>
  )
}
