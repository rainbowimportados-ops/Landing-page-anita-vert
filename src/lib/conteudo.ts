/**
 * Conteúdo da landing page, em três camadas (a de cima vence):
 *
 * 1. Cadastro do cartão (`digital_card_content`, editado em /admin):
 *    FONTE ÚNICA de endereço e WhatsApp das unidades, telefone da clínica e
 *    Instagram — o mesmo dado aparece no cartão e na landing.
 * 2. Ajustes da landing (`landing_content`, editado em /config): horários,
 *    FAQ, depoimentos, rodapé legal, Instagram da Dra., galeria, banner.
 * 3. Padrões do código (src/config/site.ts).
 *
 * Se o Supabase estiver fora do ar, a página abre com os padrões — nunca em branco.
 */
import {
  clinica as clinicaPadrao,
  depoimentos as depoimentosPadrao,
  faq as faqPadrao,
  rodapeLegal as rodapeLegalPadrao,
  rotaParaEndereco,
  unidades as unidadesPadrao,
  type Depoimento,
  type Unidade,
} from '../config/site'

const SUPABASE_URL = 'https://xiskevunqbvmoclygppc.supabase.co'
const CHAVE_PUBLICA = 'sb_publishable_aDaa3WVZP7siuPw8IbK_Wg_Y68x-MHH'
export const SLUG = 'instituto-vert'

export type PerfilInstagram = {
  nome?: string
  usuario?: string
  /** URL pública no bucket digital-card-media. */
  foto?: string
  seguidores?: number
  /** ISO, gravado ao salvar. A tela mostra "atualizado em" para o número
   *  nunca se passar por tempo real. */
  seguidoresAtualizadoEm?: string
}

export type Instagram = {
  /** URL do perfil da clínica. */
  clinica?: string
  /** URL do perfil da responsável técnica. */
  anita?: string
  perfil?: PerfilInstagram
  /** URLs de posts exibidos na grade, com link para a publicação original. */
  posts?: string[]
}

export type ImagemCaso = {
  url: string
  legenda?: string
}

export type Marca = {
  /** Substitui o logotipo desenhado em SVG quando enviado. */
  logo?: string
  /** Imagem de fundo do hero. */
  capa?: string
}

export type Banner = {
  imagem?: string
  titulo?: string
  texto?: string
  /** Para onde o banner leva. Vazio deixa o banner sem link. */
  link?: string
}

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
  instagram?: Instagram
  /** Imagens de casos enviadas pelo painel, além dos posts do Instagram. */
  galeria?: ImagemCaso[]
  marca?: Marca
  /** Campanha em destaque. Sem imagem nem título, não aparece. */
  banner?: Banner
}

export type Conteudo = {
  clinica: typeof clinicaPadrao
  unidades: Unidade[]
  faq: typeof faqPadrao
  depoimentos: Depoimento[]
  rodapeLegal: string
  instagram: Instagram
  galeria: ImagemCaso[]
  marca: Marca
  banner: Banner | null
}

/** Parte do cadastro do cartão que a landing usa. */
export type Cartao = {
  company?: { phone?: string; instagram?: string; whatsappMode?: string }
  units?: Array<{ id?: string; active?: boolean; address?: string; phone?: string }>
}

const soDigitos = (valor?: string) => (valor ?? '').replace(/\D/g, '')

export const conteudoPadrao: Conteudo = {
  clinica: clinicaPadrao,
  unidades: unidadesPadrao.map((u) => ({ ...u, mapsUrl: rotaParaEndereco(u.endereco) })),
  faq: faqPadrao.filter((item) => item.resposta.trim() !== ''),
  depoimentos: depoimentosPadrao,
  rodapeLegal: rodapeLegalPadrao,
  instagram: { clinica: clinicaPadrao.instagram },
  galeria: [],
  marca: { logo: '/assets/marca/logo-circular-principal.png' },
  banner: null,
}

/** Aplica cartão e ajustes sobre os padrões, campo a campo. */
export function aplicar(entrada: Ajustes | null | undefined, cartao?: Cartao | null): Conteudo {
  const ajustes: Ajustes = entrada ?? {}
  const telefoneCartao = soDigitos(cartao?.company?.phone)
  const compartilhado = cartao?.company?.whatsappMode !== 'separate'

  const clinica = { ...clinicaPadrao, ...(ajustes.clinica ?? {}) }
  if (telefoneCartao) clinica.whatsappComercial = telefoneCartao
  if (!ajustes.clinica?.whatsappAtendimento && telefoneCartao) clinica.whatsappAtendimento = telefoneCartao
  if (cartao?.company?.instagram?.trim()) clinica.instagram = cartao.company.instagram.trim()

  return {
    clinica,

    unidades: unidadesPadrao.map((unidade) => {
      const doCartao = cartao?.units?.find((u) => u.id === unidade.slug && u.active !== false)
      const ajuste = ajustes.unidades?.[unidade.slug] ?? {}
      const endereco = doCartao?.address?.trim() || ajuste.endereco?.trim() || unidade.endereco
      const whatsapp =
        (compartilhado ? telefoneCartao : soDigitos(doCartao?.phone)) ||
        soDigitos(doCartao?.phone) || soDigitos(ajuste.whatsapp) || unidade.whatsapp
      return {
        ...unidade,
        endereco,
        whatsapp,
        horarios: ajuste.horarios ?? unidade.horarios,
        mapsUrl: rotaParaEndereco(endereco),
      }
    }),

    // Pergunta ainda sem resposta não vai para a página: melhor um FAQ curto
    // e verdadeiro do que um item vazio.
    faq: faqPadrao
      .map((item) => ({
        ...item,
        resposta: ajustes.faq?.[item.pergunta]?.trim() || item.resposta,
      }))
      .filter((item) => item.resposta.trim() !== ''),

    depoimentos: ajustes.depoimentos ?? depoimentosPadrao,

    // String vazia no painel volta ao padrão, em vez de sumir com a
    // identificação que o CFO exige.
    rodapeLegal: ajustes.rodapeLegal?.trim() || rodapeLegalPadrao,

    instagram: {
      clinica: clinica.instagram,
      anita: ajustes.instagram?.anita?.trim() || undefined,
      perfil: ajustes.instagram?.perfil,
      posts: (ajustes.instagram?.posts ?? []).filter((u) => u.trim() !== ''),
    },

    galeria: (ajustes.galeria ?? []).filter((i) => i.url.trim() !== ''),
    marca: { ...conteudoPadrao.marca, ...(ajustes.marca ?? {}) },

    // Banner sem imagem nem título não tem o que mostrar.
    banner:
      ajustes.banner && (ajustes.banner.imagem || ajustes.banner.titulo)
        ? ajustes.banner
        : null,
  }
}

/** Lê o cadastro do cartão (fonte única de unidades e contatos). Null em qualquer falha. */
export async function carregarCartao(): Promise<Cartao | null> {
  try {
    const resposta = await fetch(
      `${SUPABASE_URL}/rest/v1/digital_card_content?slug=eq.${SLUG}&select=content`,
      { headers: { apikey: CHAVE_PUBLICA, Authorization: `Bearer ${CHAVE_PUBLICA}` } },
    )
    if (!resposta.ok) return null
    const linhas = (await resposta.json()) as Array<{ content: Cartao }>
    return linhas[0]?.content ?? null
  } catch {
    return null
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
