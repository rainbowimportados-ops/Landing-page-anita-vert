import { Fragment, useState } from 'react'
import './instagram-perfil.css'
import { perfisInstagram, type PerfilInstagramApp } from '../config/site'
import { registrarClique } from '../lib/analytics'
import { MarcaVert } from './MarcaVert'
import { Reveal } from './Reveal'
import vert1 from '../assets/instagram/perfil/post-1.webp'
import vert2 from '../assets/instagram/perfil/post-2.webp'
import vert3 from '../assets/instagram/perfil/post-3.webp'
import vert4 from '../assets/instagram/perfil/post-4.webp'
import vert5 from '../assets/instagram/perfil/post-5.webp'
import vert6 from '../assets/instagram/perfil/post-6.webp'
import anitaFoto from '../assets/instagram/anita/avatar.webp'
import anita1 from '../assets/instagram/anita/post-1.webp'
import anita2 from '../assets/instagram/anita/post-2.webp'
import anita3 from '../assets/instagram/anita/post-3.webp'
import anita4 from '../assets/instagram/anita/post-4.webp'
import anita5 from '../assets/instagram/anita/post-5.webp'
import anita6 from '../assets/instagram/anita/post-6.webp'

// Capas na ordem da grade de cada perfil.
const capas: Record<PerfilInstagramApp['pasta'], { src: string; alt: string }[]> = {
  perfil: [
    { src: vert1, alt: 'Paciente sorrindo e detalhe das lentes em resina' },
    { src: vert2, alt: 'Bastidores de um curso do Instituto Vert' },
    { src: vert3, alt: 'Antes e depois do sorriso de um paciente' },
    { src: vert4, alt: 'Dra. Anita Almeida' },
    { src: vert5, alt: 'Antes e depois do sorriso de uma paciente' },
    { src: vert6, alt: 'Antes e depois do sorriso de uma paciente, em close' },
  ],
  anita: [
    { src: anita1, alt: 'Dra. Anita Almeida no consultório' },
    { src: anita2, alt: 'Antes e depois do sorriso de uma paciente' },
    { src: anita3, alt: 'Sorriso com lentes em resina, em close' },
    { src: anita4, alt: 'Dra. Anita Almeida atendendo durante um curso' },
    { src: anita5, alt: 'Dra. Anita Almeida em viagem' },
    { src: anita6, alt: 'Bolo de aniversário de 30 anos' },
  ],
}

const urlPerfil = (usuario: string) => `https://www.instagram.com/${usuario}/`

