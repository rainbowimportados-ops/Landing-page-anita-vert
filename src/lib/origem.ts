/**
 * Origem da visita, guardada no primeiro acesso da sessão (first touch).
 * Assim, se o visitante navega pela página e só depois clica, o lead ainda
 * carrega a campanha que o trouxe. Nenhum dado pessoal aqui.
 *
 * Além das `utm_*`, guarda os identificadores de clique do Google Ads
 * (`gclid`, `gbraid`, `wbraid`) e os parâmetros do rastreamento automático.
 * São eles que ligam o lead ao clique no anúncio e permitem devolver ao
 * Google a venda real (importação de conversões offline). Só são lidos depois
 * do aceite das métricas.
 */
const CHAVE = 'vert_origem_v1'
const PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const
const CLIQUES = ['gclid', 'gbraid', 'wbraid'] as const
const AUTOTAG = ['gad_source', 'gad_campaignid'] as const

type ChaveUtm = (typeof PARAMS)[number] | (typeof CLIQUES)[number] | (typeof AUTOTAG)[number]

export type Origem = {
  utm: Partial<Record<ChaveUtm, string>>
  referrer: string
  pagina: string
}

function ler(): Origem | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE)
    return bruto ? (JSON.parse(bruto) as Origem) : null
  } catch {
    return null
  }
}

/** Valor do parâmetro, limitado em tamanho; vazio vira indefinido. */
function parametro(params: URLSearchParams, chave: string, limite: number): string | undefined {
  const valor = params.get(chave)?.trim()
  return valor ? valor.slice(0, limite) : undefined
}

export function origemDaVisita(): Origem {
  const salva = ler()
  const params = new URLSearchParams(window.location.search)

  const utm: Origem['utm'] = {}
  PARAMS.forEach((chave) => {
    const valor = parametro(params, chave, 100)
    if (valor) utm[chave] = valor
  })
  // Identificadores de clique são longos (cerca de 100 caracteres).
  CLIQUES.forEach((chave) => {
    const valor = parametro(params, chave, 200)
    if (valor) utm[chave] = valor
  })
  AUTOTAG.forEach((chave) => {
    const valor = parametro(params, chave, 50)
    if (valor) utm[chave] = valor
  })
  const origemInstagram = params.get('origem')
  if (origemInstagram && !utm.utm_source) utm.utm_source = `instagram:${origemInstagram}`.slice(0, 100)

  // Primeiro acesso da sessão vale, exceto quando chega um novo clique de
  // anúncio: aí vale o clique mais recente, que é o que o Google atribui.
  const novoClique = CLIQUES.some((chave) => utm[chave])
  if (salva && !novoClique) return salva

  let referrer = ''
  try {
    if (document.referrer) {
      const host = new URL(document.referrer).hostname.replace(/^www\./, '')
      if (host !== window.location.hostname) referrer = host.slice(0, 100)
    }
  } catch {
    referrer = ''
  }

  const origem: Origem = { utm, referrer, pagina: window.location.pathname.slice(0, 300) }
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(origem))
  } catch {
    // Sem sessionStorage (aba privada antiga): segue só com a origem atual.
  }
  return origem
}
