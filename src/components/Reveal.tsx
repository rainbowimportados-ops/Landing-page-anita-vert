import { useEffect, useRef, useState, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** Atraso em ms, para escalonar itens de uma mesma grade. */
  delay?: number
  className?: string
}

/**
 * Revela o conteúdo quando ele entra na viewport.
 * Respeita `prefers-reduced-motion`: nesse caso aparece já visível.
 */
export function Reveal({ children, delay = 0, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
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
    <div
      ref={ref}
      style={visivel ? { animationDelay: `${delay}ms` } : undefined}
      className={`${visivel ? 'animate-fade-up' : 'opacity-0'} ${className}`}
    >
      {children}
    </div>
  )
}
