import { servicos } from '../config/site'
import { Icon } from './Icon'
import { Reveal } from './Reveal'

export function Servicos() {
  return (
    <section id="tratamentos" className="secao bg-fundo">
      <div className="container-vert">
        <Reveal className="max-w-texto">
          <p className="olho">Tratamentos</p>
          <h2 className="titulo-secao mt-3">Estética e clínica sob o mesmo planejamento</h2>
          <p className="lead mt-4">
            Cada caso começa pelo diagnóstico. A partir dele definimos quais destes tratamentos
            entram no seu plano — e em que ordem.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servicos.map((servico, indice) => (
            <Reveal key={servico.titulo} delay={indice * 45}>
              <article className="group h-full rounded-card border border-borda bg-superficie p-6 transition-[transform,border-color,box-shadow] duration-padrao ease-saida hover-fino:hover:-translate-y-1 hover-fino:hover:border-borda-forte hover-fino:hover:shadow-2">
                <span className="inline-flex rounded-xl bg-superficie-suave p-3 text-marca transition-colors duration-rapido hover-fino:group-hover:bg-marca-tenue">
                  <Icon nome={servico.icone} />
                </span>
                <h3 className="mt-5 font-display text-xl text-conteudo">{servico.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-conteudo-suave">
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
