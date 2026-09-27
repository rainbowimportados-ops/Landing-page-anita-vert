import './instagram-perfil.css'
import { perfilInstagram as perfil } from '../config/site'
import { registrarClique } from '../lib/analytics'
import { MarcaVert } from './MarcaVert'
import { Reveal } from './Reveal'
import post1 from '../assets/instagram/perfil/post-1.webp'
import post2 from '../assets/instagram/perfil/post-2.webp'
import post3 from '../assets/instagram/perfil/post-3.webp'
import post4 from '../assets/instagram/perfil/post-4.webp'
import post5 from '../assets/instagram/perfil/post-5.webp'
import post6 from '../assets/instagram/perfil/post-6.webp'

// Capas na ordem da grade do perfil. Todas são resultados ou bastidores reais.
const posts = [
  { src: post1, alt: 'Paciente sorrindo e detalhe das lentes em resina' },
  { src: post2, alt: 'Bastidores de um curso do Instituto Vert' },
  { src: post3, alt: 'Antes e depois do sorriso de um paciente' },
  { src: post4, alt: 'Dra. Anita Almeida' },
  { src: post5, alt: 'Antes e depois do sorriso de uma paciente' },
  { src: post6, alt: 'Antes e depois do sorriso de uma paciente, em close' },
]

const linkPerfil = `https://www.instagram.com/${perfil.usuario}/`
const linkMensagem = `https://ig.me/m/${perfil.usuario}`

function Icone({ d, className = 'h-6 w-6' }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

/** Perfil da clínica no formato do app do Instagram, com as publicações recentes. */
export function InstagramSecao() {
  const abrir = (botao: string) => () => registrarClique(botao)

  return (
    <section id="instagram" className="secao" aria-labelledby="instagram-titulo">
      <div className="container-vert grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
        <Reveal>
          <p className="olho">No Instagram</p>
          <h2 id="instagram-titulo" className="titulo-secao mt-4">Acompanhe o dia a dia do Instituto Vert</h2>
          <p className="lead mt-4 max-w-md">
            Casos reais, bastidores dos cursos e o trabalho da Dra. Anita e da equipe, publicados toda semana.
          </p>
          <a
            href={linkPerfil}
            target="_blank"
            rel="noopener noreferrer"
            onClick={abrir('instagram_secao_seguir')}
            className="mt-8 inline-flex min-h-[48px] items-center gap-2.5 rounded-xl bg-marca-forte px-7 py-3 text-sm font-medium text-conteudo-inverso shadow-2 transition duration-padrao ease-saida hover-fino:hover:bg-conteudo active:scale-[0.98]"
          >
            Seguir @{perfil.usuario} <span aria-hidden="true">→</span>
            <span className="sr-only"> (abre o Instagram em uma nova aba)</span>
          </a>
        </Reveal>

        <Reveal delay={80}>
          <article className="ig-app" aria-label={`Perfil @${perfil.usuario} no Instagram`}>
            <header className="ig-app__barra">
              <span className="ig-app__usuario">{perfil.usuario}</span>
              <Icone className="h-6 w-6" d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9 M10.3 21a1.94 1.94 0 003.4 0" />
            </header>

            <div className="ig-app__topo">
              <a href={linkPerfil} target="_blank" rel="noopener noreferrer" onClick={abrir('instagram_secao_avatar')} className="ig-app__avatar" aria-label={`Abrir @${perfil.usuario} no Instagram`}>
                <span className="ig-app__avatar-foto">
                  <MarcaVert versao="empilhada" className="h-7 text-[#e9dccf]" />
                </span>
              </a>
              <div className="min-w-0 flex-1">
                <p className="ig-app__nome">{perfil.nome}</p>
                <dl className="ig-app__numeros">
                  <div><dt>posts</dt><dd>{perfil.publicacoes}</dd></div>
                  <div><dt>seguidores</dt><dd>{perfil.seguidores}</dd></div>
                  <div><dt>seguindo</dt><dd>{perfil.seguindo}</dd></div>
                </dl>
              </div>
            </div>

            <div className="ig-app__bio">
              {perfil.bio.map((linha) => (
                <p key={linha}>{linha}</p>
              ))}
              <p>
                Por{' '}
                <a href={`https://www.instagram.com/${perfil.por}/`} target="_blank" rel="noopener noreferrer" onClick={abrir('instagram_secao_anita')} className="ig-app__mencao">
                  @{perfil.por}
                </a>
              </p>
              <p><span aria-hidden="true">📍 </span>{perfil.local}</p>
              <p className="ig-app__link">
                <Icone className="h-4 w-4" d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.7 1.7 M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.7-1.7" />
                {perfil.link}
              </p>
            </div>

            <div className="ig-app__acoes">
              <a href={linkPerfil} target="_blank" rel="noopener noreferrer" onClick={abrir('instagram_secao_seguir_app')} className="ig-app__botao ig-app__botao--seguir">
                Seguir<span className="sr-only"> no Instagram (abre em uma nova aba)</span>
              </a>
              <a href={linkMensagem} target="_blank" rel="noopener noreferrer" onClick={abrir('instagram_secao_mensagem')} className="ig-app__botao">
                Mensagem<span className="sr-only"> no Instagram (abre em uma nova aba)</span>
              </a>
            </div>

            <div className="ig-app__abas" aria-hidden="true">
              <span className="is-ativa"><Icone d="M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z" /></span>
              <span><Icone d="M4 4h16v16H4z M10 8.5v7l5.5-3.5z" /></span>
              <span><Icone d="M4 4h16v16H4z M12 11a3 3 0 100-6 3 3 0 000 6z M7 19c.8-2.4 2.7-3.6 5-3.6s4.2 1.2 5 3.6" /></span>
            </div>

            <ul className="ig-app__grade">
              {posts.map((post) => (
                <li key={post.src}>
                  <a href={linkPerfil} target="_blank" rel="noopener noreferrer" onClick={abrir('instagram_secao_publicacao')}>
                    <img src={post.src} alt={post.alt} width={437} height={581} loading="lazy" />
                    <span className="sr-only"> (ver no Instagram, abre em uma nova aba)</span>
                  </a>
                </li>
              ))}
            </ul>
          </article>
        </Reveal>
      </div>
    </section>
  )
}
