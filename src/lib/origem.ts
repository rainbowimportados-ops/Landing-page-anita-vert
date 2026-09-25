/**
 * Origem da visita, guardada no primeiro acesso da sessão (first touch).
 * Assim, se o visitante navega pela página e só depois clica, o lead ainda
 * carrega a campanha que o trouxe. Nenhum dado pessoal aqui.
 */
const CHAVE = 'vert_origem_v1'
const PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

export type Origem = {
  utm: Partial<Record<(typeof PARAMS)[number], string>>
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

export function origemDaVisita(): Origem {
  const salva = ler()
  if (salva) return salva

  const params = new URLSearchParams(window.location.search)
  const utm: Origem['utm'] = {}
  PARAMS.forEach((chave) => {
    const valor = params.get(chave)
    if (valor) utm[chave] = valor.slice(0, 100)
  })
  const origemInstagram = params.get('origem')
  if (origemInstagram && !utm.utm_source) utm.utm_source = `instagram:${origemInstagram}`.slice(0, 100)

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
