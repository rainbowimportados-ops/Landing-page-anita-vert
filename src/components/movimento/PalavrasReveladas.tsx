import { m, useReducedMotion } from 'motion/react'

/**
 * Título que entra palavra por palavra, saindo de um leve desfoque.
 * Cada palavra fica num span com o espaço preservado, então leitores de tela
 * leem a frase normalmente. Sem animação com `prefers-reduced-motion`.
 */
export function PalavrasReveladas({ texto, atraso = 0, passo = 0.075 }: { texto: string; atraso?: number; passo?: number }) {
  const reduzir = useReducedMotion()
  if (reduzir) return <>{texto}</>

  return (
    <>
      {texto.split(' ').map((palavra, i) => (
        <m.span
          key={`${palavra}-${i}`}
          className="inline-block will-change-transform"
          initial={{ opacity: 0, y: '0.35em', filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.1, delay: atraso + i * passo, ease: [0.16, 1, 0.3, 1] }}
        >
          {palavra}
          {i < texto.split(' ').length - 1 ? ' ' : ''}
        </m.span>
      ))}
    </>
  )
}
