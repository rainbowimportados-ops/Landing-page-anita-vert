import { unidades } from '../config/site'
import { BotaoWhatsApp } from './CTA'
import { IconLocal, IconRelogio } from './Icon'
import { Reveal } from './Reveal'

export function Unidades() {
  return (
    <section id="unidades" className="secao bg-fundo">
      <div className="container-vert">
        <Reveal className="max-w-texto">
          <p className="olho">Unidades</p>
          <h2 className="titulo-secao mt-3">Escolha onde quer ser atendido</h2>
          <p className="lead mt-4">
            Mesma equipe, mesmo protocolo clínico. Fale direto com a unidade mais perto de você.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {unidades.map((unidade, indice) => (
            <Reveal key={unidade.slug} delay={indice * 45}>
              <article className="flex h-full flex-col rounded-card border border-borda bg-superficie p-7 shadow-1">
                <h3 className="font-display text-2xl text-conteudo">{unidade.nome}</h3>
                <p className="mt-1 text-sm font-medium text-marca">{unidade.cidade}</p>

                <div className="mt-6 flex-1 space-y-4 text-sm text-conteudo-suave">
                  <p className="flex gap-3">
                    <IconLocal className="mt-0.5 h-5 w-5 shrink-0 text-conteudo-tenue" />
                    <span>{unidade.endereco}</span>
                  </p>
                  <p className="flex gap-3">
                    <IconRelogio className="mt-0.5 h-5 w-5 shrink-0 text-conteudo-tenue" />
                    <span>
                      {unidade.horarios.map((horario) => (
                        <span key={horario} className="block">
                          {horario}
                        </span>
                      ))}
                    </span>
                  </p>
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  <BotaoWhatsApp
                    rastreio={`unidade_${unidade.slug}_agendar`}
                    numero={unidade.whatsapp}
                    mensagem={unidade.mensagem}
                    unidade={unidade.slug}
                  >
                    Agendar aqui
                  </BotaoWhatsApp>

                  {unidade.mapsUrl && (
                    <a
                      href={unidade.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-borda-forte px-6 py-3 text-sm font-semibold text-conteudo transition duration-padrao ease-saida active:scale-[0.98] hover-fino:hover:border-marca hover-fino:hover:bg-superficie-suave"
                    >
                      Como chegar
                      <span className="sr-only"> (abre o mapa em uma nova aba)</span>
                    </a>
                  )}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
