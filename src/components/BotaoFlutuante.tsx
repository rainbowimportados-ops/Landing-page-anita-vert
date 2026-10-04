import { useEffect, useState } from 'react'
import { useConteudo } from '../lib/ConteudoContexto'
import { linkWhatsApp } from '../lib/analytics'
import { useCaptura } from './Captura'
import { IconWhatsApp } from './Icon'

const MENSAGEM = 'Olá! Vim pelo site e gostaria de agendar uma avaliação.'

/**
 * Atalho fixo para agendar, exibido depois que o visitante rola a dobra.
 * No celular é uma barra na base, na altura do polegar e acima da barra de gestos (§5);
 * no computador é uma pílula no canto. Some quando o rodapé aparece, porque ele já tem
 * os contatos e não deve ficar coberto.
 */
export function BotaoFlutuante() {
  const { clinica } = useConteudo()
  const abrirCaptura = useCaptura()
  const [rolou, setRolou] = useState(false)
  const [noRodape, setNoRodape] = useState(false)
  const visivel = rolou && !noRodape

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 600)
    aoRolar()
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => window.removeEventListener('scroll', aoRolar)
  }, [])

  useEffect(() => {
    const rodape = document.querySelector('footer')
    if (!rodape) return
    const observador = new IntersectionObserver(([entrada]) => setNoRodape(entrada.isIntersecting))
    observador.observe(rodape)
    return () => observador.disconnect()
  }, [])

  return (
    <div
      className={`floating-cta fixed inset-x-0 bottom-0 z-40 border-t border-borda/70 bg-fundo/90 px-4 pt-2.5 backdrop-blur-xl transition duration-padrao ease-saida sm:inset-x-auto sm:bottom-5 sm:right-5 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none ${
        visivel ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
      style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom))' }}
    >
      <a
        href={linkWhatsApp(clinica.whatsappComercial, MENSAGEM)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(evento) => {
          evento.preventDefault()
          abrirCaptura({ intencao: 'avaliacao', cta: 'flutuante_whatsapp', numero: clinica.whatsappComercial, mensagem: MENSAGEM })
        }}
        aria-hidden={!visivel}
        tabIndex={visivel ? undefined : -1}
        className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-marca-forte px-5 py-3.5 text-sm font-semibold text-conteudo-inverso shadow-3 transition duration-padrao ease-saida active:scale-95 hover-fino:hover:bg-conteudo sm:w-auto sm:rounded-full"
      >
        <IconWhatsApp />
        <span className="sm:hidden">Agendar avaliação</span>
        <span className="hidden sm:inline">Falar no WhatsApp</span>
      </a>
    </div>
  )
}
