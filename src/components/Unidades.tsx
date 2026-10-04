import { useEffect, useRef, useState } from 'react'
import { useConteudo } from '../lib/ConteudoContexto'
import { BotaoWhatsApp } from './CTA'
import { IconLocal, IconRelogio } from './Icon'
import { MarcaVert } from './MarcaVert'
import { Reveal } from './Reveal'

type Foto = { src: string; alt: string }

// Fotos reais de cada endereço. Uma unidade sem foto mostra a marca no quadro.
const fotosPorUnidade: Record<string, Foto[]> = {
  franca: [{ src: '/assets/cartao/franca-recepcao.webp', alt: 'Recepção da unidade de Franca' }],
  'ribeirao-preto': [
    { src: '/assets/cartao/ribeirao-recepcao.webp', alt: 'Recepção da unidade de Ribeirão Preto' },
    { src: '/assets/cartao/ribeirao-consultorio.webp', alt: 'Consultório da unidade de Ribeirão Preto' },
    { src: '/assets/cartao/ribeirao-cadeira.webp', alt: 'Cadeira odontológica da unidade de Ribeirão Preto' },
    { src: '/assets/cartao/ribeirao-atendimento.webp', alt: 'Sala de atendimento da unidade de Ribeirão Preto' },
  ],
}

/**
 * As duas unidades lado a lado (no celular, uma ao lado da outra para deslizar),
 * cada uma com as próprias fotos passando devagar, endereço e os botões.
 */
export function Unidades() {
  const { unidades } = useConteudo()

  return (
    <section id="unidades" className="secao" aria-labelledby="unidades-titulo">
      <div className="container-vert">
        <Reveal className="mx-auto max-w-2xl text-center lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-[1fr_1.1fr] lg:items-end lg:gap-12 lg:text-left">
          <div>
            <p className="olho">Unidades</p>
            <h2 id="unidades-titulo" className="titulo-secao mt-3">Nossas unidades</h2>
          </div>
          <p className="lead mt-3 lg:mt-0">Dois endereços, o mesmo propósito: transformar sorrisos e vidas.</p>
        </Reveal>

        <ul className="trilho mt-6 grid gap-5 sm:mt-8 md:grid-cols-2">
          {unidades.map((unidade, indice) => (
            <Reveal key={unidade.slug} as="li" delay={indice * 80} className="unidade-cartao">
              <FotosUnidade fotos={fotosPorUnidade[unidade.slug] ?? []} />
              <div className="grid content-start gap-3 p-5 sm:p-6">
                <div>
                  <h3 className="font-display text-[1.65rem] font-normal leading-tight text-conteudo">{unidade.nome}</h3>
                  <p className="text-sm text-conteudo-suave">{unidade.cidade}</p>
                </div>
                <p className="flex gap-2.5 text-sm text-conteudo-suave">
                  <IconLocal className="mt-0.5 h-[1.1rem] w-[1.1rem] shrink-0 text-conteudo" />
                  <span>{unidade.endereco}</span>
                </p>
                {unidade.horarios.length > 0 && (
                  <p className="flex gap-2.5 text-sm text-conteudo-suave">
                    <IconRelogio className="mt-0.5 h-[1.1rem] w-[1.1rem] shrink-0 text-conteudo" />
                    <span>
                      {unidade.horarios.map((horario) => (
                        <span key={horario} className="block">{horario}</span>
                      ))}
                    </span>
                  </p>
                )}
                <div className="mt-1 flex flex-wrap gap-2.5">
                  <BotaoWhatsApp
                    rastreio={`unidade_${unidade.slug}_agendar`}
                    intencao="avaliacao"
                    numero={unidade.whatsapp}
                    mensagem={unidade.mensagem}
                    unidade={unidade.slug}
                    className="rounded-full px-5"
                  >
                    Agendar aqui
                  </BotaoWhatsApp>
                  <a
                    href={unidade.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-conteudo/70 px-5 py-3 text-sm font-medium text-conteudo transition duration-padrao ease-saida active:scale-[0.98] hover-fino:hover:bg-superficie"
                  >
                    <IconLocal className="h-4 w-4" />
                    Como chegar
                    <span className="sr-only"> (abre o mapa em uma nova aba)</span>
                  </a>
                </div>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}

/**
 * Fotos da unidade em esmaecimento lento (uma a cada ~5 s), só enquanto o
 * quadro está na tela. Com uma única foto, ela só aproxima devagar.
 * Sem troca automática com `prefers-reduced-motion`.
 */
function FotosUnidade({ fotos }: { fotos: Foto[] }) {
  const quadro = useRef<HTMLDivElement>(null)
  const [atual, setAtual] = useState(0)

  useEffect(() => {
    const elemento = quadro.current
    if (!elemento || fotos.length < 2 || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let intervalo = 0
    const observador = new IntersectionObserver(([entrada]) => {
      window.clearInterval(intervalo)
      if (entrada.isIntersecting) intervalo = window.setInterval(() => setAtual((i) => (i + 1) % fotos.length), 5000)
    }, { threshold: 0.3 })
    observador.observe(elemento)
    return () => {
      observador.disconnect()
      window.clearInterval(intervalo)
    }
  }, [fotos.length])

  if (fotos.length === 0) {
    return (
      <div className="unidade-fotos unidade-marca grid place-items-center" aria-hidden="true">
        <MarcaVert versao="circular" className="h-20 text-conteudo-inverso/90" />
      </div>
    )
  }

  return (
    <div ref={quadro} className="unidade-fotos">
      {fotos.map((foto, i) => (
        <img
          key={foto.src}
          src={foto.src}
          alt={foto.alt}
          loading="lazy"
          decoding="async"
          className={i === atual ? 'is-atual' : ''}
          aria-hidden={i === atual ? undefined : true}
        />
      ))}
      {fotos.length > 1 && (
        <div className="unidade-fotos__pontos" role="group" aria-label="Escolher foto">
          {fotos.map((foto, i) => (
            <button
              key={foto.src}
              type="button"
              aria-label={`Ver foto ${i + 1}: ${foto.alt}`}
              aria-pressed={i === atual}
              onClick={() => setAtual(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
