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
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {instagram.posts!.map((url, i) => (
              <Reveal key={url} delay={i * 45}>
                <EmbedInstagram url={url} />
              </Reveal>
            ))}
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
