import { useEffect, useState } from 'react'
import { clinica } from '../config/site'
import { BotaoWhatsApp } from './CTA'

const navegacao = [
  { href: '#tratamentos', rotulo: 'Tratamentos' },
  { href: '#como-funciona', rotulo: 'Como funciona' },
  { href: '#unidades', rotulo: 'Unidades' },
  { href: '#dentistas', rotulo: 'Para dentistas' },
  { href: '#duvidas', rotulo: 'Dúvidas' },
]

export function Header() {
  const [rolou, setRolou] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 24)
    aoRolar()
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => window.removeEventListener('scroll', aoRolar)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        rolou || menuAberto
          ? 'border-b border-forest-100 bg-sand-50/90 backdrop-blur'
          : 'border-b border-transparent'
      }`}
    >
      <div className="container-vert flex h-16 items-center justify-between gap-4">
        <a href="#topo" className="flex items-center gap-2" aria-label={`${clinica.nome} — início`}>
          <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
            <rect width="32" height="32" rx="8" className="fill-forest-800" />
            <path
              d="M9 11 L16 24 L23 11"
              fill="none"
              className="stroke-forest-100"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-display text-lg tracking-tight text-forest-800">
            Instituto <span className="text-forest-500">Vert</span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Seções da página">
          {navegacao.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-forest-700 transition-colors hover:text-forest-900"
            >
              {item.rotulo}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <BotaoWhatsApp
            rastreio="header_agendar"
            numero={clinica.whatsappComercial}
            mensagem="Olá! Vim pelo site e gostaria de agendar uma avaliação."
            className="hidden px-5 py-2.5 sm:inline-flex"
          >
            Agendar avaliação
          </BotaoWhatsApp>

          <button
            type="button"
            onClick={() => setMenuAberto((aberto) => !aberto)}
            aria-expanded={menuAberto}
            aria-controls="menu-mobile"
            aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
            className="rounded-full border border-forest-200 p-2 text-forest-800 lg:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              {menuAberto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {menuAberto && (
        <nav
          id="menu-mobile"
          className="border-t border-forest-100 bg-sand-50 lg:hidden"
          aria-label="Seções da página"
        >
          <div className="container-vert flex flex-col py-2">
            {navegacao.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuAberto(false)}
                className="border-b border-forest-100/70 py-3 text-sm text-forest-800 last:border-b-0"
              >
                {item.rotulo}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
