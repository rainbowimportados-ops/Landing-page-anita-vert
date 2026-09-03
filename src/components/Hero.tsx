import { clinica, unidades } from '../config/site'
import { BotaoWhatsApp } from './CTA'
import { IconSeta } from './Icon'

export function Hero() {
  return (
    <section id="topo" className="relative overflow-hidden bg-forest-800 pt-16 text-sand-50">
      {/* Halo suave atrás do texto, puramente decorativo. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-24 h-[28rem] w-[28rem] rounded-full bg-forest-600/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-24 h-[24rem] w-[24rem] rounded-full bg-forest-700/60 blur-3xl"
      />

      <div className="container-vert relative grid gap-12 py-20 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
        <div className="animate-fade-up">
          <p className="olho text-forest-200">{clinica.tagline}</p>

          <h1 className="mt-4 font-display text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
            Um sorriso planejado
            <br />
            <span className="text-forest-200">para o seu rosto.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-forest-100/90 sm:text-lg">
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

            <a
              href="#tratamentos"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-forest-500 px-6 py-3 text-sm font-semibold text-sand-50 transition-colors hover:border-forest-300 hover:bg-forest-700 sm:w-auto"
            >
              Ver tratamentos
              <IconSeta />
            </a>
          </div>

          <p className="mt-6 text-sm text-forest-200/80">
            Atendimento em {unidades.map((unidade) => unidade.cidade.split(' /')[0]).join(' e ')}.
          </p>
        </div>

        {/* Cartão de credibilidade — substitui o "banco de imagem" por informação útil. */}
        <div className="animate-fade-up rounded-2xl border border-forest-600/60 bg-forest-700/40 p-6 backdrop-blur-sm sm:p-8 [animation-delay:120ms]">
          <p className="olho text-forest-200">O que esperar da avaliação</p>
          <ul className="mt-5 space-y-4">
            {[
              'Exame clínico e registro fotográfico do seu caso',
              'Explicação das opções reais, com prós e limites de cada uma',
              'Plano de tratamento por escrito, com etapas e valores',
            ].map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-forest-50">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 h-5 w-5 shrink-0 text-forest-300"
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
