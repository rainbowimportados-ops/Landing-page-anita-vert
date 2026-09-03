import type { ReactNode } from 'react'
import { linkWhatsApp, registrarClique } from '../lib/analytics'
import { IconWhatsApp } from './Icon'

type Variante = 'primaria' | 'secundaria' | 'clara'

const estilos: Record<Variante, string> = {
  primaria:
    'bg-forest-700 text-sand-50 hover:bg-forest-800 shadow-sm shadow-forest-900/20',
  secundaria:
    'border border-forest-200 bg-white text-forest-800 hover:border-forest-400 hover:bg-forest-50',
  clara: 'bg-sand-50 text-forest-800 hover:bg-white',
}

type Props = {
  /** Identificador gravado na coluna `botao` de link_clicks. */
  rastreio: string
  numero: string
  mensagem: string
  unidade?: string | null
  variante?: Variante
  className?: string
  children: ReactNode
}

/** Botão que abre o WhatsApp e registra o clique. */
export function BotaoWhatsApp({
  rastreio,
  numero,
  mensagem,
  unidade = null,
  variante = 'primaria',
  className = '',
  children,
}: Props) {
  return (
    <a
      href={linkWhatsApp(numero, mensagem)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => registrarClique(rastreio, unidade)}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors duration-200 ${estilos[variante]} ${className}`}
    >
      <IconWhatsApp className="h-[18px] w-[18px] shrink-0" />
      {children}
    </a>
  )
}
