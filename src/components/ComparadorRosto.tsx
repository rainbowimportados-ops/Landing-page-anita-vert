import { alinhamentosRosto } from '../config/alinhamentos'
import { ComparadorAlinhado } from './ComparadorAlinhado'

/** Montagens de 1200 × 1500 com antes à esquerda e depois à direita. */
const LARGURA = 1200
const ALTURA = 1500

/**
 * Comparador para as montagens fixas do site (antes à esquerda, depois à
 * direita). As posições dos dentes vêm de config/alinhamentos.ts.
 */
export function ComparadorRosto({ url, titulo, className = '' }: { url: string; titulo: string; className?: string }) {
  const alinhamento = alinhamentosRosto[url] ?? { antes: { x: 0.5, y: 0.45 }, depois: { x: 0.5, y: 0.45 } }
  const metade = (x0: number, dentes: { x: number; y: number }) => ({
    src: url,
    largura: LARGURA,
    altura: ALTURA,
    recorte: { x0, w: 0.5 },
    dentes,
  })
  return (
    <ComparadorAlinhado
      par={{ antes: metade(0, alinhamento.antes), depois: metade(0.5, alinhamento.depois) }}
      titulo={titulo}
      proporcao={0.8}
      className={className}
    />
  )
}
