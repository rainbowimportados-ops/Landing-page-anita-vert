import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } }
  }
}

const SCRIPT = 'https://www.instagram.com/embed.js'

/** Carrega o embed.js uma vez só, mesmo com vários posts na página. */
function carregarScript(): Promise<void> {
  if (window.instgrm) return Promise.resolve()

  const existente = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`)
  if (existente) {
    return new Promise((resolve) => existente.addEventListener('load', () => resolve()))
  }

  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = SCRIPT
    script.async = true
    script.addEventListener('load', () => resolve())
    // Falha ao carregar não pode quebrar a página: o link do post continua ali.
    script.addEventListener('error', () => resolve())
    document.body.appendChild(script)
  })
}

/**
 * Post do Instagram pelo embed oficial.
 *
 * O blockquote já é um link válido antes do script rodar, então se o embed
 * não carregar — bloqueador, rede ruim — o visitante ainda chega ao post.
 */
export function EmbedInstagram({ url }: { url: string }) {
  const ref = useRef<HTMLQuoteElement>(null)

  useEffect(() => {
    let ativo = true
    void carregarScript().then(() => {
      if (ativo) window.instgrm?.Embeds.process()
    })
    return () => {
      ativo = false
    }
  }, [url])

  return (
    <blockquote
      ref={ref}
      className="instagram-media w-full"
      data-instgrm-permalink={url}
      data-instgrm-version="14"
      style={{ background: '#fff', border: 0, borderRadius: '1rem', margin: 0, padding: 0 }}
    >
      <a href={url} target="_blank" rel="noopener noreferrer">
        Ver publicação no Instagram
      </a>
    </blockquote>
  )
}
