import { useState } from 'react'
import { useConteudo } from '../lib/ConteudoContexto'
import { BotaoWhatsApp } from './CTA'
import { IconLocal, IconRelogio } from './Icon'
import { MarcaVert } from './MarcaVert'
import { Reveal } from './Reveal'

export function Unidades() {
  const { unidades } = useConteudo()
  const [ativa, setAtiva] = useState(0)
  const unidade = unidades[ativa] ?? unidades[0]

  return (
    <section id="unidades" className="secao">
      <div className="container-vert">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="olho">Unidades</p>
          <h2 className="titulo-secao mt-4">Nossas unidades</h2>
          <p className="lead mt-4">Dois endereços, o mesmo propósito: transformar sorrisos e vidas.</p>
        </Reveal>

        <Reveal className="mx-auto mt-10 max-w-5xl">
          <div role="tablist" aria-label="Escolha a unidade" className="unidades-abas mx-auto grid max-w-md grid-cols-2 gap-1 rounded-2xl p-1">
            {unidades.map((u, i) => (
              <button
                key={u.slug}
                role="tab"
                id={`aba-${u.slug}`}
                aria-selected={i === ativa}
                aria-controls="painel-unidade"
                onClick={() => setAtiva(i)}
                className={`min-h-[44px] rounded-xl px-4 text-sm transition-colors duration-rapido ${
                  i === ativa ? 'bg-marca-forte text-conteudo-inverso shadow-2' : 'text-conteudo-suave hover-fino:hover:text-conteudo'
                }`}
              >
                {u.cidade.split(' /')[0]}
              </button>
            ))}
          </div>

          <article
            id="painel-unidade"
            role="tabpanel"
            aria-labelledby={`aba-${unidade.slug}`}
            className="tratamento-card mt-6 grid overflow-hidden rounded-[1.5rem] border border-white/70 md:grid-cols-[1fr_1.1fr]"
          >
            {/* Sem foto da fachada ainda: a marca ocupa o quadro. */}
            <div className="unidade-marca grid min-h-[14rem] place-items-center" aria-hidden="true">
              <MarcaVert versao="circular" className="h-28 text-conteudo-inverso/90" />
            </div>
            <div className="grid content-start gap-5 p-7 sm:p-10">
              <div>
                <h3 className="font-display text-3xl font-normal text-conteudo">{unidade.nome}</h3>
                <p className="mt-1 text-sm text-conteudo-suave">{unidade.cidade}</p>
              </div>
              <p className="flex gap-3 text-sm text-conteudo-suave">
                <IconLocal className="mt-0.5 h-5 w-5 shrink-0 text-conteudo" />
                <span>{unidade.endereco}</span>
              </p>
              {unidade.horarios.length > 0 && (
                <p className="flex gap-3 text-sm text-conteudo-suave">
                  <IconRelogio className="mt-0.5 h-5 w-5 shrink-0 text-conteudo" />
                  <span>
                    {unidade.horarios.map((horario) => (
                      <span key={horario} className="block">{horario}</span>
                    ))}
                  </span>
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-3">
                <BotaoWhatsApp
                  rastreio={`unidade_${unidade.slug}_agendar`}
                  intencao="avaliacao"
                  numero={unidade.whatsapp}
                  mensagem={unidade.mensagem}
                  unidade={unidade.slug}
                >
                  Agendar aqui
                </BotaoWhatsApp>
                <a
                  href={unidade.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-conteudo/70 px-6 py-3 text-sm font-medium text-conteudo transition duration-padrao ease-saida active:scale-[0.98] hover-fino:hover:bg-superficie"
                >
                  <IconLocal className="h-4 w-4" />
                  Como chegar
                  <span className="sr-only"> (abre o mapa em uma nova aba)</span>
                </a>
              </div>
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  )
}
