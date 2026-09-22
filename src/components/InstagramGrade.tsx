import { useEffect, useRef, useState } from 'react'
import { registrarClique } from '../lib/analytics'
import type { ImagemCaso } from '../lib/conteudo'
import capa1 from '../assets/instagram/DZS5kcOH5uK.jpg'
import capa2 from '../assets/instagram/DdBr1VeldA9.jpg'
import capa3 from '../assets/instagram/Dc0t-8dFRtJ.jpg'
import capa4 from '../assets/instagram/Dc3nkY_sPer.jpg'

// Capas públicas das publicações cadastradas, obtidas em 22/09/2026.
// Associadas ao identificador do post, nunca à sua posição na lista.
const capas: Record<string, { imagem: string; descricao: string }> = {
  DZS5kcOH5uK: { imagem: capa1, descricao: 'Detalhe do sorriso — publicação da Dra. Anita' },
  DdBr1VeldA9: { imagem: capa2, descricao: 'Naturalidade — publicação do Instituto Vert' },
  'Dc0t-8dFRtJ': { imagem: capa3, descricao: 'Acréscimos em resina — publicação do Instituto Vert' },
  Dc3nkY_sPer: { imagem: capa4, descricao: 'Reel do Instituto Vert' },
}

function identificarPost(url: string) {
  try {
    const destino = new URL(url)
    if (destino.protocol !== 'https:' || !['instagram.com', 'www.instagram.com'].includes(destino.hostname)) return null
    const partes = destino.pathname.match(/^\/(p|reel|reels|tv)\/([\w-]+)\/?$/)
    return partes ? { id: partes[2], reel: partes[1].startsWith('reel') } : null
  } catch { return null }
}

export function InstagramGrade({ posts, galeria }: { posts: string[]; galeria: ImagemCaso[] }) {
  const [ampliada, setAmpliada] = useState<ImagemCaso | null>(null)
  const dialogo = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const elemento = dialogo.current
    if (!elemento) return
    if (ampliada && !elemento.open) elemento.showModal()
    if (!ampliada && elemento.open) elemento.close()
  }, [ampliada])

  return (
    <>
      <div className="ig-grade" aria-label="Grade de publicações e sorrisos">
        {posts.map((url) => {
          const post = identificarPost(url)
          if (!post) return null
          const capa = capas[post.id]
          return (
            <a className="ig-grade__item" key={post.id} href={url} target="_blank" rel="noopener noreferrer"
              onClick={() => registrarClique('instagram_publicacao')}
              aria-label={`${capa?.descricao || 'Ver publicação'} (abre no Instagram em nova aba)`}>
              {capa ? <img src={capa.imagem} alt={capa.descricao} loading="lazy" /> : <span className="ig-grade__sem-capa">Ver publicação ↗</span>}
              <span className="ig-grade__tipo" aria-hidden="true">{post.reel ? 'Reel' : '↗'}</span>
            </a>
          )
        })}
        {galeria.map((imagem, indice) => (
          <button className="ig-grade__item" key={imagem.url} type="button" onClick={() => setAmpliada(imagem)}
            aria-label={`Ampliar ${imagem.legenda || `foto do sorriso ${indice + 1}`}`}>
            <img src={imagem.url} alt={imagem.legenda || 'Sorriso da galeria do Instituto Vert'} loading="lazy" />
            <span className="ig-grade__tipo" aria-hidden="true">↗</span>
          </button>
        ))}
      </div>
      <dialog className="ig-ampliacao" ref={dialogo} aria-label="Foto ampliada do sorriso" onClose={() => setAmpliada(null)}
        onClick={(e) => { if (e.target === e.currentTarget) setAmpliada(null) }}>
        <div className="ig-ampliacao__conteudo">
          <button type="button" className="ig-ampliacao__fechar" onClick={() => setAmpliada(null)} autoFocus>Fechar ×</button>
          {ampliada && <figure><img src={ampliada.url} alt={ampliada.legenda || 'Sorriso da galeria do Instituto Vert'} />{ampliada.legenda && <figcaption>{ampliada.legenda}</figcaption>}</figure>}
        </div>
      </dialog>
    </>
  )
}
