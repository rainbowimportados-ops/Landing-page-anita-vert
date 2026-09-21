import { useEffect, useRef, useState } from 'react'
import { registrarClique } from '../lib/analytics'
import { useConteudo } from '../lib/ConteudoContexto'
import { EmbedInstagram } from './EmbedInstagram'
import { Reveal } from './Reveal'

function formatarNumero(n: number): string {
  return new Intl.NumberFormat('pt-BR').format(n)
}

function formatarData(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    .format(new Date(iso))
}

export function InstagramSecao() {
  const { instagram, galeria } = useConteudo()
  const perfil = instagram.perfil
  const trilho = useRef<HTMLDivElement>(null)
  const [limites, setLimites] = useState({ inicio: true, fim: true })

  useEffect(() => {
    const elemento = trilho.current
    if (!elemento) return
    const atualizar = () => setLimites({
      inicio: elemento.scrollLeft <= 2,
      fim: elemento.scrollLeft + elemento.clientWidth >= elemento.scrollWidth - 2,
    })
    atualizar()
    elemento.addEventListener('scroll', atualizar, { passive: true })
    const observer = new ResizeObserver(atualizar)
    observer.observe(elemento)
    return () => {
      elemento.removeEventListener('scroll', atualizar)
      observer.disconnect()
    }
  }, [instagram.posts])

  function mover(direcao: number) {
    const elemento = trilho.current
    const card = elemento?.firstElementChild
    if (!elemento || !card) return
    const passo = card.getBoundingClientRect().width + 20
    elemento.scrollBy({
      left: direcao * passo,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }

  const temPerfil = Boolean(perfil?.usuario || perfil?.nome)
  const temPosts = instagram.posts && instagram.posts.length > 0
  const temGaleria = galeria.length > 0

  if (!temPerfil && !temPosts && !temGaleria) return null

  return (
    <section id="instagram" className="secao bg-superficie">
      <div className="container-vert">
        <Reveal className="max-w-texto">
          <p className="olho">No Instagram</p>
          <h2 className="titulo-secao mt-3">Acompanhe os casos do dia a dia</h2>
        </Reveal>

        {temPerfil && perfil && (
          <Reveal delay={45}>
            <div className="mt-10 flex flex-col gap-5 rounded-card border border-borda bg-fundo p-6 sm:flex-row sm:items-center">
              {perfil.foto && (
                <img
                  src={perfil.foto}
                  alt={`Foto do perfil de ${perfil.nome ?? perfil.usuario}`}
                  width={88}
                  height={88}
                  className="h-20 w-20 shrink-0 rounded-full object-cover"
                />
              )}

              <div className="flex-1">
                {perfil.nome && (
                  <p className="font-display text-xl text-conteudo">{perfil.nome}</p>
                )}
                {perfil.usuario && (
                  <p className="text-sm text-conteudo-tenue">@{perfil.usuario}</p>
                )}

                {perfil.seguidores !== undefined && perfil.seguidores > 0 && (
                  <p className="mt-3 text-sm text-conteudo-suave">
                    <strong className="font-semibold text-conteudo">
                      {formatarNumero(perfil.seguidores)}
                    </strong>{' '}
                    seguidores
                    {perfil.seguidoresAtualizadoEm && (
                      /* O número não é ao vivo — dizer quando foi medido evita
                         que ele se passe por tempo real. */
                      <span className="text-conteudo-tenue">
                        {' '}
                        · atualizado em {formatarData(perfil.seguidoresAtualizadoEm)}
                      </span>
                    )}
                  </p>
                )}
              </div>

              {instagram.anita && (
                <a
                  href={instagram.anita}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => registrarClique('instagram_anita_perfil')}
                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full bg-marca-forte px-6 text-sm font-semibold text-conteudo-inverso transition duration-padrao active:scale-[0.98]"
                >
                  Seguir no Instagram
                  <span className="sr-only"> (abre em uma nova aba)</span>
                </a>
              )}
            </div>
          </Reveal>
        )}

        {temPosts && (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between gap-4">
              <p className="text-sm text-conteudo-suave">Explore nossas publicações</p>
              <div className="flex gap-2" aria-label="Navegação das publicações">
                <button type="button" onClick={() => mover(-1)} disabled={limites.inicio}
                  aria-label="Publicações anteriores" aria-controls="instagram-publicacoes"
                  className="h-11 w-11 rounded-full border border-borda text-xl transition hover:bg-fundo disabled:opacity-30">←</button>
                <button type="button" onClick={() => mover(1)} disabled={limites.fim}
                  aria-label="Próximas publicações" aria-controls="instagram-publicacoes"
                  className="h-11 w-11 rounded-full border border-borda text-xl transition hover:bg-fundo disabled:opacity-30">→</button>
              </div>
            </div>
            <div ref={trilho} id="instagram-publicacoes" role="region" aria-label="Publicações do Instagram"
              tabIndex={0} className="instagram-trilho">
              {instagram.posts!.map((url, i) => (
                <article key={`${url}-${i}`} className="instagram-card rounded-card border border-borda bg-fundo">
                  <div className="flex items-center justify-between border-b border-borda px-4 py-3 text-xs text-conteudo-tenue">
                    <span>{/\/reels?\//.test(url) ? 'Reel' : 'Publicação'}</span>
                    <span>{String(i + 1).padStart(2, '0')} / {String(instagram.posts!.length).padStart(2, '0')}</span>
                  </div>
                  <div className="instagram-card-conteudo">
                    <EmbedInstagram url={url} />
                  </div>
                  <a href={url} target="_blank" rel="noopener noreferrer"
                    onClick={() => registrarClique('instagram_publicacao')}
                    className="flex min-h-[48px] items-center justify-between border-t border-borda px-4 text-sm font-semibold text-marca-forte">
                    Ver no Instagram <span aria-hidden="true">↗</span>
                    <span className="sr-only"> (abre em uma nova aba)</span>
                  </a>
                </article>
              ))}
            </div>
            <p className="mt-3 text-xs text-conteudo-tenue sm:hidden">Deslize para ver mais publicações.</p>
          </div>
        )}

        {temGaleria && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galeria.map((imagem, i) => (
              <Reveal key={imagem.url} delay={i * 45}>
                <figure className="overflow-hidden rounded-card border border-borda bg-fundo">
                  <img
                    src={imagem.url}
                    alt={imagem.legenda ?? 'Caso clínico do Instituto Vert'}
                    loading="lazy"
                    className="aspect-[4/5] w-full object-cover"
                  />
                  {imagem.legenda && (
                    <figcaption className="p-4 text-sm leading-relaxed text-conteudo-suave">
                      {imagem.legenda}
                    </figcaption>
                  )}
                </figure>
              </Reveal>
            ))}
          </div>
        )}

        <p className="mt-6 text-xs leading-relaxed text-conteudo-tenue">
          Cada caso é único. Os resultados variam conforme as características e necessidades de
          cada paciente.
        </p>
      </div>
    </section>
  )
}
