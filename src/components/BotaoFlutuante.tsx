import { useEffect, useState } from 'react'
import { useConteudo } from '../lib/ConteudoContexto'
import { linkWhatsApp, registrarClique } from '../lib/analytics'
import { IconWhatsApp } from './Icon'

const MENSAGEM = 'Olá! Vim pelo site e gostaria de agendar uma avaliação.'

/**
 * Atalho fixo para o WhatsApp, exibido depois que o visitante rola a dobra.
 * Fica acima da safe area para não colidir com a barra de gestos (§5).
 */
export function BotaoFlutuante() {
  const { clinica } = useConteudo()
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const aoRolar = () => setVisivel(window.scrollY > 600)
    aoRolar()
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => window.removeEventListener('scroll', aoRolar)
  }, [])

  return (
    <a
      href={linkWhatsApp(clinica.whatsappComercial, MENSAGEM)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => registrarClique('flutuante_whatsapp')}
      aria-hidden={!visivel}
      tabIndex={visivel ? undefined : -1}
      className={`fixed right-5 z-40 inline-flex min-h-[52px] items-center gap-2 rounded-full bg-marca-forte px-5 py-3.5 text-sm font-semibold text-conteudo-inverso shadow-3 transition duration-padrao ease-saida active:scale-95 hover-fino:hover:bg-conteudo ${
        visivel ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
      style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
    >
      <IconWhatsApp />
      Falar no WhatsApp
    </a>
  )
}
