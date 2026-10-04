import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { encodeBase64 } from 'jsr:@std/encoding/base64'

/**
 * Analisa as fotos de um caso de antes e depois (painel /config, aba Casos).
 *
 * Para cada foto a IA (OpenAI, API Responses) diz se é antes ou depois, o ângulo (frente, perfil,
 * sorriso de perto) e onde estão os dentes; depois forma os pares de mesmo
 * ângulo. O resultado é gravado em site_caso_fotos e o administrador revisa no
 * painel antes de publicar — a IA sugere, quem decide é a pessoa.
 *
 * Só administradores (digital_card_admins) podem chamar. As fotos ficam no
 * bucket privado casos-pacientes e são lidas aqui com a chave de serviço.
 *
 * Secrets: OPENAI_FOTOS_API_KEY (chave só para as fotos); se não existir, usa a
 * OPENAI_API_KEY que o projeto já tem.
 * Opcional: OPENAI_FOTOS_MODEL para trocar o modelo sem mudar o código.
 */

const BUCKET = 'casos-pacientes'
const MAXIMO_FOTOS = 16
const ANGULOS = ['frente', 'perfil_direito', 'perfil_esquerdo', 'sorriso', 'outro'] as const
const MODELO_PADRAO = 'gpt-6-astra'

/** Erro devolvido pela API da OpenAI (status HTTP), para uma mensagem amigável. */
class ErroIA extends Error {
  constructor(public status: number) {
    super(`IA indisponível (${status}).`)
  }
}

type RespostaOpenAI = {
  status?: string
  output?: Array<{ type: string; content?: Array<{ type: string; text?: string; refusal?: string }> }>
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function responder(status: number, corpo: Record<string, unknown>) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
  })
}

type Foto = { id: string; arquivo: string; caminho: string; largura: number; altura: number }

const ESQUEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['fotos', 'pares'],
  properties: {
    fotos: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['indice', 'momento', 'angulo', 'dentes_visiveis', 'dentes_x', 'dentes_y', 'confianca'],
        properties: {
          indice: { type: 'integer', description: 'Número da foto, como rotulado no pedido.' },
          momento: { type: 'string', enum: ['antes', 'depois', 'incerto'] },
          angulo: { type: 'string', enum: [...ANGULOS] },
          dentes_visiveis: { type: 'boolean' },
          dentes_x: { type: 'number', description: 'Fração da largura da foto, de 0 (esquerda) a 1 (direita).' },
          dentes_y: { type: 'number', description: 'Fração da altura da foto, de 0 (topo) a 1 (base).' },
          confianca: { type: 'number', description: 'De 0 a 1: certeza sobre momento, ângulo e ponto.' },
        },
      },
    },
    pares: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['angulo', 'antes', 'depois'],
        properties: {
          angulo: { type: 'string', enum: [...ANGULOS] },
          antes: { type: 'integer', description: 'Índice da foto de antes.' },
          depois: { type: 'integer', description: 'Índice da foto de depois.' },
        },
      },
    },
  },
}

type Analise = {
  fotos: Array<{ indice: number; momento: 'antes' | 'depois' | 'incerto'; angulo: (typeof ANGULOS)[number]; dentes_visiveis: boolean; dentes_x: number; dentes_y: number; confianca: number }>
  pares: Array<{ angulo: (typeof ANGULOS)[number]; antes: number; depois: number }>
}

