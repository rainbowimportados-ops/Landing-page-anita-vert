import { unidades } from '../config/site'
import { BotaoWhatsApp } from './CTA'
import { IconLocal, IconRelogio } from './Icon'
import { Reveal } from './Reveal'

export function Unidades() {
  return (
    <section id="unidades" className="bg-sand-50 py-20 sm:py-24">
      <div className="container-vert">
        <Reveal className="max-w-2xl">
          <p className="olho">Unidades</p>
          <h2 className="titulo-secao mt-3">Escolha onde quer ser atendido</h2>
          <p className="mt-4 text-base leading-relaxed text-forest-700/90">
            Mesma equipe, mesmo protocolo clínico. Fale direto com a unidade mais perto de você.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {unidades.map((unidade, indice) => (
            <Reveal key={unidade.slug} delay={indice * 90}>
              <article className="flex h-full flex-col rounded-2xl border border-forest-100 bg-white p-7">
                <h3 className="font-display text-2xl text-forest-800">{unidade.nome}</h3>
                <p className="mt-1 text-sm font-medium text-forest-500">{unidade.cidade}</p>

                <div className="mt-6 space-y-4 text-sm text-forest-700/90">
                  <p className="flex gap-3">
                    <IconLocal className="mt-0.5 h-5 w-5 shrink-0 text-forest-400" />
                    <span>{unidade.endereco}</span>
                  </p>
                  <p className="flex gap-3">
                    <IconRelogio className="mt-0.5 h-5 w-5 shrink-0 text-forest-400" />
                    <span>
                      {unidade.horarios.map((horario) => (
                        <span key={horario} className="block">
                          {horario}
                        </span>
                      ))}
                    </span>
                  </p>
                </div>

                <div className="mt-7 flex flex-wrap gap-3 pt-1">
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
                      className="inline-flex items-center justify-center rounded-full border border-forest-200 px-6 py-3 text-sm font-semibold text-forest-800 transition-colors hover:border-forest-400 hover:bg-forest-50"
                    >
                      Como chegar
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
