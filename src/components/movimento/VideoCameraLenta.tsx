import { useEffect, useRef, useState } from 'react'

/**
 * Vídeo que toca sozinho, sem som e em câmera lenta enquanto está na tela,
 * e pausa quando sai. Só baixa o arquivo quando chega perto da tela.
 * Com `prefers-reduced-motion` não toca sozinho: fica com os controles.
 */
export function VideoCameraLenta({ src, poster, rotulo, className = '', velocidade = 0.6 }: {
  src: string
  poster?: string
  rotulo: string
  className?: string
  velocidade?: number
}) {
  const video = useRef<HTMLVideoElement>(null)
  const [perto, setPerto] = useState(false)

  useEffect(() => {
    const elemento = video.current
    if (!elemento || typeof IntersectionObserver === 'undefined') return
    const automatico = !window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const aproximacao = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setPerto(true); aproximacao.disconnect() } }, { rootMargin: '600px 0px' })
    const visibilidade = new IntersectionObserver(([e]) => {
      if (!automatico) return
      if (e.isIntersecting) {
        elemento.playbackRate = velocidade
        elemento.play().catch(() => {})
      } else {
        elemento.pause()
      }
    }, { threshold: 0.4 })

    aproximacao.observe(elemento)
    visibilidade.observe(elemento)
    return () => { aproximacao.disconnect(); visibilidade.disconnect() }
  }, [velocidade])

  return (
    <video
      ref={video}
      muted
      loop
      playsInline
      controls
      preload={perto ? 'auto' : 'none'}
      poster={poster}
      aria-label={rotulo}
      className={className}
      // Ao dar play manualmente, mantém a câmera lenta.
      onPlay={(e) => { e.currentTarget.playbackRate = velocidade }}
    >
      {perto && <source src={src} type="video/mp4" />}
      Seu navegador não suporta vídeo.
    </video>
  )
}
