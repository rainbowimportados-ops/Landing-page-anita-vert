import { m, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef } from 'react'
import { MarcaVert } from './MarcaVert'

const FRASE = 'Cada sorriso tem uma história… e é por isso que fazemos o que fazemos.'

/**
 * Frase da clínica lida no ritmo da rolagem: a seção fica presa na tela e cada
 * palavra acende conforme a pessoa desce. Com `prefers-reduced-motion` a frase
 * aparece inteira, sem prender a tela.
 */
export function Manifesto() {
  const reduzir = useReducedMotion()
  const secao = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: secao, offset: ['start start', 'end end'] })
  const palavras = FRASE.split(' ')

  if (reduzir) {
    return (
      <section className="manifesto manifesto--estatico" aria-label="Nossa frase">
        <div className="container-vert">
          <p className="manifesto__frase">{FRASE}</p>
        </div>
      </section>
    )
  }

  return (
    <section ref={secao} className="manifesto" aria-label="Nossa frase">
      <div className="manifesto__palco">
        <div className="container-vert">
          <MarcaVert versao="circular" className="mx-auto mb-10 h-14 text-conteudo/70" />
          <p className="manifesto__frase" aria-label={FRASE}>
            {palavras.map((palavra, i) => (
              <Palavra key={`${palavra}-${i}`} progresso={scrollYProgress} inicio={0.1 + (i / palavras.length) * 0.7} fim={0.1 + ((i + 1) / palavras.length) * 0.7}>
                {palavra}
              </Palavra>
            ))}
          </p>
        </div>
      </div>
    </section>
  )
}

function Palavra({ progresso, inicio, fim, children }: { progresso: MotionValue<number>; inicio: number; fim: number; children: string }) {
  const opacidade = useTransform(progresso, [inicio, fim], [0.14, 1])
  const desfoque = useTransform(progresso, [inicio, fim], ['blur(4px)', 'blur(0px)'])
  return (
    <m.span aria-hidden="true" style={{ opacity: opacidade, filter: desfoque }} className="inline-block">
      {children}&nbsp;
    </m.span>
  )
}
