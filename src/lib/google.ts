import type { Evento } from './analytics'

/**
 * Tag do Google (GA4 + Google Ads / Performance Max).
 *
 * Consent Mode v2 no modo avançado: o padrão "negado" é definido no <head> do
 * index.html, antes de qualquer script. Enquanto o visitante não escolhe, a tag
 * carrega com tudo negado: não grava cookie e só envia sinais anônimos (sem
 * identificador), que o Google usa para estimar conversões. Com o aceite, a
 * análise e a medição de conversão passam a usar cookies; a personalização de
 * anúncios (remarketing) continua negada. Quem recusa no aviso não recebe
 * nenhum script do Google.
 */

const GA4_ID = import.meta.env.VITE_GA4_ID
// ID público da conta de conversão do Google Ads; a variável de ambiente tem prioridade.
const ADS_ID = import.meta.env.VITE_GADS_ID || 'AW-18462515909'
// Rótulo da conversão de lead (o trecho depois da barra em "AW-…/rótulo"). Um valor
// copiado errado, como o próprio ID da conta, geraria um destino inexistente e o
// Google Ads não registraria a conversão; nesse caso o envio fica desligado.
// O rótulo da conversão "Contato" é público (aparece no código da tag) e é o padrão;
// a variável de ambiente, quando bem formada, tem prioridade.
const ROTULO_PADRAO = 'YtuhCNmch5wdEMXFzuNE'
const ROTULO_BRUTO = (import.meta.env.VITE_GADS_LABEL_LEAD || '').trim()
const ROTULO_LEAD =
  /^[A-Za-z0-9_-]{12,}$/.test(ROTULO_BRUTO) && !/^AW-/i.test(ROTULO_BRUTO) ? ROTULO_BRUTO : ROTULO_PADRAO
// Conversão "WhatsApp - clique no site (tag Ads)": conta o clique que abre o WhatsApp.
const ROTULO_WHATSAPP = 'BAuGCMn80L4dEMXFzuNE'

// Mesma chave e formato de ./privacidade (lida direto aqui para evitar import circular).
const CHAVE_ESCOLHA = 'vert_privacy_choice_v1'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

let ativa = false
let carregada = false

/** O `gtag` global é definido no <head> do index.html, junto do consentimento padrão. */
function gtag(...args: unknown[]): void {
  window.gtag?.(...args)
}

// Microsoft Clarity: mapa de calor e gravação de sessão, com mascaramento total
// configurado no projeto (nenhum texto da página nem o que é digitado é enviado).
// Segue a mesma regra do Google: só é carregado depois do aceite no aviso.
const CLARITY_ID = 'zfnvueoa15'

type FilaClarity = ((...args: unknown[]) => void) & { q?: unknown[] }

function carregarClarity(): void {
  if (document.getElementById('clarity-tag')) return
  const w = window as unknown as { clarity?: FilaClarity }
  if (!w.clarity) {
    const fila: FilaClarity = (...args: unknown[]) => {
      ;(fila.q = fila.q || []).push(args)
    }
    w.clarity = fila
  }
  const script = document.createElement('script')
  script.id = 'clarity-tag'
  script.async = true
  script.src = `https://www.clarity.ms/tag/${CLARITY_ID}`
  document.head.appendChild(script)
  w.clarity('consent')
}

export function googleConfigurado(): boolean {
  return Boolean(GA4_ID || ADS_ID)
}

function recusouNoAviso(): boolean {
  try {
    return (window.localStorage.getItem(CHAVE_ESCOLHA) || '').startsWith('declined:')
  } catch {
    return false
  }
}

/** Baixa o gtag.js e configura GA4 e Ads, respeitando o consentimento vigente. Idempotente. */
function carregarTag(): void {
  if (carregada) return
  const principal = GA4_ID || ADS_ID
  if (!principal) return
  carregada = true
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(principal)}`
  document.head.appendChild(script)

  gtag('js', new Date())
  if (GA4_ID) gtag('config', GA4_ID)
  if (ADS_ID) gtag('config', ADS_ID)
}

/**
 * Modo avançado: sem escolha feita, carrega a tag com o consentimento negado
 * (sem cookies). Quem recusou no aviso não carrega nada.
 */
export function iniciarGoogleSemCookies(): void {
  if (typeof window === 'undefined' || !googleConfigurado()) return
  if (recusouNoAviso()) return
  carregarTag()
}

/** Libera a medição com cookies após o aceite. Idempotente. */
export function ativarGoogle(): void {
  if (typeof window === 'undefined' || !googleConfigurado()) return

  gtag('consent', 'update', {
    analytics_storage: 'granted',
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'denied',
  })
  carregarTag()
  if (ativa) return
  ativa = true
  carregarClarity()
}

/**
 * Retirada do consentimento. Com o gtag.js já carregado, negar o consentimento
 * ainda permitiria pings sem cookies; o único jeito de parar de vez é descarregar
 * a tag. Por isso a página recarrega, depois que a escolha "recusada" foi gravada,
 * e sem aceite o gtag.js nem é baixado.
 */
export function revogarGoogle(): void {
  if (typeof window === 'undefined' || (!ativa && !carregada)) return
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
  if (!carregada) return
  const nome = EVENTOS_GA4[evento]
  if (!nome) return

  gtag('event', nome, { botao, unidade: unidade ?? undefined })

  // Conversão de Ads do clique no WhatsApp (conta também sem cookies, de forma anônima).
  if (evento === 'whatsapp_opened' && ADS_ID) {
    gtag('event', 'conversion', { send_to: `${ADS_ID}/${ROTULO_WHATSAPP}` })
  }

  // Conversão de Ads para o lead. O WhatsApp aberto logo após o envio do
  // formulário não conta de novo, para não duplicar.
  if (evento === 'lead_created' && ADS_ID && ROTULO_LEAD) {
    gtag('event', 'conversion', { send_to: `${ADS_ID}/${ROTULO_LEAD}` })
  }
}

// Carrega a tag sem cookies assim que o módulo entra na página.
iniciarGoogleSemCookies()