function Icone({ d, className = 'h-6 w-6' }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

function Verificado() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" role="img" aria-label="Conta verificada">
      <path fill="#0095f6" d="M12 1.5l2.6 1.9 3.2-.1 1 3 2.6 1.9-1 3.1 1 3.1-2.6 1.9-1 3-3.2-.1L12 22.5l-2.6-1.9-3.2.1-1-3-2.6-1.9 1-3.1-1-3.1 2.6-1.9 1-3 3.2.1z" />
      <path d="M8 12.3l2.6 2.6L16.2 9" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Troca "@usuario" por link para o perfil. */
function LinhaBio({ texto, rastreio }: { texto: string; rastreio: string }) {
  return (
    <p>
      {texto.split(/(@[\w.]+)/g).map((parte, i) =>
        parte.startsWith('@') ? (
          <a key={i} href={urlPerfil(parte.slice(1))} target="_blank" rel="noopener noreferrer" onClick={() => registrarClique(rastreio)} className="ig-app__mencao">
            {parte}
          </a>
        ) : (
          <Fragment key={i}>{parte}</Fragment>
        ),
      )}
    </p>
  )
}

function PerfilApp({ perfil }: { perfil: PerfilInstagramApp }) {
  const link = urlPerfil(perfil.usuario)
  const abrir = (acao: string) => () => registrarClique(`instagram_${perfil.pasta}_${acao}`)

  return (
    <article className="ig-app" aria-label={`Perfil @${perfil.usuario} no Instagram`}>
      <header className="ig-app__barra">
        <span className="ig-app__usuario">
          {perfil.usuario}
          {perfil.verificado && <Verificado />}
        </span>
        <Icone className="h-6 w-6" d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9 M10.3 21a1.94 1.94 0 003.4 0" />
      </header>

      <div className="ig-app__topo">
        <a href={link} target="_blank" rel="noopener noreferrer" onClick={abrir('avatar')} className="ig-app__avatar" aria-label={`Abrir @${perfil.usuario} no Instagram`}>
          <span className="ig-app__avatar-foto">
            {perfil.pasta === 'anita' ? (
              <img src={anitaFoto} alt="" width={240} height={240} loading="lazy" />
            ) : (
              <MarcaVert versao="empilhada" className="h-7 text-[#e9dccf]" />
            )}
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
        {perfil.categoria && <p className="ig-app__categoria">{perfil.categoria}</p>}
        {perfil.bio.map((linha) => (
          <LinhaBio key={linha} texto={linha} rastreio={`instagram_${perfil.pasta}_mencao`} />
        ))}
        <p className="ig-app__link">
          <Icone className="h-4 w-4" d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.7 1.7 M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.7-1.7" />
          {perfil.link}
        </p>
      </div>

      <div className="ig-app__acoes">
        <a href={link} target="_blank" rel="noopener noreferrer" onClick={abrir('seguir')} className="ig-app__botao ig-app__botao--seguir">
          Seguir<span className="sr-only"> @{perfil.usuario} no Instagram (abre em uma nova aba)</span>
        </a>
        <a href={`https://ig.me/m/${perfil.usuario}`} target="_blank" rel="noopener noreferrer" onClick={abrir('mensagem')} className="ig-app__botao">
          Mensagem<span className="sr-only"> para @{perfil.usuario} no Instagram (abre em uma nova aba)</span>
        </a>
      </div>

      <div className="ig-app__abas" aria-hidden="true">
        <span className="is-ativa"><Icone d="M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z" /></span>
        <span><Icone d="M4 4h16v16H4z M10 8.5v7l5.5-3.5z" /></span>
        <span><Icone d="M4 4h16v16H4z M12 11a3 3 0 100-6 3 3 0 000 6z M7 19c.8-2.4 2.7-3.6 5-3.6s4.2 1.2 5 3.6" /></span>
      </div>

      <ul className="ig-app__grade">
        {capas[perfil.pasta].map((post) => (
          <li key={post.src}>
            <a href={link} target="_blank" rel="noopener noreferrer" onClick={abrir('publicacao')}>
              <img src={post.src} alt={post.alt} width={435} height={579} loading="lazy" />
              <span className="sr-only"> (ver no Instagram, abre em uma nova aba)</span>
            </a>
          </li>
        ))}
      </ul>
    </article>
  )
}

/** Perfis da clínica e da Dra. Anita no formato do app do Instagram. */
export function InstagramSecao() {
  // No celular um perfil por vez, escolhido nas abas; no computador os dois lado a lado.
  const [ativo, setAtivo] = useState(0)

  return (
    <section id="instagram" className="secao" aria-labelledby="instagram-titulo">
      <div className="container-vert">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="olho">No Instagram</p>
          <h2 id="instagram-titulo" className="titulo-secao mt-4">Acompanhe o dia a dia do Instituto Vert</h2>
          <p className="lead mt-4">
            Casos reais e bastidores dos cursos no perfil da clínica, e a rotina da Dra. Anita no perfil dela.
          </p>
        </Reveal>

        <div role="tablist" aria-label="Escolha o perfil" className="unidades-abas mx-auto mt-8 grid max-w-sm grid-cols-2 gap-1 rounded-2xl p-1 lg:hidden">
          {perfisInstagram.map((perfil, i) => (
            <button
              key={perfil.usuario}
              role="tab"
              id={`ig-aba-${perfil.pasta}`}
              aria-controls={`ig-painel-${perfil.pasta}`}
              aria-selected={i === ativo}
              onClick={() => setAtivo(i)}
              className={`min-h-[44px] rounded-xl px-3 text-sm transition-colors duration-rapido ${
                i === ativo ? 'bg-marca-forte text-conteudo-inverso shadow-2' : 'text-conteudo-suave'
              }`}
            >
              @{perfil.usuario}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-8 lg:mt-12 lg:grid-cols-2 lg:items-start">
          {perfisInstagram.map((perfil, i) => (
            <Reveal key={perfil.usuario} delay={i * 80} className={i === ativo ? '' : 'hidden lg:block'}>
              <div role="tabpanel" id={`ig-painel-${perfil.pasta}`} aria-labelledby={`ig-aba-${perfil.pasta}`}>
                <PerfilApp perfil={perfil} />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
