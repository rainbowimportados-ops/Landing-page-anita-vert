import { useConteudo } from '../lib/ConteudoContexto'
import { Reveal } from './Reveal'

/**
 * Só renderiza quando existem depoimentos reais cadastrados em site.ts.
 * Nada aqui deve ser preenchido com texto fictício.
 */
export function Depoimentos() {
  const { depoimentos } = useConteudo()

  if (depoimentos.length === 0) return null

  return (
    <section className="secao bg-superficie">
      <div className="container-vert">
        <Reveal className="max-w-texto">
          <p className="olho">Pacientes</p>
          <h2 className="titulo-secao mt-3">Quem já passou por aqui</h2>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {depoimentos.map((depoimento, indice) => (
            <Reveal key={depoimento.nome} delay={indice * 45}>
              <figure className="h-full rounded-card border border-borda bg-fundo p-6">
                <blockquote className="text-sm leading-relaxed text-conteudo">
                  “{depoimento.texto}”
                </blockquote>
                <figcaption className="mt-5 border-t border-borda pt-4 text-sm">
                  <span className="font-semibold text-conteudo">{depoimento.nome}</span>
                  <span className="mt-0.5 block text-conteudo-tenue">{depoimento.tratamento}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
