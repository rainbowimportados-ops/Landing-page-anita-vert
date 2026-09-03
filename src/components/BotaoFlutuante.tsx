import { useEffect, useState } from 'react'
import { clinica } from '../config/site'
import { linkWhatsApp, registrarClique } from '../lib/analytics'
import { IconWhatsApp } from './Icon'

const MENSAGEM = 'Olá! Vim pelo site e gostaria de agendar uma avaliação.'

/** Atalho fixo para o WhatsApp, exibido depois que o visitante rola a dobra. */
export function BotaoFlutuante() {
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
      aria-label="Falar no WhatsApp"
      className={`fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-forest-700 px-5 py-3.5 text-sm font-semibold text-sand-50 shadow-lg shadow-forest-900/25 transition-all duration-300 hover:bg-forest-800 ${
        visivel ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <IconWhatsApp />
      <span className="hidden sm:inline">Falar no WhatsApp</span>
    </a>
  )
}
