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
  { href: '#duvidas', rotulo: 'Dúvidas' },
]

export function Rodape() {
  const { clinica, unidades, rodapeLegal, instagram } = useConteudo()

  return (
    <footer className="bg-superficie-rodape pb-10 pt-16 text-conteudo-inverso-suave">
      <div className="container-vert">
        <div className="grid gap-10 border-b border-borda-inversa pb-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <MarcaVert versao="empilhada" className="h-14 text-conteudo-inverso" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed">
              {clinica.tagline} em Franca e Ribeirão Preto.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <nav aria-label="Rodapé">
              <h3 className={titulo}>Navegação</h3>
              <ul className="mt-2">
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
                    <a href={`mailto:${clinica.email}`} onClick={() => registrarClique('rodape_email')} className={classeLink}>
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
          <ul className="flex gap-5">
            <li><a href="/privacidade" className={classeLink}>Política de privacidade</a></li>
            <li><a href="/termos" className={classeLink}>Termos de uso</a></li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
