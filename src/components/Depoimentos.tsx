import { depoimentos } from '../config/site'
import { Reveal } from './Reveal'

/**
 * Só renderiza quando existem depoimentos reais cadastrados em site.ts.
 * Nada aqui deve ser preenchido com texto fictício.
 */
export function Depoimentos() {
  if (depoimentos.length === 0) return null

  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="container-vert">
        <Reveal className="max-w-2xl">
          <p className="olho">Pacientes</p>
          <h2 className="titulo-secao mt-3">Quem já passou por aqui</h2>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {depoimentos.map((depoimento, indice) => (
            <Reveal key={depoimento.nome} delay={indice * 70}>
              <figure className="h-full rounded-2xl border border-forest-100 bg-sand-50 p-6">
                <blockquote className="text-sm leading-relaxed text-forest-800">
                  “{depoimento.texto}”
                </blockquote>
                <figcaption className="mt-5 border-t border-forest-100 pt-4 text-sm">
                  <span className="font-semibold text-forest-800">{depoimento.nome}</span>
                  <span className="mt-0.5 block text-forest-600">{depoimento.tratamento}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
