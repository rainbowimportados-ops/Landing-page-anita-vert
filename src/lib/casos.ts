import type { CSSProperties } from 'react'

/**
 * Casos de antes e depois: tipos compartilhados entre o site (que exibe) e o
 * painel /config (que importa, analisa e publica), e o cálculo de
 * enquadramento que sobrepõe antes e depois com os dentes no mesmo ponto.
 */

/** Ponto em fração da foto (0–1): x da esquerda, y do topo. */
export type Ponto = { x: number; y: number }

export type Angulo = 'frente' | 'perfil_direito' | 'perfil_esquerdo' | 'sorriso' | 'outro'

export const rotuloAngulo: Record<Angulo, string> = {
  frente: 'Rosto de frente',
  perfil_direito: 'Perfil direito',
  perfil_esquerdo: 'Perfil esquerdo',
  sorriso: 'Sorriso de perto',
  outro: 'Outro ângulo',
}

/**
 * Uma foto (ou uma metade de montagem) como o comparador a vê. `recorte`
 * seleciona a faixa horizontal usada: {x0: 0, w: 1} é a foto inteira;
 * {x0: 0.5, w: 0.5} é a metade direita de uma montagem lado a lado.
 */
export type Camada = {
  src: string
  largura: number
  altura: number
  recorte?: { x0: number; w: number }
  /** Dentes em fração do recorte. */
  dentes: Ponto
}

export type ParAlinhado = { antes: Camada; depois: Camada }

/** Foto já publicada no armazenamento público. */
export type FotoPublicada = { src: string; mini: string; largura: number; altura: number; dentes: Ponto }
export type ParPublicado = { angulo: Angulo; antes: FotoPublicada; depois: FotoPublicada }

/** O que o painel grava em landing_content para trocar a seção Resultados. */
export type CampanhaResultados = {
  casoId: string
  destaque: ParPublicado
  /** Sorriso de perto. */
  perto: ParPublicado[]
  /** Rosto inteiro, de frente e de perfil. */
  rosto: ParPublicado[]
  publicadoEm: string
}

export const camadaDe = (f: { src: string; largura: number; altura: number; dentes: Ponto }): Camada => ({
  src: f.src,
  largura: f.largura,
  altura: f.altura,
  dentes: f.dentes,
})

/**
 * Zoom máximo sobre a foto enviada. Acima disso a foto deixaria de parecer a
 * original (vira só boca e nariz): o alinhamento fica o mais próximo possível.
 */
export const ZOOM_MAXIMO = 1.12

/** Proporção (largura ÷ altura) do quadro para um par: a da foto de antes, com limites. */
export function proporcaoDoPar(par: ParAlinhado): number {
  const c = par.antes
  const w = c.largura * (c.recorte?.w ?? 1)
  return Math.min(1.5, Math.max(0.75, w / c.altura))
}

/**
 * Posiciona as duas camadas num quadro de proporção `proporcao` (largura ÷ altura)
 * com os dentes no mesmo ponto, sem ampliar além de ZOOM_MAXIMO e sem deixar
 * borda vazia. Devolve o estilo de cada <img> (absoluta dentro do quadro).
 */
export function enquadrar(par: ParAlinhado, proporcao: number, dentesNoQuadro = 0.6) {
  const alturaQuadro = 1 / proporcao // em larguras de quadro
  const medidas = [par.antes, par.depois].map((c) => {
    const r = c.recorte ?? { x0: 0, w: 1 }
    // Altura do recorte, em alturas de quadro, quando o recorte tem a largura do quadro (k = 1).
    const alturaRel = c.altura / (c.largura * r.w) / alturaQuadro
    return { c, r, alturaRel }
  })

  let melhor = { tx: 0.5, k: Infinity }
  for (let tx = 0.15; tx <= 0.85; tx += 0.005) {
    let k = 1.02
    for (const { c, alturaRel } of medidas) {
      const p = c.dentes
      k = Math.max(k, tx / p.x, (1 - tx) / (1 - p.x))
      k = Math.max(k, dentesNoQuadro / (alturaRel * p.y), (1 - dentesNoQuadro) / (alturaRel * (1 - p.y)), 1 / alturaRel)
    }
    if (k < melhor.k) melhor = { tx, k }
  }
  const k = Math.min(melhor.k, Math.max(ZOOM_MAXIMO, ...medidas.map((m) => 1 / m.alturaRel)))
  const tx = melhor.tx
  const preso = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

  const estilo = ({ c, r, alturaRel }: (typeof medidas)[number]): CSSProperties => {
    const inicio = r.x0 / r.w // onde o recorte começa, em larguras de recorte
    return {
      width: `${(k / r.w) * 100}%`,
      // Ideal: dentes em tx. Preso para o recorte cobrir o quadro inteiro.
      left: `${preso(tx - (inicio + c.dentes.x) * k, 1 - (inicio + 1) * k, -inicio * k) * 100}%`,
      top: `${preso(dentesNoQuadro - alturaRel * k * c.dentes.y, 1 - alturaRel * k, 0) * 100}%`,
    }
  }
  return { antes: estilo(medidas[0]), depois: estilo(medidas[1]) }
}
