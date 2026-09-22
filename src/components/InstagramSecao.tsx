import { useState } from 'react'
import './instagram-perfil.css'
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
  const [fotoFalhou, setFotoFalhou] = useState(false)
  const usuario = perfil?.usuario?.replace(/^@+/, '')
  const linkPerfil = instagram.anita || (usuario ? `https://www.instagram.com/${encodeURIComponent(usuario)}/` : undefined)
  const iniciais = (perfil?.nome || usuario || 'Instagram').replace(/^(Dra?\.?|Dr\.?)\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase()

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
            <div className="ig-perfil mt-10">
              <div className="ig-perfil__topo">
                <span>Instagram</span>
                {linkPerfil && <a href={linkPerfil} target="_blank" rel="noopener noreferrer" aria-label="Abrir perfil no Instagram em nova aba">↗</a>}
              </div>
              <div className="ig-perfil__corpo">
                <div className="ig-perfil__avatar">
                  {perfil.foto && !fotoFalhou ? (
                    <img src={perfil.foto} alt={`Foto de ${perfil.nome || usuario}`} width={144} height={144} loading="lazy" onError={() => setFotoFalhou(true)} />
                  ) : (
                    <span aria-label={`Iniciais de ${perfil.nome || usuario}`}>{iniciais}</span>
                  )}
                </div>
                <div className="ig-perfil__identidade">
                  <div className="ig-perfil__usuario">
                    <p>{usuario || perfil.nome}</p>
                    {linkPerfil && <a href={linkPerfil} target="_blank" rel="noopener noreferrer" onClick={() => registrarClique('instagram_anita_perfil')} className="ig-perfil__seguir">Ver perfil e seguir <span className="sr-only">no Instagram (abre em nova aba)</span></a>}
                  </div>
                  {perfil.seguidores !== undefined && perfil.seguidores >= 0 && (
                    <p className="ig-perfil__numeros"><strong>{formatarNumero(perfil.seguidores)}</strong> seguidores</p>
                  )}
                  <div className="ig-perfil__bio">
                    {perfil.nome && <p>{perfil.nome}</p>}
                    {usuario && <p className="ig-perfil__arroba">@{usuario}</p>}
                  </div>
                </div>
              </div>
              {perfil.seguidoresAtualizadoEm && perfil.seguidores !== undefined && (
                <p className="ig-perfil__atualizacao">Seguidores atualizados em {formatarData(perfil.seguidoresAtualizadoEm)}</p>
              )}
              <div className="ig-perfil__rodape">
                <span aria-hidden="true">▦</span>
                {temPosts || temGaleria ? 'Publicações e sorrisos' : 'Acompanhe os sorrisos no Instagram'}
                {!temPosts && !temGaleria && linkPerfil && <a href={linkPerfil} target="_blank" rel="noopener noreferrer">Ver publicações ↗</a>}
              </div>
            </div>
          </Reveal>
        )}

        {(temPosts || temGaleria) && (
          <div className="instagram-wall mt-8" aria-label="Publicações e casos do Instagram">
            {temPosts &&
              instagram.posts!.map((url) => (
                <article key={url} className="instagram-wall__item">
                  <EmbedInstagram url={url} />
                </article>
              ))}

            {temGaleria &&
              galeria.map((imagem) => (
                <figure
                  key={imagem.url}
                  className="instagram-wall__item glass-card interactive-card overflow-hidden rounded-card border border-borda bg-fundo"
                >
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
