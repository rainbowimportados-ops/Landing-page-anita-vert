import { diferenciais } from '../config/site'
import { Reveal } from './Reveal'

export function Diferenciais() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="container-vert grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <Reveal>
          <p className="olho">Por que a Vert</p>
          <h2 className="titulo-secao mt-3">
            Menos promessa,
            <br />
            mais previsibilidade
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-forest-700/90">
            Nosso trabalho é tirar a incerteza do caminho. Você entende o diagnóstico, conhece as
            alternativas e decide com informação — não com pressa.
          </p>
        </Reveal>

        <div className="grid gap-x-8 gap-y-9 sm:grid-cols-2">
          {diferenciais.map((item, indice) => (
            <Reveal key={item.titulo} delay={indice * 80}>
              <div className="border-l-2 border-forest-200 pl-5">
                <h3 className="font-display text-lg text-forest-800">{item.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-forest-700/85">{item.texto}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
