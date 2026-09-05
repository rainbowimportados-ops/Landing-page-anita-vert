import { useConteudo } from '../lib/ConteudoContexto'
import { Reveal } from './Reveal'

export function Duvidas() {
  const { faq } = useConteudo()

  return (
    <section id="duvidas" className="secao bg-superficie">
      <div className="container-vert grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <Reveal>
          <p className="olho">Dúvidas frequentes</p>
          <h2 className="titulo-secao mt-3">Antes de agendar</h2>
          <p className="lead mt-4 max-w-sm">
            Não encontrou o que procurava? Manda a pergunta no WhatsApp — respondemos sem
            compromisso.
          </p>
        </Reveal>

        <Reveal delay={45}>
          <div className="divide-y divide-borda border-y border-borda">
            {faq.map((item) => (
              <details key={item.pergunta} className="group">
                <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-display text-lg text-conteudo [&::-webkit-details-marker]:hidden">
                  {item.pergunta}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    className="h-4 w-4 shrink-0 text-conteudo-tenue transition-transform duration-padrao ease-saida group-open:rotate-45"
                    aria-hidden="true"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </summary>
                <p className="max-w-texto pb-5 text-sm leading-relaxed text-conteudo-suave">
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
