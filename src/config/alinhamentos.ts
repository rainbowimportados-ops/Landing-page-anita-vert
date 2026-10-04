/**
 * Posição dos dentes em cada metade das montagens de rosto (antes à esquerda,
 * depois à direita), em fração da largura e da altura da metade. Medido foto a
 * foto: o comparador usa isso para sobrepor antes e depois com os dentes no
 * mesmo lugar. Ao trocar uma foto, meça de novo.
 */
export type PontoDentes = { x: number; y: number }
export type Alinhamento = {
  antes: PontoDentes
  depois: PontoDentes
  /** Altura dos dentes no quadro (0 = topo, 1 = base). Padrão 0,6. */
  dentesNoQuadro?: number
}

export const alinhamentosRosto: Record<string, Alinhamento> = {
  // Rostos em posições bem diferentes nas duas metades: alinhar os dentes pede zoom
  // (~1,8×), então o quadro mostra do nariz ao queixo, com os dentes mais abaixo.
  '/assets/comparadores/rosto-antes-depois.webp': { antes: { x: 0.28, y: 0.605 }, depois: { x: 0.73, y: 0.615 }, dentesNoQuadro: 0.7 },
  '/assets/comparadores/caso-rosto-1.webp': { antes: { x: 0.53, y: 0.427 }, depois: { x: 0.5, y: 0.421 } },
  '/assets/comparadores/caso-rosto-2.webp': { antes: { x: 0.51, y: 0.465 }, depois: { x: 0.53, y: 0.452 } },
  '/assets/comparadores/caso-rosto-3.webp': { antes: { x: 0.69, y: 0.433 }, depois: { x: 0.7, y: 0.426 } },
  '/assets/comparadores/caso-rosto-4.webp': { antes: { x: 0.65, y: 0.455 }, depois: { x: 0.58, y: 0.446 } },
  '/assets/comparadores/caso-rosto-5.webp': { antes: { x: 0.39, y: 0.421 }, depois: { x: 0.39, y: 0.416 } },
  '/assets/comparadores/caso-rosto-6.webp': { antes: { x: 0.46, y: 0.46 }, depois: { x: 0.35, y: 0.436 } },
}
