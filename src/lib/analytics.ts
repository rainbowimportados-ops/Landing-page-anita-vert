/**
 * Registro de cliques nos botões da landing page.
 *
 * Grava uma linha em public.link_clicks via API REST do Supabase, usando a
 * chave pública (anon), que só tem permissão de INSERT nessa tabela.
 * Nenhum dado pessoal é enviado — apenas qual botão, qual unidade, de onde
 * veio o visitante e o tipo de dispositivo.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

type Dispositivo = 'mobile' | 'tablet' | 'desktop'

function detectarDispositivo(): Dispositivo {
  if (typeof window === 'undefined') return 'desktop'
  const largura = window.innerWidth
  if (largura < 640) return 'mobile'
  if (largura < 1024) return 'tablet'
  return 'desktop'
}

/**
 * De onde veio o visitante: `utm_source` na URL, senão o domínio do referrer,
 * senão "direto".
 */
function detectarOrigem(): string {
  if (typeof window === 'undefined') return 'direto'

  const params = new URLSearchParams(window.location.search)
  const utm = params.get('utm_source') ?? params.get('origem')
  if (utm) return utm.slice(0, 60)

  const referrer = document.referrer
  if (!referrer) return 'direto'
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '')
    return host === window.location.hostname ? 'direto' : host.slice(0, 60)
  } catch {
    return 'direto'
  }
}

/**
 * Dispara o registro do clique sem bloquear a navegação.
 * `keepalive` mantém a requisição viva quando a aba navega para o WhatsApp.
 */
export function registrarClique(botao: string, unidade?: string | null): void {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return

  const payload = {
    botao,
    unidade: unidade ?? null,
    origem: detectarOrigem(),
    dispositivo: detectarDispositivo(),
  }

  void fetch(`${SUPABASE_URL}/rest/v1/link_clicks`, {
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
