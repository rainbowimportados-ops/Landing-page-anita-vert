import { useState, type CSSProperties } from 'react'
import type { ResultadoComparador } from '../config/resultados'

type Props = {
  resultado: ResultadoComparador
}

export function Comparador({ resultado }: Props) {
  const [posicao, setPosicao] = useState(54)

  function alterarPosicao(valor: number) {
    setPosicao(valor)
  }

  const estilo = { '--comparador-pos': `${posicao}%` } as CSSProperties
  const descricaoId = `comparador-ajuda-${resultado.id}`

  return (
    <div
      className="comparador"
      style={estilo}
      data-comparador={resultado.id}
    >
      <img
        className="comparador__imagem comparador__imagem--base"
        src={resultado.antes}
        alt={`${resultado.rotulo}: imagem de antes`}
        loading="lazy"
      />
      <div className="comparador__depois" aria-hidden="true">
        <img className="comparador__imagem" src={resultado.depois} alt="" />
      </div>

      <div className="comparador__rotulos" aria-hidden="true">
        <span>Antes</span>
        <span>Depois</span>
      </div>
      <span className="comparador__linha" aria-hidden="true" />
      <span className="comparador__alca" aria-hidden="true">
        <span>↔</span>
      </span>
      <input
        className="comparador__controle"
        type="range"
        min="0"
        max="100"
        step="1"
        value={posicao}
        onChange={(event) => alterarPosicao(Number(event.target.value))}
        aria-label={`Comparar ${resultado.rotulo}`}
        aria-describedby={descricaoId}
      />
      <span id={descricaoId} className="sr-only">
        Arraste para comparar. Use as setas do teclado para revelar mais ou menos do depois.
      </span>
    </div>
  )
}
