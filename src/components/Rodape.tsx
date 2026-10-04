import { registrarClique } from '../lib/analytics'
import { useConteudo } from '../lib/ConteudoContexto'
import { MarcaVert } from './MarcaVert'

/** Links do rodapé com altura de toque de 44px (§2 touch-target-size). */
const classeLink =
  'inline-flex min-h-[44px] items-center text-sm text-conteudo-inverso-suave underline-offset-4 transition-colors duration-rapido hover-fino:hover:text-conteudo-inverso hover-fino:hover:underline'

const titulo = 'text-xs font-semibold uppercase tracking-[0.18em] text-conteudo-inverso'

const navegacao = [
  { href: '#tratamentos', rotulo: 'Tratamentos' },
  { href: '#resultados', rotulo: 'Resultados' },
  { href: '#sobre', rotulo: 'Sobre' },
  { href: '#cursos', rotulo: 'Cursos' },
  { href: '#unidades', rotulo: 'Unidades' },
  { href: '#duvidas', rotulo: 'Dúvidas' },
  { href: '#contato', rotulo: 'Contato' },
]

export function Rodape() {
  const { clinica, unidades, rodapeLegal, instagram } = useConteudo()

  return (
    <footer className="bg-superficie-rodape pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-10 text-conteudo-inverso-suave sm:pb-8 sm:pt-12">
      <div className="container-vert">
        <div className="grid gap-6 border-b border-borda-inversa pb-8 sm:gap-8 sm:pb-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <MarcaVert versao="circular" className="h-16 text-conteudo-inverso sm:h-24" />
            <p className="mt-4 font-display text-xl italic leading-snug text-conteudo-inverso sm:mt-6 sm:text-2xl">
              “Cada sorriso tem uma história… e é por isso que fazemos o que fazemos.”
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed">{clinica.tagline} em Franca e Ribeirão Preto.</p>
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-x-5 gap-y-6 sm:gap-8 lg:grid-cols-4">
            <nav aria-label="Rodapé" className="hidden sm:block">
              <h3 className={titulo}>Navegação</h3>
              <ul className="mt-1 grid grid-cols-1">
                {navegacao.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} className={classeLink}>{item.rotulo}</a>
                  </li>
                ))}
              </ul>
            </nav>

            {unidades.map((unidade) => (
              <div key={unidade.slug}>
                <h3 className={titulo}>{unidade.nome}</h3>
                <p className="mt-4 text-sm leading-relaxed">{unidade.endereco}</p>
                <a
                  href={`https://wa.me/${unidade.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => registrarClique(`rodape_whatsapp_${unidade.slug}`, unidade.slug)}
                  className={classeLink}
                >
                  Falar no WhatsApp
                  <span className="sr-only"> — {unidade.nome} (abre em uma nova aba)</span>
                </a>
              </div>
            ))}

            <div>
              <h3 className={titulo}>Contato</h3>
              <ul className="mt-2">
                <li>
                  <a
                    href={instagram.clinica}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => registrarClique('rodape_instagram_clinica')}
                    className={classeLink}
                  >
                    Instagram da clínica
                    <span className="sr-only"> (abre em uma nova aba)</span>
                  </a>
                </li>
                {instagram.anita && (
                  <li>
                    <a
                      href={instagram.anita}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => registrarClique('rodape_instagram_anita')}
                      className={classeLink}
                    >
                      Instagram da Dra. Anita
                      <span className="sr-only"> (abre em uma nova aba)</span>
                    </a>
                  </li>
                )}
                {clinica.email && (
                  <li>
                    <a href={`mailto:${clinica.email}`} onClick={() => registrarClique('rodape_email')} className="block min-h-[44px] max-w-full break-all py-3 text-sm text-conteudo-inverso-suave underline-offset-4 transition-colors duration-rapido hover-fino:hover:text-conteudo-inverso hover-fino:hover:underline">
                      {clinica.email}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 text-xs text-conteudo-inverso-tenue lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p>© {new Date().getFullYear()} {clinica.nome}. Todos os direitos reservados.</p>
            {/* Razão social, CNPJ e responsável técnico com CRO: exigidos pela
                resolução do CFO para publicidade odontológica. Preenchido pelo
                painel em /config; enquanto vazio, a linha não é exibida. */}
            {rodapeLegal && <p className="mt-1 max-w-3xl">{rodapeLegal}</p>}
          </div>
          <ul className="flex flex-wrap gap-x-5 lg:shrink-0 lg:flex-nowrap">
            <li><button type="button" onClick={() => window.dispatchEvent(new Event('vert:privacy-settings'))} className={`${classeLink} whitespace-nowrap`}>Privacidade e dados</button></li>
            <li><a href="/privacidade" className={`${classeLink} whitespace-nowrap`}>Política de privacidade</a></li>
            <li><a href="/termos" className={`${classeLink} whitespace-nowrap`}>Termos de uso</a></li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
