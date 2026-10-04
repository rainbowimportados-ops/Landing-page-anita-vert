import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { m, useMotionValue, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useConteudo } from '../lib/ConteudoContexto'
import foto1200 from '../assets/hero/dra-anita-1200.webp'
import foto720 from '../assets/hero/dra-anita-720.webp'
import { BotaoAncora, BotaoWhatsApp } from './CTA'
import { IconBrilho, IconEquipe, IconEscudo } from './Icon'
import { PalavrasReveladas } from './movimento/PalavrasReveladas'

// Só atributos que a clínica de fato oferece — nada de números inventados.
const atributos = [
  { Icone: IconBrilho, texto: 'Planejamento personalizado' },
  { Icone: IconEquipe, texto: 'Equipe especializada' },
  { Icone: IconEscudo, texto: 'Resultados reais' },
]

const MENSAGEM = 'Olá! Vim pelo site e gostaria de agendar uma avaliação.'
const ALT = 'Dra. Anita Matias de Almeida, do Instituto Vert, sorrindo'
const curva = [0.16, 1, 0.3, 1] as const
/** Altura ÷ largura da foto do hero (1200 × 1800). */
const PROPORCAO = 1800 / 1200
/** Altura do recorte na foto: 0 = topo, 1 = base. Mantém olhos e sorriso no quadro. */
const FOCO = 0.38

function useMidia(consulta: string): boolean {
  return useSyncExternalStore(
    (avisar) => {
      const lista = window.matchMedia(consulta)
      lista.addEventListener('change', avisar)
      return () => lista.removeEventListener('change', avisar)
    },
    () => window.matchMedia(consulta).matches,
  )
}

/**
 * Primeira dobra. No computador é uma cena: a foto começa como cartão ao lado do
 * texto e, conforme a pessoa rola, abre até ocupar a tela inteira, com a frase
 * e o botão de agendar no centro. No celular (e com `prefers-reduced-motion`)
 * fica a versão empilhada, com entrada suave e leve paralaxe na foto.
 */
export function Hero() {
  const reduzir = useReducedMotion()
  const largo = useMidia('(min-width: 1024px)')
  return largo && !reduzir ? <HeroCinema /> : <HeroPadrao animar={!reduzir} />
}

function Texto({ animar }: { animar: boolean }) {
  const { clinica } = useConteudo()
  const entra = (atraso: number) =>
    animar
      ? { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, delay: atraso, ease: curva } }
      : {}

  return (
    <>
      <m.p className="olho-linha" {...entra(0.1)}>Resultados reais</m.p>
      <h1 className="mt-5 font-display text-display-lg font-light tracking-[-0.02em] text-conteudo">
        <PalavrasReveladas texto="Sorrisos que transformam histórias." atraso={0.15} passo={0.06} />
      </h1>
      <m.p className="mt-6 max-w-md font-display text-xl leading-snug text-conteudo-suave sm:text-2xl" {...entra(0.55)}>
        Mais que estética, devolvemos confiança, bem-estar e qualidade de vida. Resultados reais, com planejamento e segurança.
      </m.p>
      <m.div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center" {...entra(0.7)}>
        <BotaoWhatsApp
          rastreio="hero_agendar"
          intencao="avaliacao"
          numero={clinica.whatsappComercial}
          mensagem={MENSAGEM}
          icone="seta"
          className="w-full whitespace-nowrap px-7 sm:w-auto"
        >
          Agendar avaliação
        </BotaoWhatsApp>
        <BotaoAncora href="#unidades" className="w-full whitespace-nowrap sm:w-auto">
          Conheça nossas unidades
        </BotaoAncora>
      </m.div>
      {/* No computador, abaixo dos botões. No celular a faixa logo abaixo já traz isso. */}
      <m.ul className="hero-selos-linha" {...entra(0.85)}>
        {atributos.map(({ Icone, texto }) => (
          <li key={texto}>
            <Icone className="h-5 w-5 shrink-0 text-conteudo" />
            {texto}
          </li>
        ))}
      </m.ul>
    </>
  )
}

function Imagem({ className = '' }: { className?: string }) {
  return (
    <img
      src={foto1200}
      srcSet={`${foto720} 720w, ${foto1200} 1200w`}
      sizes="(min-width: 1024px) 100vw, 100vw"
      alt={ALT}
      width={1200}
      height={1800}
      fetchPriority="high"
      className={className}
    />
  )
}

