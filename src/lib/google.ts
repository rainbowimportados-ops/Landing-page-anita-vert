import type { Evento } from './analytics'

/**
 * Tag do Google (GA4 + Google Ads / Performance Max).
 *
 * Só é carregada depois que o visitante aceita as métricas no aviso de
 * privacidade, e só se os IDs existirem no ambiente. Sem aceite, nenhum
 * script do Google é baixado e nenhum cookie é gravado.
 *
 * Consent Mode v2: o padrão "negado" é definido no <head> do index.html,
 * antes de qualquer script. Aqui o aceite concede análise e medição de
 * conversão; a personalização de anúncios (remarketing) fica negada, em
 * linha com a política de privacidade.
 */

const GA4_ID = import.meta.env.VITE_GA4_ID
// ID público da conta de conversão do Google Ads; a variável de ambiente tem prioridade.
const ADS_ID = import.meta.env.VITE_GADS_ID || 'AW-18462515909'
const ROTULO_LEAD = import.meta.env.VITE_GADS_LABEL_LEAD

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

let ativa = false

/** O `gtag` global é definido no <head> do index.html, junto do consentimento padrão. */
function gtag(...args: unknown[]): void {
  window.gtag?.(...args)
}

export function googleConfigurado(): boolean {
  return Boolean(GA4_ID || ADS_ID)
}

/** Carrega o gtag.js e libera a medição. Idempotente. */
export function ativarGoogle(): void {
  if (typeof window === 'undefined' || !googleConfigurado()) return

  gtag('consent', 'update', {
    analytics_storage: 'granted',
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'denied',
  })
  if (ativa) return
  ativa = true

  const principal = GA4_ID || ADS_ID
  if (!principal) return
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(principal)}`
  document.head.appendChild(script)

  gtag('js', new Date())
  if (GA4_ID) gtag('config', GA4_ID)
  if (ADS_ID) gtag('config', ADS_ID)
}

/**
 * Retirada do consentimento. Com o gtag.js já carregado, negar o consentimento
 * ainda permitiria pings sem cookies; o único jeito de parar de vez é descarregar
 * a tag. Por isso a página recarrega, depois que a escolha "recusada" foi gravada,
 * e sem aceite o gtag.js nem é baixado.
 */
export function revogarGoogle(): void {
  if (typeof window === 'undefined' || !ativa) return
  gtag('consent', 'update', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })
  ativa = false
  // Adiado para o chamador gravar a escolha antes do recarregamento.
  window.setTimeout(() => window.location.reload(), 0)
}

const EVENTOS_GA4: Partial<Record<Evento, string>> = {
  cta_click: 'cta_click',
  form_opened: 'form_open',
  lead_created: 'generate_lead',
  whatsapp_opened: 'whatsapp_click',
}

/**
 * Envia o evento ao Google. `page_view` fica de fora: o gtag já o envia ao
 * carregar. Nenhum dado pessoal vai junto: só botão e unidade.
 */
export function enviarEventoGoogle(evento: Evento, botao: string, unidade?: string | null): void {
  if (!ativa) return
  const nome = EVENTOS_GA4[evento]
  if (!nome) return

  gtag('event', nome, { botao, unidade: unidade ?? undefined })

  // Conversão de Ads para o lead. O WhatsApp aberto logo após o envio do
  // formulário não conta de novo, para não duplicar.
  if (evento === 'lead_created' && ADS_ID && ROTULO_LEAD) {
    gtag('event', 'conversion', { send_to: `${ADS_ID}/${ROTULO_LEAD}` })
  }
}
