import { servicos, type IconeServico } from '../config/site'
import type { Intencao } from '../lib/captura'
import { useConteudo } from '../lib/ConteudoContexto'
import { useCaptura } from './Captura'
import { Icon, IconSeta } from './Icon'
import { Reveal } from './Reveal'

/** Interesse gravado no lead quando a pessoa entra por "Saiba mais". */
const intencaoPorIcone: Record<IconeServico, Intencao> = {
  sparkle: 'lentes',
  smile: 'estetica',
  align: 'ortodontia',
  tooth: 'avaliacao',
  crown: 'implante',
  clipboard: 'avaliacao',
}

export function Servicos() {
  const { clinica } = useConteudo()
  const abrirCaptura = useCaptura()

  return (
    <section id="tratamentos" className="secao">
      <div className="container-vert">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="olho">Tratamentos</p>
          <h2 className="titulo-secao mt-4">Nossos tratamentos</h2>
          <p className="lead mt-4">
            Soluções completas para a saúde, a estética e a harmonia do seu sorriso. Cada caso começa pelo
            diagnóstico, e é ele que define o que entra no seu plano.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {servicos.map((servico, indice) => (
            <Reveal key={servico.titulo} delay={indice * 45}>
              <article className="tratamento-card group flex h-full flex-col rounded-[1.25rem] border border-white/70 p-7">
                <span className="grid h-14 w-14 place-items-center rounded-2xl border border-borda bg-superficie text-conteudo shadow-1">
                  <Icon nome={servico.icone} className="h-7 w-7" />
                </span>
                <h3 className="mt-6 font-display text-2xl font-normal text-conteudo">{servico.titulo}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-conteudo-suave">{servico.descricao}</p>
                <button
                  type="button"
                  onClick={() =>
                    abrirCaptura({
                      intencao: intencaoPorIcone[servico.icone],
                      cta: `tratamento_${servico.icone}`,
                      numero: clinica.whatsappComercial,
                      mensagem: `Olá! Vim pelo site e gostaria de saber mais sobre ${servico.titulo.toLowerCase()}.`,
                    })
                  }
                  className="mt-6 inline-flex min-h-[44px] items-center gap-2 self-start text-sm font-medium text-conteudo underline-offset-4 hover-fino:hover:underline"
                >
                  Saiba mais <IconSeta className="h-4 w-4 transition-transform duration-padrao group-hover:translate-x-1" />
                  <span className="sr-only"> sobre {servico.titulo}</span>
                </button>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
