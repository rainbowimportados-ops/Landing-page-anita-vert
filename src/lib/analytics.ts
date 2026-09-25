/**
 * Eventos da landing page.
 *
 * Grava em public.digital_card_clicks, a tabela única de eventos do site,
 * com `superficie = 'landing'`. O cartão digital grava na mesma tabela com
 * `superficie = 'digital_card'`. Nenhum dado pessoal é enviado: só o botão,
 * a unidade, a origem da visita, o tipo de dispositivo e a página.
 * (public.link_clicks guarda o histórico antigo e não recebe mais eventos.)
 */

/**
 * Chaves públicas do projeto. Ficam como padrão para que qualquer build
 * funcione sem configuração extra; as variáveis de ambiente têm prioridade.
 * A chave publishable é embutida no bundle e só permite o que o RLS libera.
 */
const URL_PADRAO = 'https://xiskevunqbvmoclygppc.supabase.co'
const CHAVE_PADRAO = 'sb_publishable_aDaa3WVZP7siuPw8IbK_Wg_Y68x-MHH'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || URL_PADRAO
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || CHAVE_PADRAO

export type Evento = 'page_view' | 'cta_click' | 'form_opened' | 'lead_created' | 'whatsapp_opened'

/** Mesmo vocabulário do cartão, exigido pela tabela. */
function detectarDispositivo(): 'celular' | 'computador' {
  if (typeof window === 'undefined') return 'computador'
  return window.matchMedia('(max-width: 760px)').matches ? 'celular' : 'computador'
}

/**
 * De onde veio o visitante: `utm_source` na URL, senão o domínio do referrer,
 * senão "direto".
 */
function detectarOrigem(): string {
  if (typeof window === 'undefined') return 'direto'

  const params = new URLSearchParams(window.location.search)
  const utm = params.get('utm_source') ?? params.get('origem')
  if (utm) return utm.slice(0, 120)

  const referrer = document.referrer
  if (!referrer) return 'direto'
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '')
    return host === window.location.hostname ? 'direto' : host.slice(0, 120)
  } catch {
    return 'direto'
  }
}

/**
 * Dispara o registro sem bloquear a navegação.
 * `keepalive` mantém a requisição viva quando a aba navega para o WhatsApp.
 */
export function registrarClique(botao: string, unidade?: string | null, evento: Evento = 'cta_click'): void {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return

  const payload = {
    superficie: 'landing',
    evento,
    pagina: window.location.pathname.slice(0, 300),
    botao: botao.slice(0, 40),
    unidade: unidade ?? null,
    origem: detectarOrigem(),
    dispositivo: detectarDispositivo(),
  }

  void fetch(`${SUPABASE_URL}/rest/v1/digital_card_clicks`, {
    method: 'POST',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Falha de rede não pode interromper o clique do visitante.
  })
}

/** Monta o link do WhatsApp com a mensagem já preenchida. */
export function linkWhatsApp(numero: string, mensagem: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
}
