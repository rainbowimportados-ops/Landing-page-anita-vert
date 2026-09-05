import { useEffect, useState } from 'react'
import { useConteudo } from '../lib/ConteudoContexto'
import { BotaoWhatsApp } from './CTA'

const navegacao = [
  { id: 'tratamentos', rotulo: 'Tratamentos' },
  { id: 'como-funciona', rotulo: 'Como funciona' },
  { id: 'unidades', rotulo: 'Unidades' },
  { id: 'dentistas', rotulo: 'Para dentistas' },
  { id: 'duvidas', rotulo: 'Dúvidas' },
]

export function Header() {
  const { clinica } = useConteudo()
  const [rolou, setRolou] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const [secaoAtiva, setSecaoAtiva] = useState<string | null>(null)

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 24)
    aoRolar()
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => window.removeEventListener('scroll', aoRolar)
  }, [])

  /* §9 nav-state-active: o item da seção visível fica destacado. */
  useEffect(() => {
    const secoes = navegacao
      .map((item) => document.getElementById(item.id))
      .filter((elemento): elemento is HTMLElement => elemento !== null)

    if (secoes.length === 0 || typeof IntersectionObserver === 'undefined') return

    const observador = new IntersectionObserver(
      (entradas) => {
        const visiveis = entradas
          .filter((entrada) => entrada.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visiveis[0]) setSecaoAtiva(visiveis[0].target.id)
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )

    secoes.forEach((secao) => observador.observe(secao))
    return () => observador.disconnect()
  }, [])

  /*
   * No topo o cabeçalho é transparente sobre o hero escuro, então tudo dentro
   * dele precisa das cores inversas. Com a barra clara (rolado ou menu aberto)
   * volta ao par escuro sobre claro.
   */
  const sobreHero = !rolou && !menuAberto

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-padrao ease-saida ${
        sobreHero ? 'border-b border-transparent' : 'border-b border-borda bg-fundo/90 backdrop-blur'
      }`}
    >
      <div className="container-vert flex h-16 items-center justify-between gap-4">
        <a
          href="#topo"
          className="-ml-1 inline-flex min-h-[44px] items-center gap-2 rounded-lg px-1"
          aria-label={`${clinica.nome} — início`}
        >
          <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
            <rect
              width="32"
              height="32"
              rx="8"
              fill={sobreHero ? 'rgb(var(--cor-conteudo-inverso))' : 'rgb(var(--cor-superficie-inversa))'}
            />
            <path
              d="M9 11 L16 24 L23 11"
              fill="none"
              stroke={sobreHero ? 'rgb(var(--cor-superficie-inversa))' : 'rgb(var(--cor-marca-tenue))'}
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className={`font-display text-lg tracking-tight transition-colors duration-padrao ${
              sobreHero ? 'text-conteudo-inverso' : 'text-conteudo'
            }`}
          >
            Instituto <span className={sobreHero ? 'text-realce' : 'text-marca'}>Vert</span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Seções da página">
          {navegacao.map((item) => {
            const ativo = secaoAtiva === item.id
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={ativo ? 'true' : undefined}
                className={`rounded-full px-3 py-2 text-sm transition-colors duration-rapido ${
                  ativo
                    ? sobreHero
                      ? 'bg-superficie-inversa-suave font-medium text-conteudo-inverso'
                      : 'bg-marca-tenue font-medium text-conteudo'
                    : sobreHero
                      ? 'text-conteudo-inverso-suave hover-fino:hover:text-conteudo-inverso'
                      : 'text-conteudo-suave hover-fino:hover:text-conteudo'
                }`}
              >
                {item.rotulo}
              </a>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <BotaoWhatsApp
            rastreio="header_agendar"
            numero={clinica.whatsappComercial}
            mensagem="Olá! Vim pelo site e gostaria de agendar uma avaliação."
            variante={sobreHero ? 'clara' : 'primaria'}
            className="hidden px-5 sm:inline-flex"
          >
            Agendar avaliação
          </BotaoWhatsApp>

          <button
            type="button"
            onClick={() => setMenuAberto((aberto) => !aberto)}
            aria-expanded={menuAberto}
            aria-controls="menu-mobile"
            aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition duration-rapido active:scale-95 lg:hidden ${
              sobreHero
                ? 'border-borda-inversa text-conteudo-inverso'
                : 'border-borda-forte text-conteudo'
            }`}
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
          className="border-t border-borda bg-fundo lg:hidden"
          aria-label="Seções da página"
        >
          <div className="container-vert flex flex-col py-1">
            {navegacao.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setMenuAberto(false)}
                aria-current={secaoAtiva === item.id ? 'true' : undefined}
                className={`flex min-h-[48px] items-center border-b border-borda/70 text-sm last:border-b-0 ${
                  secaoAtiva === item.id ? 'font-medium text-conteudo' : 'text-conteudo-suave'
                }`}
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
