import { faq } from '../config/site'
import { Reveal } from './Reveal'

export function Duvidas() {
  return (
    <section id="duvidas" className="bg-white py-20 sm:py-24">
      <div className="container-vert grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <Reveal>
          <p className="olho">Dúvidas frequentes</p>
          <h2 className="titulo-secao mt-3">Antes de agendar</h2>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-forest-700/90">
            Não encontrou o que procurava? Manda a pergunta no WhatsApp — respondemos sem
            compromisso.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div className="divide-y divide-forest-100 border-y border-forest-100">
            {faq.map((item) => (
              <details key={item.pergunta} className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left font-display text-lg text-forest-800 [&::-webkit-details-marker]:hidden">
                  {item.pergunta}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    className="mt-1.5 h-4 w-4 shrink-0 text-forest-400 transition-transform duration-200 group-open:rotate-45"
                    aria-hidden="true"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-forest-700/85">
                  {item.resposta}
                </p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
