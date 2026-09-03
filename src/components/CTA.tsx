import type { ReactNode } from 'react'
import { linkWhatsApp, registrarClique } from '../lib/analytics'
import { IconWhatsApp } from './Icon'

type Variante = 'primaria' | 'secundaria' | 'clara'

const estilos: Record<Variante, string> = {
  primaria: 'bg-marca-forte text-conteudo-inverso shadow-1 hover-fino:hover:bg-conteudo',
  secundaria:
    'border border-borda-forte bg-superficie text-conteudo hover-fino:hover:border-marca hover-fino:hover:bg-superficie-suave',
  clara: 'bg-conteudo-inverso text-conteudo shadow-2 hover-fino:hover:bg-white',
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

/**
 * Botão que abre o WhatsApp e registra o clique.
 *
 * Altura mínima de 44px e resposta visual ao toque (§2), e o destino é
 * anunciado a leitores de tela porque o link abre em outra aba (§1).
 */
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
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition duration-padrao ease-saida active:scale-[0.98] ${estilos[variante]} ${className}`}
    >
      <IconWhatsApp className="h-[18px] w-[18px] shrink-0" />
      {children}
      <span className="sr-only"> (abre o WhatsApp em uma nova aba)</span>
    </a>
  )
}

type LinkProps = {
  href: string
  className?: string
  children: ReactNode
}

/** Link de âncora com o mesmo peso visual do botão secundário. */
export function BotaoAncora({ href, className = '', children }: LinkProps) {
  return (
    <a
      href={href}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-borda-inversa px-6 py-3 text-sm font-semibold text-conteudo-inverso transition duration-padrao ease-saida active:scale-[0.98] hover-fino:hover:border-conteudo-inverso-tenue hover-fino:hover:bg-superficie-inversa-suave ${className}`}
    >
      {children}
    </a>
  )
}
