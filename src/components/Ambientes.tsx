import { m, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'

type Foto = { src: string; alt: string; escala: number; classe: string }

// A do centro abre até cobrir a tela; as outras crescem mais rápido e saem
// pelas bordas, o que dá a sensação de entrar na clínica.
const fotos: Foto[] = [
  { src: '/assets/cartao/franca-recepcao.webp', alt: 'Recepção da unidade de Franca', escala: 4, classe: 'ambientes__foto--centro' },
  { src: '/assets/cartao/ribeirao-recepcao.webp', alt: 'Recepção da unidade de Ribeirão Preto', escala: 5, classe: 'ambientes__foto--1' },
  { src: '/assets/cartao/ribeirao-consultorio.webp', alt: 'Consultório em Ribeirão Preto', escala: 6, classe: 'ambientes__foto--2' },
  { src: '/assets/ambientes/clinica-corredor.webp', alt: 'Corredor da clínica', escala: 5, classe: 'ambientes__foto--3' },
  { src: '/assets/cartao/ribeirao-cadeira.webp', alt: 'Cadeira odontológica', escala: 6, classe: 'ambientes__foto--4' },
  { src: '/assets/cartao/ribeirao-atendimento.webp', alt: 'Sala de atendimento', escala: 8, classe: 'ambientes__foto--5' },
  { src: '/assets/ambientes/sorriso-vert.webp', alt: 'Paciente sorrindo', escala: 9, classe: 'ambientes__foto--6' },
]

/**
 * O espaço das duas unidades, em zoom ligado à rolagem: as fotos crescem em
 * velocidades diferentes até a recepção ocupar a tela. Com
 * `prefers-reduced-motion` vira uma grade simples, sem prender a tela.
 */
export function Ambientes() {
  const reduzir = useReducedMotion()
  const secao = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: secao, offset: ['start start', 'end end'] })
  const legenda = useTransform(scrollYProgress, [0.72, 0.92], [0, 1])
  const legendaY = useTransform(scrollYProgress, [0.72, 0.92], [24, 0])
  const veu = useTransform(scrollYProgress, [0.6, 0.9], [0, 0.45])

  if (reduzir) {
    return (
      <section className="secao" aria-labelledby="ambientes-titulo">
        <div className="container-vert">
          <h2 id="ambientes-titulo" className="titulo-secao text-center">O nosso espaço</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
            {fotos.map((f) => (
              <img key={f.src} src={f.src} alt={f.alt} loading="lazy" className="aspect-[4/5] w-full rounded-2xl object-cover" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section ref={secao} className="ambientes" aria-labelledby="ambientes-titulo">
      <div className="ambientes__palco">
        {fotos.map((f) => (
          <FotoZoom key={f.src} foto={f} progresso={scrollYProgress} />
        ))}
        <m.div className="ambientes__veu" style={{ opacity: veu }} aria-hidden="true" />
        <m.div className="ambientes__legenda" style={{ opacity: legenda, y: legendaY }}>
          <p className="olho text-conteudo-inverso/80">O nosso espaço</p>
          <h2 id="ambientes-titulo" className="mt-3 font-display text-display-md font-light text-conteudo-inverso">
            Dois endereços, o mesmo cuidado.
          </h2>
          <p className="mt-3 text-sm text-conteudo-inverso/80">Franca e Ribeirão Preto</p>
        </m.div>
      </div>
    </section>
  )
}

function FotoZoom({ foto, progresso }: { foto: Foto; progresso: ReturnType<typeof useScroll>['scrollYProgress'] }) {
  const escala = useTransform(progresso, [0, 0.85], [1, foto.escala])
  return (
    <m.div className={`ambientes__camada ${foto.classe}`} style={{ scale: escala }}>
      <div className="ambientes__moldura">
        <img src={foto.src} alt={foto.alt} loading="lazy" decoding="async" />
      </div>
    </m.div>
  )
}
