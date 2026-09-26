import { sobre } from '../config/site'
import { MarcaVert } from './MarcaVert'
import { Reveal } from './Reveal'

export function Sobre() {
  return (
    <section id="sobre" className="secao bg-superficie" aria-labelledby="sobre-titulo">
      <div className="container-vert grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
        <Reveal>
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
          <div className="mt-6 grid gap-4 text-base leading-relaxed text-conteudo-suave">
            {sobre.paragrafos.map((texto) => (
              <p key={texto}>{texto}</p>
            ))}
          </div>
          <ul className="mt-8 flex flex-wrap gap-2" aria-label="Compromissos">
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
