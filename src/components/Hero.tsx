import { clinica, unidades } from '../config/site'
import { BotaoAncora, BotaoWhatsApp } from './CTA'
import { IconSeta } from './Icon'

const promessas = [
  'Exame clínico e registro fotográfico do seu caso',
  'Explicação das opções reais, com prós e limites de cada uma',
  'Plano de tratamento por escrito, com etapas e valores',
]

export function Hero() {
  return (
    <section id="topo" className="relative overflow-hidden bg-superficie-inversa pt-16 text-conteudo-inverso">
      {/* Halos decorativos: dão profundidade sem pedir uma foto de banco de imagem. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-24 h-[28rem] w-[28rem] rounded-full bg-marca/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-superficie-inversa-suave/70 blur-3xl"
      />

      <div className="container-vert relative grid gap-12 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-32">
        <div className="animate-fade-up">
          <p className="olho text-conteudo-inverso-tenue">{clinica.tagline}</p>

          <h1 className="mt-4 font-display text-display-lg">
            Um sorriso planejado{' '}
            <span className="block text-realce">para o seu rosto.</span>
          </h1>

          <p className="mt-6 max-w-texto text-base leading-relaxed text-conteudo-inverso-suave sm:text-lg">
            {clinica.descricao}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <BotaoWhatsApp
              rastreio="hero_agendar"
              numero={clinica.whatsappComercial}
              mensagem="Olá! Vim pelo site e gostaria de agendar uma avaliação."
              variante="clara"
              className="w-full sm:w-auto"
            >
              Agendar avaliação
            </BotaoWhatsApp>

            <BotaoAncora href="#tratamentos" className="w-full sm:w-auto">
              Ver tratamentos
              <IconSeta />
            </BotaoAncora>
          </div>

          <p className="mt-6 text-sm text-conteudo-inverso-tenue">
            Atendimento em {unidades.map((unidade) => unidade.cidade.split(' /')[0]).join(' e ')}.
          </p>
        </div>

        {/* Em vez de uma imagem genérica, o que o visitante ganha ao agendar. */}
        <div className="animate-fade-up rounded-painel border border-borda-inversa bg-superficie-inversa-suave/50 p-6 backdrop-blur-sm [animation-delay:120ms] sm:p-8">
          <p className="olho text-conteudo-inverso-tenue">O que esperar da avaliação</p>
          <ul className="mt-5 space-y-4">
            {promessas.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-conteudo-inverso">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 h-5 w-5 shrink-0 text-realce"
                  aria-hidden="true"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
