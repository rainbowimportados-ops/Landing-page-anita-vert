import Lenis from 'lenis'

/**
 * Rolagem suave no computador (roda do mouse e trackpad). No toque o navegador
 * continua nativo, que já é suave e é o que a pessoa espera no celular.
 * Não liga com `prefers-reduced-motion` e não age dentro de diálogos
 * (formulário de captação e aviso de privacidade).
 */
export function iniciarRolagemSuave(): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  const lenis = new Lenis({
    lerp: 0.085,
    wheelMultiplier: 0.9,
    anchors: { offset: -80 },
    prevent: (no) => !!no.closest?.('dialog, [data-lenis-prevent]'),
  })

  let quadro = 0
  const passo = (tempo: number) => {
    lenis.raf(tempo)
    quadro = requestAnimationFrame(passo)
  }
  quadro = requestAnimationFrame(passo)

  return () => {
    cancelAnimationFrame(quadro)
    lenis.destroy()
  }
}
