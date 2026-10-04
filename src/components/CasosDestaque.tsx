import { useState, type ReactNode } from 'react'
import { camadaDe, type ParPublicado } from '../lib/casos'
import { useConteudo } from '../lib/ConteudoContexto'
import { ComparadorAlinhado } from './ComparadorAlinhado'
import { ComparadorRosto } from './ComparadorRosto'
import { ComparadorSorriso } from './Sorrisos'
import { MarcaMidiaPaciente } from './MarcaMidiaPaciente'

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

function Miniaturas({ vistas, atual, escolher, rotulo }: { vistas: Item[]; atual: number; escolher: (i: number) => void; rotulo: string }) {
  return (
    <div className="caso-miniaturas" role="group" aria-label={`Escolher vista: ${rotulo}`}>
      {vistas.map((v, i) => (
        <button key={v.chave} type="button" aria-pressed={i === atual} aria-label={`${rotulo}, vista ${i + 1} de ${vistas.length}`} onClick={() => escolher(i)}>
          <img src={v.mini} alt="" width={v.largura > v.altura ? 180 : Math.round((180 * v.largura) / v.altura)} height={180} loading="lazy" />
          <MarcaMidiaPaciente miniatura />
        </button>
      ))}
    </div>
  )
}

type Item = { chave: string; mini: string; largura: number; altura: number; comparador: (titulo: string) => ReactNode }

/** Fotos fixas do site: lote 8, paciente de cabelo escuro. */
const pertoFixo: Item[] = sorrisoPerto.map((v) => ({
  chave: v.url,
  mini: v.mini,
  largura: v.largura,
  altura: v.altura,
  comparador: (titulo) => <ComparadorSorriso key={v.url} registro={{ ...v, titulo }} />,
}))
const rostoFixo: Item[] = rostoInteiro.map((v) => ({
  chave: v.url,
  mini: v.mini,
  largura: v.largura,
  altura: v.altura,
  comparador: (titulo) => <ComparadorRosto key={v.url} url={v.url} titulo={titulo} />,
}))

/** Pares publicados pelo painel: fotos soltas, alinhadas pelos dentes. */
function itensDaCampanha(pares: ParPublicado[], proporcao?: number): Item[] {
  return pares.map((p) => ({
    chave: p.depois.src,
    mini: p.depois.mini,
    largura: p.depois.largura,
    altura: p.depois.altura,
    comparador: (titulo) => (
      <ComparadorAlinhado key={p.depois.src} par={{ antes: camadaDe(p.antes), depois: camadaDe(p.depois) }} titulo={titulo} proporcao={proporcao} />
    ),
  }))
}

export function CasoCompleto() {
  const { resultados: campanha } = useConteudo()
  const perto = campanha ? itensDaCampanha(campanha.perto) : pertoFixo
  const rosto = campanha ? itensDaCampanha(campanha.rosto, 0.8) : rostoFixo
  const [iPerto, setPerto] = useState(0)
  const [iRosto, setRosto] = useState(0)
  // No celular as duas vistas não cabem juntas na tela: abas escolhem uma.
  const [aba, setAba] = useState<'perto' | 'rosto'>(perto.length ? 'perto' : 'rosto')
  if (!perto.length && !rosto.length) return null
  const vistaPerto = perto[Math.min(iPerto, perto.length - 1)]
  const vistaRosto = rosto[Math.min(iRosto, rosto.length - 1)]
  const duas = perto.length > 0 && rosto.length > 0

  return (
    <article className="caso-completo glass-card" aria-labelledby="caso-completo-titulo">
      <header className="caso-completo__cabecalho">
        <p className="resultado-card__label">Um caso, todos os ângulos</p>
        <h3 id="caso-completo-titulo" className="caso-destaque__titulo">Do detalhe do sorriso ao rosto inteiro.</h3>
      </header>
      {duas && (
        <div className="caso-completo__abas" role="tablist" aria-label="Escolha a vista">
          <button type="button" role="tab" aria-selected={aba === 'perto'} onClick={() => setAba('perto')}>Sorriso de perto</button>
          <button type="button" role="tab" aria-selected={aba === 'rosto'} onClick={() => setAba('rosto')}>Rosto inteiro</button>
        </div>
      )}
      <div className={`caso-completo__grade ${duas ? '' : 'caso-completo__grade--uma'}`} data-aba={duas ? aba : undefined}>
        {vistaPerto && (
          <section aria-label="Sorriso de perto">
            <p className="caso-completo__subtitulo">Sorriso de perto · {perto.length} {perto.length === 1 ? 'vista' : 'vistas'}</p>
            {vistaPerto.comparador(`Sorriso de perto, vista ${iPerto + 1}`)}
            {perto.length > 1 && <Miniaturas vistas={perto} atual={iPerto} escolher={setPerto} rotulo="Sorriso de perto" />}
          </section>
        )}
        {vistaRosto && (
          <section aria-label="Rosto inteiro">
            <p className="caso-completo__subtitulo">Rosto inteiro · {rosto.length} {rosto.length === 1 ? 'vista' : 'vistas'}</p>
            {vistaRosto.comparador(`Rosto inteiro, vista ${iRosto + 1}`)}
            {rosto.length > 1 && <Miniaturas vistas={rosto} atual={iRosto} escolher={setRosto} rotulo="Rosto inteiro" />}
          </section>
        )}
      </div>
    </article>
  )
}