/** Celular e movimento reduzido: foto no topo, texto embaixo. */
function HeroPadrao({ animar }: { animar: boolean }) {
  const secao = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: secao, offset: ['start start', 'end start'] })
  const deslocamento = useTransform(scrollYProgress, [0, 1], [0, 70])

  return (
    <section id="topo" ref={secao} className="hero-claro relative overflow-hidden pt-[5.5rem]">
      <div className="container-vert relative grid gap-6 pb-10 pt-4 sm:gap-8 sm:pt-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-12">
        <div>
          <Texto animar={animar} />
        </div>
        <figure className="hero-foto order-first lg:order-none">
          {/* Entrada em câmera lenta: a foto assenta devagar, sem pressa. */}
          <m.div
            className="absolute inset-0"
            initial={animar ? { scale: 1.14, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.8, ease: curva }}
            style={animar ? { y: deslocamento } : undefined}
          >
            <Imagem />
          </m.div>
          <figcaption className="hero-foto__legenda">
            Mais que sorrisos,
            <br />
            vidas reais.
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

/** Computador: a foto abre de cartão para tela cheia no ritmo da rolagem. */
function HeroCinema() {
  const { clinica } = useConteudo()
  const secao = useRef<HTMLElement>(null)
  const palco = useRef<HTMLDivElement>(null)
  const vaga = useRef<HTMLDivElement>(null)

  // Posição do cartão dentro da tela, medida no layout real.
  const topo = useMotionValue(0)
  const direita = useMotionValue(0)
  const base = useMotionValue(0)
  const esquerda = useMotionValue(0)
  const largura = useMotionValue(1)
  const altura = useMotionValue(1)
  const [cartao, setCartao] = useState({ t: 0, r: 0, b: 0, l: 0 })

  useLayoutEffect(() => {
    const medir = () => {
      if (!palco.current || !vaga.current) return
      const p = palco.current.getBoundingClientRect()
      const v = vaga.current.getBoundingClientRect()
      const medida = { t: v.top - p.top, r: p.right - v.right, b: p.bottom - v.bottom, l: v.left - p.left }
      topo.set(medida.t)
      direita.set(medida.r)
      base.set(medida.b)
      esquerda.set(medida.l)
      largura.set(p.width)
      altura.set(p.height)
      setCartao(medida)
    }
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [topo, direita, base, esquerda, largura, altura])

  const { scrollYProgress } = useScroll({ target: secao, offset: ['start start', 'end end'] })
  const abre = useTransform(scrollYProgress, [0.03, 0.62], [0, 1], { ease: (v) => v * v * (3 - 2 * v) })

  const recorte = useTransform([abre, topo, direita, base, esquerda] as MotionValue<number>[], ([e, t, r, b, l]: number[]) => {
    const k = 1 - e
    return `inset(${t * k}px ${r * k}px ${b * k}px ${l * k}px round ${28 * k}px)`
  })
  // A foto tem a largura da tela e altura natural (retrato 2:3). No cartão ela é
  // reduzida para cobri-lo, e na tela cheia volta ao tamanho real; nos dois casos o
  // recorte vertical é o mesmo (FOCO), então o rosto e o sorriso ficam sempre no quadro.
  const quadro = useTransform([abre, topo, direita, base, esquerda, largura, altura] as MotionValue<number>[], ([e, t, r, b, l, w, h]: number[]) => {
    const alturaFoto = w * PROPORCAO
    const cw = w - l - r
    const ch = h - t - b
    const sCartao = Math.max(cw / w, ch / alturaFoto)
    const sTela = Math.max(1, h / alturaFoto)
    const cartao = { x: l + (cw - sCartao * w) / 2, y: t - (sCartao * alturaFoto - ch) * FOCO, s: sCartao }
    const tela = { x: (w - sTela * w) / 2, y: -(sTela * alturaFoto - h) * FOCO, s: sTela }
    return {
      x: cartao.x + (tela.x - cartao.x) * e,
      y: cartao.y + (tela.y - cartao.y) * e,
      s: cartao.s + (tela.s - cartao.s) * e,
    }
  })
  const fotoX = useTransform(quadro, (q) => q.x)
  const fotoY = useTransform(quadro, (q) => q.y)
  const fotoEscala = useTransform(quadro, (q) => q.s)

  const textoOpacidade = useTransform(scrollYProgress, [0, 0.24], [1, 0])
  const textoY = useTransform(scrollYProgress, [0, 0.24], [0, -50])
  const veu = useTransform(scrollYProgress, [0.35, 0.7], [0, 0.7])
  const finalOpacidade = useTransform(scrollYProgress, [0.52, 0.72], [0, 1])
  const finalY = useTransform(scrollYProgress, [0.52, 0.72], [28, 0])
  const finalCliques = useTransform(finalOpacidade, (v) => (v > 0.6 ? 'auto' : 'none'))

  return (
    <section id="topo" ref={secao} className="hero-cinema">
      <div ref={palco} className="hero-cinema__palco">
        <div className="container-vert grid h-full grid-cols-[0.8fr_1.2fr] items-center gap-12 pb-10 pt-[5.5rem]">
          <m.div style={{ opacity: textoOpacidade, y: textoY }}>
            <Texto animar />
          </m.div>
          <div ref={vaga} className="hero-cinema__vaga" aria-hidden="true" />
        </div>

        <m.figure
          className="hero-cinema__foto"
          style={{ clipPath: recorte }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, delay: 0.15, ease: curva }}
        >
          <m.div className="absolute left-0 top-0 w-full will-change-transform" style={{ x: fotoX, y: fotoY, scale: fotoEscala, transformOrigin: '0 0' }}>
            {/* Entrada em câmera lenta: a foto assenta devagar enquanto o título aparece. */}
            <m.div style={{ transformOrigin: `50% ${FOCO * 100}%` }} initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 2.2, ease: curva }}>
              <Imagem className="hero-cinema__imagem" />
            </m.div>
          </m.div>
          <m.div className="hero-cinema__veu" style={{ opacity: veu }} aria-hidden="true" />

          <m.p className="hero-foto__legenda" style={{ opacity: textoOpacidade, top: cartao.t + 24, right: cartao.r + 24, bottom: 'auto' }} aria-hidden="true">
            Mais que sorrisos,
            <br />
            vidas reais.
          </m.p>

          <m.div className="hero-cinema__final" style={{ opacity: finalOpacidade, y: finalY, pointerEvents: finalCliques }}>
            <p className="font-display text-display-lg font-light italic leading-none text-white">
              Mais que sorrisos,
              <br />
              vidas reais.
            </p>
            <BotaoWhatsApp
              rastreio="hero_final_agendar"
              intencao="avaliacao"
              numero={clinica.whatsappComercial}
              mensagem={MENSAGEM}
              variante="clara"
              icone="seta"
              className="mt-8 px-8"
            >
              Agendar avaliação
            </BotaoWhatsApp>
          </m.div>
        </m.figure>
      </div>
    </section>
  )
}
