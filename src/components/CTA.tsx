import type { ReactNode } from 'react'
import { linkWhatsApp, registrarClique } from '../lib/analytics'
import type { Intencao } from '../lib/captura'
import { useCaptura } from './Captura'
import { IconSeta, IconWhatsApp } from './Icon'

type Variante = 'primaria' | 'secundaria' | 'clara'

const estilos: Record<Variante, string> = {
  primaria: 'bg-marca-forte text-conteudo-inverso shadow-1 hover-fino:hover:bg-conteudo',
  secundaria:
    'border border-conteudo/70 bg-transparent text-conteudo hover-fino:hover:bg-superficie',
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
  /** Quando definido, o clique abre o modal de captação antes do WhatsApp. */
  intencao?: Intencao
  /** `seta`: rótulo seguido de seta, como nos CTAs editoriais. */
  icone?: 'whatsapp' | 'seta'
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
  intencao,
  icone = 'whatsapp',
  children,
}: Props) {
  const abrirCaptura = useCaptura()
  return (
    <a
      href={linkWhatsApp(numero, mensagem)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(evento) => {
        if (intencao) {
          evento.preventDefault()
          abrirCaptura({ intencao, unidade, cta: rastreio, numero, mensagem })
          return
        }
        registrarClique(rastreio, unidade)
      }}
      className={`inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl px-6 py-3 text-sm font-medium tracking-[0.01em] transition duration-padrao ease-saida active:scale-[0.98] ${estilos[variante]} ${className}`}
    >
      {icone === 'whatsapp' && <IconWhatsApp className="h-[18px] w-[18px] shrink-0" />}
      {children}
      {icone === 'seta' && <IconSeta className="h-4 w-4 shrink-0" />}
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
export function BotaoAncora({ href, className = '', escuro = false, children }: LinkProps & { escuro?: boolean }) {
  const cores = escuro
    ? 'border-borda-inversa text-conteudo-inverso hover-fino:hover:bg-superficie-inversa-suave'
    : 'border-conteudo/70 text-conteudo hover-fino:hover:bg-superficie'
  return (
    <a
      href={href}
      className={`inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl border px-6 py-3 text-sm font-medium transition duration-padrao ease-saida active:scale-[0.98] ${cores} ${className}`}
    >
      {children}
    </a>
  )
}
