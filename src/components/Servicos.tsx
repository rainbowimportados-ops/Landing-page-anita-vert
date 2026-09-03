import { servicos } from '../config/site'
import { Icon } from './Icon'
import { Reveal } from './Reveal'

export function Servicos() {
  return (
    <section id="tratamentos" className="bg-sand-50 py-20 sm:py-24">
      <div className="container-vert">
        <Reveal className="max-w-2xl">
          <p className="olho">Tratamentos</p>
          <h2 className="titulo-secao mt-3">
            Estética e clínica sob o mesmo planejamento
          </h2>
          <p className="mt-4 text-base leading-relaxed text-forest-700/90">
            Cada caso começa pelo diagnóstico. A partir dele definimos quais destes tratamentos
            entram no seu plano — e em que ordem.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {servicos.map((servico, indice) => (
            <Reveal key={servico.titulo} delay={indice * 70}>
              <article className="group h-full rounded-2xl border border-forest-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-forest-200 hover:shadow-lg hover:shadow-forest-900/5">
                <span className="inline-flex rounded-xl bg-forest-50 p-3 text-forest-600 transition-colors group-hover:bg-forest-100">
                  <Icon nome={servico.icone} />
                </span>
                <h3 className="mt-5 font-display text-xl text-forest-800">{servico.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-forest-700/85">
                  {servico.descricao}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