const INSTRUCOES = `Você organiza fotos clínicas de antes e depois de uma clínica de odontologia estética. Todas as fotos são do mesmo paciente.

Para cada foto, informe:
- momento: "antes" ou "depois" do tratamento. Use o nome do arquivo quando ele indicar ("antes", "depois", "inicial", "final", "pre", "pos"); senão, compare os dentes entre as fotos (o depois costuma ter dentes mais brancos, alinhados e de formato regular, como lentes e facetas). Use "incerto" quando não der para saber.
- angulo: "frente" (rosto inteiro de frente), "perfil_direito" ou "perfil_esquerdo" (rosto virado; lado do paciente), "sorriso" (foto aproximada da boca/sorriso) ou "outro".
- dentes_x e dentes_y: o ponto entre os dois incisivos centrais superiores, na metade da altura desses dentes, como fração da foto inteira (0 a 1; x da esquerda, y do topo). Seja preciso: este ponto é usado para sobrepor antes e depois com os dentes no mesmo lugar. Se os dentes não aparecem, dentes_visiveis = false e use 0.5 nos dois.
- confianca: de 0 a 1.

Depois forme os pares: cada par junta uma foto de antes e uma de depois do MESMO ângulo. Cada foto entra em no máximo um par. Não force pares com ângulos diferentes.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return responder(405, { ok: false, erro: 'Use POST.' })

  const url = Deno.env.get('SUPABASE_URL')
  const servico = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !servico) return responder(500, { ok: false, erro: 'Ambiente sem SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY.' })
  const chave = Deno.env.get('OPENAI_FOTOS_API_KEY') || Deno.env.get('OPENAI_API_KEY')
  if (!chave) {
    return responder(500, { ok: false, erro: 'A chave da IA (OPENAI_FOTOS_API_KEY) ainda não foi cadastrada nos secrets do Supabase.' })
  }
  const db = { apikey: servico, Authorization: `Bearer ${servico}`, 'Content-Type': 'application/json' }

  // 1. Quem chama precisa ser administrador.
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return responder(401, { ok: false, erro: 'Faça login no painel.' })
  const usuario = await fetch(`${url}/auth/v1/user`, { headers: { apikey: servico, Authorization: `Bearer ${token}` } })
  if (!usuario.ok) return responder(401, { ok: false, erro: 'Sessão expirada. Entre de novo no painel.' })
  const { id: userId } = (await usuario.json()) as { id: string }
  const admin = await fetch(`${url}/rest/v1/digital_card_admins?user_id=eq.${userId}&select=user_id`, { headers: db })
  if (!admin.ok || ((await admin.json()) as unknown[]).length === 0) {
    return responder(403, { ok: false, erro: 'Sua conta não é administradora.' })
  }

  // 2. Caso e fotos
  let casoId: string
  try {
    casoId = String(((await req.json()) as { casoId?: string }).casoId ?? '')
  } catch {
    return responder(400, { ok: false, erro: 'Corpo inválido.' })
  }
  if (!/^[0-9a-f-]{36}$/i.test(casoId)) return responder(400, { ok: false, erro: 'casoId inválido.' })

  const marcar = (dados: Record<string, unknown>) =>
    fetch(`${url}/rest/v1/site_casos?id=eq.${casoId}`, { method: 'PATCH', headers: db, body: JSON.stringify(dados) })

  const r = await fetch(`${url}/rest/v1/site_caso_fotos?caso_id=eq.${casoId}&select=id,arquivo,caminho,largura,altura&order=ordem`, { headers: db })
  const fotos = (await r.json()) as Foto[]
  if (!r.ok || fotos.length < 2) return responder(400, { ok: false, erro: 'O caso precisa de pelo menos duas fotos.' })
  if (fotos.length > MAXIMO_FOTOS) return responder(400, { ok: false, erro: `Até ${MAXIMO_FOTOS} fotos por caso. Divida em mais de uma pasta.` })

  await marcar({ status: 'analisando', erro_analise: null })

  // A análise roda em segundo plano: com muitas fotos ela pode passar do tempo
  // limite de uma requisição. O painel acompanha pelo status do caso.
  EdgeRuntime.waitUntil(analisar(fotos, marcar, url, servico, db, chave))
  return responder(202, { ok: true, iniciado: true })
})

async function analisar(
  fotos: Foto[],
  marcar: (dados: Record<string, unknown>) => Promise<Response>,
  url: string,
  servico: string,
  db: Record<string, string>,
  chave: string,
) {
  try {
    // 3. Fotos para a IA, cada uma rotulada com número e nome do arquivo.
    const conteudo: Array<Record<string, string>> = []
    for (const [i, f] of fotos.entries()) {
      const arquivo = await fetch(`${url}/storage/v1/object/${BUCKET}/${f.caminho}`, { headers: { apikey: servico, Authorization: `Bearer ${servico}` } })
      if (!arquivo.ok) throw new Error(`Não foi possível ler a foto ${f.arquivo}.`)
      const tipo = (arquivo.headers.get('content-type') ?? 'image/webp').split(';')[0]
      conteudo.push({ type: 'input_text', text: `Foto ${i + 1} — arquivo "${f.arquivo}" (${f.largura}×${f.altura}px):` })
      conteudo.push({ type: 'input_image', detail: 'high', image_url: `data:${tipo};base64,${encodeBase64(new Uint8Array(await arquivo.arrayBuffer()))}` })
    }
    conteudo.push({ type: 'input_text', text: 'Analise as fotos acima conforme as instruções.' })

    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_FOTOS_MODEL') || MODELO_PADRAO,
        instructions: INSTRUCOES,
        input: [{ role: 'user', content: conteudo }],
        max_output_tokens: 16000,
        text: { format: { type: 'json_schema', name: 'analise_caso', strict: true, schema: ESQUEMA } },
      }),
    })
    if (!r.ok) {
      console.error('OpenAI', r.status, await r.text())
      throw new ErroIA(r.status)
    }
    const resposta = (await r.json()) as RespostaOpenAI
    const partes = (resposta.output ?? []).filter((o) => o.type === 'message').flatMap((o) => o.content ?? [])
    if (partes.some((p) => p.type === 'refusal')) throw new Error('A IA não analisou estas fotos. Marque antes, depois e os dentes manualmente.')
    if (resposta.status === 'incomplete') throw new Error('A análise veio incompleta. Tente de novo ou divida a pasta em menos fotos.')
    const texto = partes.find((p) => p.type === 'output_text')?.text
    if (!texto) throw new Error('A IA não devolveu a análise.')
    const analise = JSON.parse(texto) as Analise

    // 4. Grava foto a foto. Valores fora de 0–1 são presos ao intervalo.
    const entre01 = (v: number) => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0.5))
    const parDe = new Map<number, string>()
    const usadas = new Set<number>()
    analise.pares.forEach((p, n) => {
      if (usadas.has(p.antes) || usadas.has(p.depois) || p.antes === p.depois) return
      usadas.add(p.antes)
      usadas.add(p.depois)
      parDe.set(p.antes, `p${n + 1}`)
      parDe.set(p.depois, `p${n + 1}`)
    })
    for (const item of analise.fotos) {
      const foto = fotos[item.indice - 1]
      if (!foto) continue
      await fetch(`${url}/rest/v1/site_caso_fotos?id=eq.${foto.id}`, {
        method: 'PATCH',
        headers: db,
        body: JSON.stringify({
          momento: item.momento === 'incerto' ? null : item.momento,
          angulo: item.angulo,
          dentes_x: item.dentes_visiveis ? entre01(item.dentes_x) : null,
          dentes_y: item.dentes_visiveis ? entre01(item.dentes_y) : null,
          confianca: entre01(item.confianca),
          par: parDe.get(item.indice) ?? null,
          ajustado_manualmente: false,
        }),
      })
    }
    await marcar({ status: 'analisado', analisado_em: new Date().toISOString() })
  } catch (erro) {
    const mensagem =
      erro instanceof ErroIA
        ? erro.status === 401
          ? 'A chave da OpenAI foi recusada. Confira o secret OPENAI_FOTOS_API_KEY no Supabase.'
          : erro.status === 429
            ? 'Limite ou crédito da OpenAI esgotado. Confira o saldo em platform.openai.com.'
            : `IA indisponível (${erro.status}). Tente de novo em instantes.`
        : (erro as Error).message
    await marcar({ status: 'erro', erro_analise: mensagem })
  }
}
