import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react'

/**
 * Posição da linha dos comparadores de antes e depois, com reprodução
 * automática lenta.
 *
 * Quando o comparador entra na tela, a linha mostra o antes e então revela o
 * depois devagar, para e volta — em ciclo, enquanto estiver visível. Basta a
 * pessoa arrastar a linha ou tocar em "Ver antes"/"Ver depois" para assumir o
 * controle: a reprodução para e só volta pelo botão "Reproduzir transição".
 * Com "reduzir movimento" ativado no sistema, nada se move sozinho.
 *
 * `divisor` é a posição da linha em % da largura: 100 = só antes, 0 = só depois.
 */

/** Trechos do ciclo: [destino da linha, duração em ms]. Destino nulo = pausa. */
const ABERTURA: Array<[number | null, number]> = [[100, 2200], [null, 1300]]
const CICLO: Array<[number | null, number]> = [
  [0, 6000], // revela o depois, devagar
  [null, 2600],
  [100, 6000], // volta para o antes
  [null, 1600],
]

/** Aceleração e desaceleração suaves, sem tranco nas pontas. */
const suave = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2

const reduzMovimento = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function useTransicao(alvo: RefObject<HTMLElement | null>, pronto = true) {
  const [divisor, setDivisorEstado] = useState(50)
  const [reproduzindo, setReproduzindo] = useState(false)
  const posicao = useRef(50)
  const quadro = useRef(0)
  const visivel = useRef(false)
  /** A pessoa assumiu o controle: a reprodução automática não volta sozinha. */
  const manual = useRef(false)
  const trecho = useRef({ lista: ABERTURA, indice: 0, inicio: 0, de: 50 })

  const definir = useCallback((valor: number) => {
    posicao.current = valor
    setDivisorEstado(valor)
  }, [])

  const pausar = useCallback(() => {
    cancelAnimationFrame(quadro.current)
    quadro.current = 0
    setReproduzindo(false)
  }, [])

  const iniciar = useCallback(
    (doComeco: boolean) => {
      cancelAnimationFrame(quadro.current)
      if (doComeco) trecho.current = { lista: ABERTURA, indice: 0, inicio: performance.now(), de: posicao.current }
      else trecho.current = { ...trecho.current, inicio: performance.now(), de: posicao.current }
      setReproduzindo(true)
      const passo = (agora: number) => {
        const t = trecho.current
        const [destino, duracao] = t.lista[t.indice]
        const progresso = Math.min(1, (agora - t.inicio) / duracao)
        if (destino !== null) definir(t.de + (destino - t.de) * suave(progresso))
        if (progresso >= 1) {
          const fim = t.indice + 1 >= t.lista.length
          trecho.current = {
            lista: fim ? CICLO : t.lista,
            indice: fim ? 0 : t.indice + 1,
            inicio: agora,
            de: posicao.current,
          }
        }
        quadro.current = requestAnimationFrame(passo)
      }
      quadro.current = requestAnimationFrame(passo)
    },
    [definir],
  )

  // Começa ao entrar na tela e pausa ao sair (sem gastar bateria fora de vista).
  useEffect(() => {
    const elemento = alvo.current
    if (!elemento || !pronto || reduzMovimento()) return
    const observador = new IntersectionObserver(
      ([entrada]) => {
        visivel.current = entrada.isIntersecting
        if (manual.current) return
        if (entrada.isIntersecting) iniciar(!quadro.current && trecho.current.lista === ABERTURA && trecho.current.indice === 0)
        else pausar()
      },
      { threshold: 0.35 },
    )
    observador.observe(elemento)
    return () => {
      observador.disconnect()
      cancelAnimationFrame(quadro.current)
    }
  }, [alvo, pronto, iniciar, pausar])

  /** Arraste, teclado e botões Ver antes/Ver depois: a pessoa assume o controle. */
  const mover = useCallback(
    (valor: number) => {
      manual.current = true
      pausar()
      definir(Math.max(0, Math.min(100, valor)))
    },
    [definir, pausar],
  )

  /** Botão Reproduzir/Pausar. */
  const alternar = useCallback(() => {
    if (quadro.current) {
      manual.current = true
      pausar()
      return
    }
    if (reduzMovimento()) {
      mover(posicao.current > 50 ? 0 : 100)
      return
    }
    manual.current = false
    // Retoma o ciclo pelo trecho que revela o depois.
    trecho.current = { lista: CICLO, indice: posicao.current > 50 ? 0 : 2, inicio: 0, de: posicao.current }
    iniciar(false)
  }, [iniciar, mover, pausar])

  return { divisor, reproduzindo, mover, alternar }
}

/** Quanto a foto pode ser ampliada na tela antes de perder nitidez visível. */
const AMPLIACAO_MAXIMA = 1.3

const densidade = () => window.devicePixelRatio || 1
const assinarDensidade = (avisar: () => void) => {
  const consulta = window.matchMedia(`(resolution: ${densidade()}dppx)`)
  consulta.addEventListener('change', avisar)
  return () => consulta.removeEventListener('change', avisar)
}

/**
 * Largura máxima (px de tela) em que a foto ainda aparece nítida: o comparador
 * nunca estica a imagem além da resolução que ela tem. Em celular há um piso,
 * para não ficar pequeno demais.
 */
export function useLarguraNitida(larguraVisivelDaFoto: number) {
  const dpr = useSyncExternalStore(assinarDensidade, densidade, () => 1)
  return Math.max(340, Math.round((larguraVisivelDaFoto * AMPLIACAO_MAXIMA) / dpr))
}
