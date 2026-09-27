import { useState } from 'react'
import { ComparadorRosto } from './ComparadorRosto'
import { ComparadorSorriso } from './Sorrisos'

// Fotos em public/assets/comparadores: enviadas pela clínica, só redimensionadas
// e convertidas para WebP. Nenhuma foi retocada.
const pasta = '/assets/comparadores'

type Vista = { url: string; mini: string; largura: number; altura: number }

function vista(nome: string, largura: number, altura: number): Vista {
  return { url: `${pasta}/${nome}.webp`, mini: `${pasta}/${nome}-mini.webp`, largura, altura }
}

/** Montagens com antes em cima e depois embaixo, divididas exatamente ao meio. */
const sorrisoPerto: Vista[] = [
  vista('caso-perto-1', 1100, 1100),
  vista('caso-perto-2', 1100, 1100),
  vista('caso-perto-3', 1100, 1375),
  vista('caso-perto-4', 1100, 1100),
  vista('caso-perto-5', 1100, 1375),
  vista('caso-perto-6', 1100, 1375),
  vista('caso-perto-7', 1100, 1956),
]

/** Montagens com antes à esquerda e depois à direita, como foram fotografadas. */
const rostoInteiro: Vista[] = [1, 2, 3, 4, 5, 6].map((n) => vista(`caso-rosto-${n}`, 1200, 1500))

function Miniaturas({ vistas, atual, escolher, rotulo }: { vistas: Vista[]; atual: number; escolher: (i: number) => void; rotulo: string }) {
  return (
    <div className="caso-miniaturas" role="group" aria-label={`Escolher vista: ${rotulo}`}>
      {vistas.map((v, i) => (
        <button key={v.url} type="button" aria-pressed={i === atual} aria-label={`${rotulo}, vista ${i + 1} de ${vistas.length}`} onClick={() => escolher(i)}>
          <img src={v.mini} alt="" width={v.largura > v.altura ? 180 : Math.round((180 * v.largura) / v.altura)} height={180} loading="lazy" />
        </button>
      ))}
    </div>
  )
}

/** Lote 8: paciente de cabelo escuro, com sorriso de perto e rosto inteiro. */
export function CasoCompleto() {
  const [perto, setPerto] = useState(0)
  const [rosto, setRosto] = useState(0)
  const vistaPerto = sorrisoPerto[perto]
  const vistaRosto = rostoInteiro[rosto]

  return (
    <article className="caso-completo glass-card" aria-labelledby="caso-completo-titulo">
      <header className="caso-completo__cabecalho">
        <p className="resultado-card__label">Um caso, todos os ângulos</p>
        <h3 id="caso-completo-titulo" className="caso-destaque__titulo">Do detalhe do sorriso ao rosto inteiro.</h3>
      </header>
      <div className="caso-completo__grade">
        <section aria-label="Sorriso de perto">
          <p className="caso-completo__subtitulo">Sorriso de perto · {sorrisoPerto.length} vistas</p>
          <ComparadorSorriso key={vistaPerto.url} registro={{ ...vistaPerto, titulo: `Sorriso de perto, vista ${perto + 1}` }} />
          <Miniaturas vistas={sorrisoPerto} atual={perto} escolher={setPerto} rotulo="Sorriso de perto" />
        </section>
        <section aria-label="Rosto inteiro">
          <p className="caso-completo__subtitulo">Rosto inteiro · {rostoInteiro.length} vistas</p>
          <ComparadorRosto key={vistaRosto.url} url={vistaRosto.url} titulo={`Rosto inteiro, vista ${rosto + 1}`} />
          <Miniaturas vistas={rostoInteiro} atual={rosto} escolher={setRosto} rotulo="Rosto inteiro" />
        </section>
      </div>
    </article>
  )
}
