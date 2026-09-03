import { clinica, unidades } from '../config/site'
import { registrarClique } from '../lib/analytics'

/** Links do rodapé com altura de toque de 44px (§2 touch-target-size). */
const classeLink =
  'inline-flex min-h-[44px] items-center text-sm text-conteudo-inverso-suave underline-offset-4 transition-colors duration-rapido hover-fino:hover:text-conteudo-inverso hover-fino:hover:underline'

export function Rodape() {
  return (
    <footer className="bg-superficie-rodape py-12 text-conteudo-inverso-suave">
      <div className="container-vert grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <span className="font-display text-lg text-conteudo-inverso">
            Instituto <span className="text-realce">Vert</span>
          </span>
          <p className="mt-3 max-w-xs text-sm leading-relaxed">
            {clinica.tagline} em Franca e Ribeirão Preto.
          </p>
        </div>

        {unidades.map((unidade) => (
          <div key={unidade.slug}>
            <h3 className="text-sm font-semibold text-conteudo-inverso">{unidade.nome}</h3>
            <p className="mt-3 text-sm leading-relaxed">{unidade.endereco}</p>
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
          <h3 className="text-sm font-semibold text-conteudo-inverso">Contato</h3>
          <ul className="mt-1">
            <li>
              <a
                href={clinica.instagram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => registrarClique('rodape_instagram')}
                className={classeLink}
              >
                Instagram
                <span className="sr-only"> (abre em uma nova aba)</span>
              </a>
            </li>
            <li>
              <a
                href={`mailto:${clinica.email}`}
                onClick={() => registrarClique('rodape_email')}
                className={classeLink}
              >
                {clinica.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="container-vert mt-10 border-t border-borda-inversa pt-6 text-xs text-conteudo-inverso-tenue">
        <p>
          © {new Date().getFullYear()} {clinica.nome}. Todos os direitos reservados.
        </p>
        <p className="mt-1">
          {/* TODO: preencher a razão social, o CNPJ e o CRO do responsável técnico —
              exigidos pela resolução do CFO para publicidade odontológica. */}
          TODO: razão social · CNPJ · responsável técnico e CRO
        </p>
      </div>
    </footer>
  )
}
