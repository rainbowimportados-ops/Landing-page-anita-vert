import { registrarClique } from '../lib/analytics'
import { useConteudo } from '../lib/ConteudoContexto'
import type { Unidade } from '../config/site'
import { Reveal } from './Reveal'

function Estrelas({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.3 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />
        </svg>
      ))}
    </span>
  )
}

/** Botão que abre a janela de avaliação do Google da unidade e registra o clique. */
export function BotaoAvaliar({
  unidade,
  rastreio,
  className = '',
  children = 'Avaliar no Google',
}: {
  unidade: Pick<Unidade, 'slug' | 'nome' | 'avaliacaoUrl'>
  rastreio: string
  className?: string
  children?: string
}) {
  if (!unidade.avaliacaoUrl) return null
  return (
    <a
      href={unidade.avaliacaoUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => registrarClique(rastreio, unidade.slug)}
      className={`inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-full bg-marca-forte px-6 py-3 text-sm font-semibold text-conteudo-inverso shadow-1 transition duration-padrao ease-saida active:scale-[0.98] hover-fino:hover:bg-conteudo ${className}`}
    >
      <Estrelas />
      {children}
      <span className="sr-only">
        {children.includes(unidade.nome) ? '' : ` — ${unidade.nome}`} (abre em uma nova aba)
      </span>
    </a>
  )
}

/**
 * Convite para quem já foi atendido deixar uma avaliação no Google.
 * Leva todo mundo ao Google, sem pergunta de satisfação antes: filtrar quem
 * pode avaliar viola as regras do Google Meu Negócio.
 */
export function ConviteAvaliacao() {
  const { unidades } = useConteudo()
  const comLink = unidades.filter((u) => u.avaliacaoUrl)
  if (comLink.length === 0) return null

  return (
    <section id="avaliar" className="secao" aria-labelledby="avaliar-titulo">
      <div className="container-vert">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="olho justify-center">Sua opinião</p>
          <h2 id="avaliar-titulo" className="titulo-secao mt-3">Foi atendido por nós? Conte como foi</h2>
          <p className="lead mt-4">
            Sua avaliação no Google leva menos de um minuto e ajuda outras pessoas a nos encontrar.
          </p>
        </Reveal>
        <Reveal delay={80}>
          <ul className="mt-8 flex flex-wrap justify-center gap-3">
            {comLink.map((unidade) => (
              <li key={unidade.slug}>
                <BotaoAvaliar unidade={unidade} rastreio={`avaliar_site_${unidade.slug}`}>
                  {`Avaliar ${unidade.nome}`}
                </BotaoAvaliar>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
