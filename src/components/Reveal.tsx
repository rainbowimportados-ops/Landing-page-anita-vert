import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** Atraso em ms. Use passos de ~45ms para escalonar itens de uma grade (§7). */
  delay?: number
  className?: string
  /**
   * Elemento a renderizar. Dentro de `<ol>`/`<ul>` passe `as="li"`: um `<div>`
   * entre a lista e seus itens quebra o modelo de conteúdo e faz o leitor de
   * tela deixar de anunciar a contagem de itens.
   */
  as?: ElementType
}

/**
 * Revela o conteúdo quando ele entra na viewport.
 * Respeita `prefers-reduced-motion`: nesse caso aparece já visível, sem atraso.
 */
export function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }: Props) {
  const ref = useRef<HTMLElement>(null)
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const elemento = ref.current
    if (!elemento) return

    const semAnimacao = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (semAnimacao || typeof IntersectionObserver === 'undefined') {
      setVisivel(true)
      return
    }

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisivel(true)
          observador.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    )

    observador.observe(elemento)
    return () => observador.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      style={visivel ? { animationDelay: `${delay}ms` } : undefined}
      className={`${visivel ? 'animate-fade-up' : 'opacity-0'} ${className}`}
    >
      {children}
    </Tag>
  )
}
