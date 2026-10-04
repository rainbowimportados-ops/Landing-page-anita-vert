import { SUPABASE_ANON_KEY, SUPABASE_URL } from './analytics'
import { origemDaVisita } from './origem'
import { escolhaPrivacidade } from './privacidade'

export type Intencao =
  | 'avaliacao'
  | 'lentes'
  | 'estetica'
  | 'ortodontia'
  | 'implante'
  | 'curso'
  | 'locacao'
  | 'paciente_atual'

export type DadosLead = {
  nome: string
  telefone: string
  intencao: Intencao
  unidade: string | null
  profissao?: string
  cidade?: string
  /** true = dentista, false = estudante; nulo quando não se aplica. */
  dentista?: boolean | null
  jaFezCurso?: boolean | null
  /** Respostas do formulário, no mesmo formato do cartão. */
  respostas?: Record<string, string | boolean | null>
  rotulo: string
  cta: string
}

export type ResultadoEnvio =
  | { ok: true }
  | { ok: false; erro: 'nome' | 'telefone' | 'limite' | 'rede' | string }

/**
 * Grava o lead pela função pública `site_capturar_lead`, que valida os dados,
 * deduplica a pessoa pelo telefone e registra a oportunidade no CRM.
 * Tempo máximo de 4 s: o visitante nunca fica preso esperando o banco.
 */
export async function enviarLead(dados: DadosLead): Promise<ResultadoEnvio> {
  // Origem, campanha e página só acompanham o contato se a pessoa aceitou as
  // métricas; sem isso o pedido leva apenas o que ela digitou e o botão usado.
  const comMetricas = escolhaPrivacidade() === 'accepted'
  const origem = comMetricas ? origemDaVisita() : { utm: {}, referrer: '', pagina: '' }
  const controle = new AbortController()
  const limite = window.setTimeout(() => controle.abort(), 4000)

  try {
    const resposta = await fetch(`${SUPABASE_URL}/rest/v1/rpc/site_capturar_lead`, {
      method: 'POST',
      signal: controle.signal,
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        p: {
          nome: dados.nome,
          telefone: dados.telefone,
          intencao: dados.intencao,
          unidade: dados.unidade,
          profissao: dados.profissao,
          cidade: dados.cidade,
          dentista: dados.dentista ?? null,
          ja_fez_curso: dados.jaFezCurso ?? null,
          respostas: dados.respostas ?? {},
          rotulo: dados.rotulo,
          cta: dados.cta,
          superficie: 'landing',
          consentimento: true,
          utm: origem.utm,
          referrer: comMetricas ? origem.referrer || 'direto' : '',
          pagina: origem.pagina,
        },
      }),
    })
    if (!resposta.ok) return { ok: false, erro: 'rede' }
    return (await resposta.json()) as ResultadoEnvio
  } catch {
    return { ok: false, erro: 'rede' }
  } finally {
    window.clearTimeout(limite)
  }
}

/** Só dígitos; aceita com ou sem +55. */
export function telefoneValido(valor: string): boolean {
  const digitos = valor.replace(/\D/g, '')
  const local = digitos.length >= 12 && digitos.startsWith('55') ? digitos.slice(2) : digitos
  return /^[1-9]\d{9,10}$/.test(local)
}
