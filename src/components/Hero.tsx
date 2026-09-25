import { useEffect, useRef } from 'react'
import { useConteudo } from '../lib/ConteudoContexto'
import { BotaoAncora, BotaoWhatsApp } from './CTA'
import { IconSeta } from './Icon'
import retrato from '../assets/sorrisos/retrato-sorriso.jpg'

const promessas = [
  'Exame clínico e registro fotográfico do seu caso',
  'Explicação das opções reais, com prós e limites de cada uma',
  'Plano de tratamento por escrito, com etapas e valores',
]

export function Hero() {
  const { clinica, unidades } = useConteudo()
  const sceneRef = useRef<HTMLElement>(null)
  const cidades = unidades.map((unidade) => unidade.cidade.split(' /')[0]).join(' e ')

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const media = scene.querySelector<HTMLElement>('.hero-media-float')
    const orbRose = scene.querySelector<HTMLElement>('.hero-orb--rose')
    const orbCacao = scene.querySelector<HTMLElement>('.hero-orb--cacao')
    let frame = 0

    const atualizar = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        const deslocamento = Math.max(-28, Math.min(28, scene.getBoundingClientRect().top * -0.045))
        media?.style.setProperty('transform', `translate3d(0, ${deslocamento}px, 0)`)
        orbRose?.style.setProperty('transform', `translate3d(0, ${deslocamento * -0.45}px, 0)`)
        orbCacao?.style.setProperty('transform', `translate3d(0, ${deslocamento * 0.7}px, 0)`)
        frame = 0
      })
    }

    atualizar()
    window.addEventListener('scroll', atualizar, { passive: true })
    return () => {
      window.removeEventListener('scroll', atualizar)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <section ref={sceneRef} id="topo" className="hero-scene relative overflow-hidden bg-superficie-inversa pt-[4.5rem] text-conteudo-inverso">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30">
        <div className="hero-orb hero-orb--rose absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-realce/30 blur-3xl" />
        <div className="hero-orb hero-orb--cacao absolute -bottom-52 -left-40 h-[30rem] w-[30rem] rounded-full bg-superficie-inversa-suave blur-3xl" />
      </div>

      <div className="container-vert relative grid gap-12 py-14 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20 lg:py-24">
        <div className="hero-copy max-w-xl animate-fade-up">
          <p className="olho text-conteudo-inverso-tenue">{clinica.tagline}</p>
          <h1 className="mt-5 max-w-2xl font-display text-display-lg font-normal tracking-[-0.035em]">
            Sorrisos que transformam histórias.
          </h1>
          <p className="mt-6 max-w-texto text-base leading-relaxed text-conteudo-inverso-suave sm:text-lg">
            {clinica.descricao}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <BotaoWhatsApp
              rastreio="hero_agendar"
              intencao="avaliacao"
              numero={clinica.whatsappComercial}
              mensagem="Olá! Vim pelo site e gostaria de agendar uma avaliação."
              variante="clara"
              className="w-full sm:w-auto"
            >
              Agendar avaliação
            </BotaoWhatsApp>
            <BotaoAncora href="#unidades" className="w-full sm:w-auto">
              Conheça nossas unidades
              <IconSeta />
            </BotaoAncora>
          </div>

          <p className="mt-7 flex items-center gap-2 text-sm text-conteudo-inverso-tenue">
            <span className="h-1.5 w-1.5 rounded-full bg-realce" aria-hidden="true" />
            Atendimento em {cidades}.
          </p>
        </div>

        <div className="hero-editorial__media hero-media-float hero-sorriso animate-fade-up [animation-delay:120ms]">
          <img
            src={retrato}
            alt="Sorriso real de paciente do Instituto Vert após o tratamento"
            width={1642}
            height={2048}
            fetchPriority="high"
          />
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4 p-5 sm:p-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-conteudo-inverso-tenue">
                Sorrisos reais
              </p>
              <p className="mt-2 max-w-xs font-display text-2xl leading-tight text-conteudo-inverso">
                Um sorriso real. Uma história única.
              </p>
            </div>
            <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-borda-inversa text-xl text-realce sm:flex" aria-hidden="true">
              ↘
            </span>
          </div>
        </div>
      </div>

      <div className="container-vert relative pb-10 sm:pb-14">
        <div className="glass-strip grid gap-px overflow-hidden rounded-2xl border border-borda-inversa bg-borda-inversa/40 sm:grid-cols-3">
          {promessas.map((item, index) => (
            <div key={item} className="glass-strip__item flex gap-3 bg-superficie-inversa/80 p-4 sm:p-5">
              <span className="font-display text-xl text-realce">0{index + 1}</span>
              <p className="text-sm leading-relaxed text-conteudo-inverso-suave">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
