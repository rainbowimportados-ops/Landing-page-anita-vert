import { etapas } from '../config/site'
import { Reveal } from './Reveal'

export function Etapas() {
  return (
    <section id="como-funciona" className="secao bg-superficie-suave">
      <div className="container-vert">
        <Reveal className="max-w-texto">
          <p className="olho">Como funciona</p>
          <h2 className="titulo-secao mt-3">Do primeiro contato ao retorno</h2>
        </Reveal>

        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {etapas.map((etapa, indice) => (
            <Reveal key={etapa.titulo} delay={indice * 45}>
              <li className="h-full rounded-card bg-superficie p-6 shadow-1">
                <span className="font-display text-2xl tabular-nums text-realce-escuro">
                  {String(indice + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 font-display text-lg text-conteudo">{etapa.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-conteudo-suave">{etapa.texto}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
