import { etapas } from '../config/site'
import { Reveal } from './Reveal'

export function Etapas() {
  return (
    <section id="como-funciona" className="bg-forest-50 py-20 sm:py-24">
      <div className="container-vert">
        <Reveal className="max-w-2xl">
          <p className="olho">Como funciona</p>
          <h2 className="titulo-secao mt-3">Do primeiro contato ao retorno</h2>
        </Reveal>

        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {etapas.map((etapa, indice) => (
            <Reveal key={etapa.titulo} delay={indice * 80}>
              <li className="h-full rounded-2xl bg-white p-6">
                <span className="font-display text-3xl text-forest-300">
                  {String(indice + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 font-display text-lg text-forest-800">{etapa.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-forest-700/85">{etapa.texto}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
