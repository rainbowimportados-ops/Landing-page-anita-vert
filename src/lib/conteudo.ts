/**
 * Conteúdo da landing page: padrões do código + ajustes salvos pela clínica.
 *
 * O que está em src/config/site.ts continua sendo a base. O painel em
 * /config grava apenas as diferenças na tabela public.landing_content, e elas
 * são aplicadas por cima na hora de renderizar. Se o Supabase estiver fora do
 * ar ou a linha não existir, a página abre com os padrões — nunca em branco.
 */
import {
  clinica as clinicaPadrao,
  depoimentos as depoimentosPadrao,
  faq as faqPadrao,
  unidades as unidadesPadrao,
  type Depoimento,
  type Unidade,
} from '../config/site'

const SUPABASE_URL = 'https://xiskevunqbvmoclygppc.supabase.co'
const CHAVE_PUBLICA = 'sb_publishable_aDaa3WVZP7siuPw8IbK_Wg_Y68x-MHH'
export const SLUG = 'instituto-vert'

/** Só os campos que a clínica pode editar pelo painel. */
export type Ajustes = {
  clinica?: Partial<Pick<
    typeof clinicaPadrao,
    'instagram' | 'email' | 'whatsappComercial' | 'whatsappAtendimento'
  >>
  /** Por slug da unidade, para a ordem continuar definida no código. */
  unidades?: Record<string, Partial<Pick<Unidade, 'endereco' | 'horarios' | 'mapsUrl' | 'whatsapp'>>>
  /** Resposta por pergunta — é onde ficam os TODOs de valores e convênios. */
  faq?: Record<string, string>
  depoimentos?: Depoimento[]
  /** Razão social, CNPJ e responsável técnico com CRO, exigidos pelo CFO. */
  rodapeLegal?: string
}

export type Conteudo = {
  clinica: typeof clinicaPadrao
  unidades: Unidade[]
  faq: typeof faqPadrao
  depoimentos: Depoimento[]
  rodapeLegal: string
}

export const conteudoPadrao: Conteudo = {
  clinica: clinicaPadrao,
  unidades: unidadesPadrao,
  faq: faqPadrao,
  depoimentos: depoimentosPadrao,
  rodapeLegal: '',
}

/** Aplica os ajustes sobre os padrões, campo a campo. */
export function aplicar(ajustes: Ajustes | null | undefined): Conteudo {
  if (!ajustes) return conteudoPadrao

  return {
    clinica: { ...clinicaPadrao, ...(ajustes.clinica ?? {}) },

    unidades: unidadesPadrao.map((unidade) => ({
      ...unidade,
      ...(ajustes.unidades?.[unidade.slug] ?? {}),
    })),

    faq: faqPadrao.map((item) => ({
      ...item,
      resposta: ajustes.faq?.[item.pergunta]?.trim() || item.resposta,
    })),

    depoimentos: ajustes.depoimentos ?? depoimentosPadrao,

    rodapeLegal: ajustes.rodapeLegal?.trim() ?? '',
  }
}

/** Lê a linha de ajustes. Devolve null em qualquer falha — a página segue com os padrões. */
export async function carregarAjustes(): Promise<Ajustes | null> {
  try {
    const resposta = await fetch(
      `${SUPABASE_URL}/rest/v1/landing_content?slug=eq.${SLUG}&select=content`,
      { headers: { apikey: CHAVE_PUBLICA, Authorization: `Bearer ${CHAVE_PUBLICA}` } },
    )
    if (!resposta.ok) return null
    const linhas = (await resposta.json()) as Array<{ content: Ajustes }>
    return linhas[0]?.content ?? null
  } catch {
    return null
  }
}
