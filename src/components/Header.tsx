import { useEffect, useState } from 'react'
import { useConteudo } from '../lib/ConteudoContexto'
import { MarcaVert } from './MarcaVert'
import { BotaoWhatsApp } from './CTA'

const navegacao = [
  { id: 'tratamentos', rotulo: 'Tratamentos' },
  { id: 'resultados', rotulo: 'Resultados' },
  { id: 'unidades', rotulo: 'Unidades' },
  { id: 'cursos', rotulo: 'Cursos' },
  { id: 'sobre', rotulo: 'Sobre' },
  { id: 'contato', rotulo: 'Contato' },
]

export function Header() {
  const { clinica } = useConteudo()
  const [rolou, setRolou] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const [secaoAtiva, setSecaoAtiva] = useState<string | null>(null)
  const [progresso, setProgresso] = useState(0)

  useEffect(() => {
    let frame = 0
    const aoRolar = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        const maximo = document.documentElement.scrollHeight - window.innerHeight
        const valor = maximo > 0 ? Math.min(1, window.scrollY / maximo) : 0
        document.documentElement.style.setProperty('--scroll-y', `${window.scrollY}px`)
        setRolou(window.scrollY > 24)
        setProgresso(valor)
        frame = 0
      })
    }
    aoRolar()
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => {
      window.removeEventListener('scroll', aoRolar)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

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
      { rootMargin: '-42% 0px -50% 0px' },
    )

    secoes.forEach((secao) => observador.observe(secao))
    return () => observador.disconnect()
  }, [])

  const topo = !rolou && !menuAberto

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-padrao ease-saida ${
        topo
          ? 'border-b border-transparent bg-fundo/[0.35] backdrop-blur-md'
          : 'border-b border-borda/70 bg-fundo/[0.82] shadow-2 backdrop-blur-xl backdrop-saturate-150'
      }`}
    >
      <div className="container-vert flex h-[5rem] items-center justify-between gap-4">
        <a
          href="#topo"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-1"
          aria-label={`${clinica.nome} — início`}
        >
          {/* Versão circular oficial, sozinha, em todos os tamanhos. */}
          <MarcaVert versao="circular" className="h-14 text-conteudo sm:h-16" />
        </a>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Seções da página">
          {navegacao.map((item) => {
            const ativo = secaoAtiva === item.id
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={ativo ? 'true' : undefined}
                className={`relative px-3 py-2 text-[0.8125rem] transition-colors duration-rapido after:absolute after:inset-x-3 after:-bottom-0.5 after:h-px after:origin-left after:bg-conteudo after:transition-transform after:duration-padrao ${
                  ativo ? 'text-conteudo after:scale-x-100' : 'text-conteudo-suave after:scale-x-0 hover-fino:hover:text-conteudo'
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
            intencao="avaliacao"
            numero={clinica.whatsappComercial}
            mensagem="Olá! Vim pelo site e gostaria de agendar uma avaliação."
            icone="seta"
            className="hidden px-6 sm:inline-flex"
          >
            Agendar avaliação
          </BotaoWhatsApp>

          <button
            type="button"
            onClick={() => setMenuAberto((aberto) => !aberto)}
            aria-expanded={menuAberto}
            aria-controls="menu-mobile"
            aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition duration-rapido active:scale-95 xl:hidden ${
              'border-borda-forte text-conteudo'
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

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left bg-gradient-to-r from-realce via-marca to-realce transition-transform duration-rapido ease-saida"
        style={{ transform: `scaleX(${progresso})` }}
      />

      {menuAberto && (
        <nav id="menu-mobile" className="border-t border-borda/70 bg-fundo/[0.92] backdrop-blur-xl xl:hidden" aria-label="Seções da página">
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
