import { useState } from 'react'
import { sobre } from '../config/site'
import { MarcaVert } from './MarcaVert'
import { Reveal } from './Reveal'

export function Sobre() {
  // No celular o texto completo não cabe junto da foto: mostra o primeiro parágrafo e abre o resto.
  const [aberto, setAberto] = useState(false)
  return (
    <section id="sobre" className="secao" aria-labelledby="sobre-titulo">
      <div className="container-vert grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
        <Reveal variante="imagem">
          <figure className="sobre-retrato">
            {sobre.foto ? (
              <img src={sobre.foto} alt={`${sobre.nome}, do Instituto Vert`} loading="lazy" />
            ) : (
              // Sem foto oficial ainda: a marca ocupa o quadro, nunca uma foto genérica.
              <div className="sobre-retrato__vazio" aria-hidden="true">
                <MarcaVert versao="empilhada" className="h-20 text-conteudo-inverso/90" />
              </div>
            )}
            <figcaption className="sobre-retrato__legenda">
              <span className="font-display text-xl text-conteudo-inverso">{sobre.nome}</span>
              <span className="text-xs text-conteudo-inverso-suave">{sobre.cargo}</span>
            </figcaption>
          </figure>
        </Reveal>

        <Reveal delay={80}>
          <p className="olho">{sobre.olho}</p>
          <h2 id="sobre-titulo" className="titulo-secao mt-3">
            Cuidado de perto, do diagnóstico ao retorno.
          </h2>
          <div className="mt-4 grid gap-3 text-[0.95rem] leading-relaxed text-conteudo-suave sm:mt-6 sm:gap-4 sm:text-base">
            {sobre.paragrafos.map((texto, i) => (
              <p key={texto} className={i > 0 && !aberto ? 'hidden sm:block' : undefined}>{texto}</p>
            ))}
          </div>
          {sobre.paragrafos.length > 1 && !aberto && (
            <button type="button" onClick={() => setAberto(true)} className="mt-2 min-h-[44px] text-sm font-medium text-conteudo underline underline-offset-4 sm:hidden">
              Ler mais
            </button>
          )}
          <ul className="mt-5 flex flex-wrap gap-2 sm:mt-8" aria-label="Compromissos">
            {sobre.compromissos.map((item) => (
              <li key={item} className="rounded-full border border-borda-forte bg-fundo px-4 py-2 text-sm text-conteudo">
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
