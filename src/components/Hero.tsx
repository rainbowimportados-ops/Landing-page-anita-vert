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
      ? { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 1, delay: atraso, ease: curva } }
      : {}

  return (
    <>
      <m.p className="olho-linha" {...entra(0.1)}>Resultados reais</m.p>
      <h1 className="mt-5 font-display text-display-lg font-light tracking-[-0.02em] text-conteudo">
        <PalavrasReveladas texto="Sorrisos que transformam histórias." atraso={0.25} />
      </h1>
      <m.p className="mt-6 max-w-md font-display text-xl leading-snug text-conteudo-suave sm:text-2xl" {...entra(0.75)}>
        Mais que estética, devolvemos confiança, bem-estar e qualidade de vida. Resultados reais, com planejamento e segurança.
      </m.p>
      <m.div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center" {...entra(0.95)}>
        <BotaoWhatsApp
          rastreio="hero_agendar"
          intencao="avaliacao"
          numero={clinica.whatsappComercial}
          mensagem={MENSAGEM}
          icone="seta"
          className="w-full px-7 sm:w-auto"
        >
          Agendar avaliação
        </BotaoWhatsApp>
        <BotaoAncora href="#unidades" className="w-full sm:w-auto">
          Conheça nossas unidades
        </BotaoAncora>
      </m.div>
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
      <div className="container-vert relative grid gap-6 pb-10 pt-4 sm:gap-8 sm:pt-10">
        <div>
          <Texto animar={animar} />
        </div>
        <figure className="hero-foto order-first">
          {/* Entrada em câmera lenta: a foto assenta devagar, sem pressa. */}
          <m.div
            className="absolute inset-0"
            initial={animar ? { scale: 1.14, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 2.6, ease: curva }}
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
  const abre = useTransform(scrollYProgress, [0.06, 0.66], [0, 1], { ease: (v) => v * v * (3 - 2 * v) })

  const recorte = useTransform([abre, topo, direita, base, esquerda] as MotionValue<number>[], ([e, t, r, b, l]: number[]) => {
    const k = 1 - e
    return `inset(${t * k}px ${r * k}px ${b * k}px ${l * k}px round ${28 * k}px)`
  })
  // A foto acompanha o cartão: centralizada nele e na escala certa, até virar tela cheia.
  const fotoX = useTransform([abre, direita, esquerda] as MotionValue<number>[], ([e, r, l]: number[]) => ((l - r) / 2) * (1 - e))
  const fotoY = useTransform([abre, topo, base] as MotionValue<number>[], ([e, t, b]: number[]) => ((t - b) / 2) * (1 - e))
  const fotoEscala = useTransform([abre, topo, direita, base, esquerda, largura, altura] as MotionValue<number>[], ([e, t, r, b, l, w, h]: number[]) => {
    const inicial = Math.max((w - l - r) / w, (h - t - b) / h)
    return inicial + (1 - inicial) * e
  })

  const textoOpacidade = useTransform(scrollYProgress, [0, 0.28], [1, 0])
  const textoY = useTransform(scrollYProgress, [0, 0.28], [0, -60])
  const veu = useTransform(scrollYProgress, [0.4, 0.78], [0, 0.42])
  const finalOpacidade = useTransform(scrollYProgress, [0.6, 0.8], [0, 1])
  const finalY = useTransform(scrollYProgress, [0.6, 0.8], [36, 0])
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
          <m.div className="absolute inset-0 will-change-transform" style={{ x: fotoX, y: fotoY, scale: fotoEscala }}>
            {/* Entrada em câmera lenta: a foto assenta devagar enquanto o título aparece. */}
            <m.div className="absolute inset-0" initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 3.2, ease: curva }}>
              <Imagem className="hero-cinema__imagem" />
            </m.div>
          </m.div>
          <m.div className="hero-cinema__veu" style={{ opacity: veu }} aria-hidden="true" />

          <m.p className="hero-foto__legenda" style={{ opacity: textoOpacidade, top: cartao.t + 24, right: cartao.r + 24, bottom: 'auto' }} aria-hidden="true">
            Mais que sorrisos,
            <br />
            vidas reais.
          </m.p>
          <m.ul className="hero-selos grid" style={{ opacity: textoOpacidade, left: cartao.l + 20, bottom: cartao.b + 20, right: 'auto', width: '26rem' }}>
            {atributos.map(({ Icone, texto }) => (
              <li key={texto}>
                <Icone className="h-6 w-6 text-conteudo" />
                {texto}
              </li>
            ))}
          </m.ul>

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
