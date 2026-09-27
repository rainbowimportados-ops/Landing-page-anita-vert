import { useEffect, useRef, useState } from 'react'
import { BarraControles, RotulosAntesDepois, SeloResultado } from './Sorrisos'

type Modo = 'ambos' | 'antes' | 'depois'

/**
 * Comparador para montagens com antes à esquerda e depois à direita, como a
 * foto foi feita. Os enquadramentos das duas metades não coincidem, então não
 * há sobreposição: "Ver antes" e "Ver depois" destacam uma metade (a outra
 * escurece), e a transição percorre antes → depois → as duas lado a lado.
 */
export function ComparadorRosto({
  url,
  titulo,
  className = '',
  focoVertical = 42,
}: {
  url: string
  titulo: string
  className?: string
  /** Altura do rosto na foto, em % (posição vertical do enquadramento). */
  focoVertical?: number
}) {
  const [modo, setModo] = useState<Modo>('ambos')
  const [reproduzindo, setReproduzindo] = useState(false)
  const temporizadores = useRef<number[]>([])

  const limpar = () => {
    temporizadores.current.forEach((t) => window.clearTimeout(t))
    temporizadores.current = []
    setReproduzindo(false)
  }
  useEffect(() => limpar, [])

  function escolher(novo: Modo) {
    limpar()
    setModo((atual) => (atual === novo ? 'ambos' : novo))
  }

  function reproduzir() {
    limpar()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setModo('ambos')
      return
    }
    setReproduzindo(true)
    setModo('antes')
    temporizadores.current = [
      window.setTimeout(() => setModo('depois'), 1600),
      window.setTimeout(() => {
        setModo('ambos')
        setReproduzindo(false)
      }, 3400),
    ]
  }

  const descricao = {
    ambos: `${titulo}: antes à esquerda e depois à direita`,
    antes: `${titulo}: antes do tratamento`,
    depois: `${titulo}: depois do tratamento`,
  }[modo]

  return (
    <figure className={`sorriso-comparador ${className}`}>
      <div className="sorriso-janela rosto-janela">
        <div className="rosto-foto" role="img" aria-label={descricao} style={{ backgroundImage: `url(${url})`, backgroundPosition: `50% ${focoVertical}%` }} />
        <div className="rosto-veu rosto-veu--antes" data-ativo={modo === 'depois'} aria-hidden="true" />
        <div className="rosto-veu rosto-veu--depois" data-ativo={modo === 'antes'} aria-hidden="true" />
        <div className="sorriso-divisor" style={{ left: '50%' }}>
          <button type="button" className="rosto-alca" onClick={reproduzir} aria-label="Reproduzir transição do antes para o depois">
            ‹ ›
          </button>
        </div>
        <RotulosAntesDepois antes={modo !== 'depois'} depois={modo !== 'antes'} />
        <BarraControles
          reproduzindo={reproduzindo}
          aoVerAntes={() => escolher('antes')}
          aoReproduzir={reproduzindo ? () => { limpar(); setModo('ambos') } : reproduzir}
          aoVerDepois={() => escolher('depois')}
        />
        <SeloResultado />
      </div>
      <p className="sr-only" aria-live="polite">{reproduzindo ? '' : descricao}</p>
    </figure>
  )
}
