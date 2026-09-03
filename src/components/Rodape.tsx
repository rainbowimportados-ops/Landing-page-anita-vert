import { clinica, unidades } from '../config/site'
import { registrarClique } from '../lib/analytics'

export function Rodape() {
  return (
    <footer className="bg-forest-900 py-14 text-forest-100">
      <div className="container-vert grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <span className="font-display text-lg text-sand-50">
            Instituto <span className="text-forest-300">Vert</span>
          </span>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-forest-200/80">
            {clinica.tagline} em Franca e Ribeirão Preto.
          </p>
        </div>

        {unidades.map((unidade) => (
          <div key={unidade.slug}>
            <h3 className="text-sm font-semibold text-sand-50">{unidade.nome}</h3>
            <p className="mt-3 text-sm leading-relaxed text-forest-200/80">{unidade.endereco}</p>
            <a
              href={`https://wa.me/${unidade.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => registrarClique(`rodape_whatsapp_${unidade.slug}`, unidade.slug)}
              className="mt-3 inline-block text-sm text-forest-300 underline-offset-4 hover:underline"
            >
              Falar no WhatsApp
            </a>
          </div>
        ))}

        <div>
          <h3 className="text-sm font-semibold text-sand-50">Contato</h3>
          <ul className="mt-3 space-y-2 text-sm text-forest-200/80">
            <li>
              <a
                href={clinica.instagram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => registrarClique('rodape_instagram')}
                className="underline-offset-4 hover:text-forest-100 hover:underline"
              >
                Instagram
              </a>
            </li>
            <li>
              <a
                href={`mailto:${clinica.email}`}
                onClick={() => registrarClique('rodape_email')}
                className="underline-offset-4 hover:text-forest-100 hover:underline"
              >
                {clinica.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="container-vert mt-12 border-t border-forest-800 pt-6 text-xs text-forest-300/70">
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
