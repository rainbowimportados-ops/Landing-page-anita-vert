import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

/**
 * Mantém atualizados os perfis do Instagram exibidos na landing
 * (institutovert.app, seção "No Instagram"). Roda a cada 6 h pelo pg_cron.
 *
 * Para cada perfil lê da Windsor.ai: nome, seguidores, seguindo, posts, bio,
 * site e as 6 publicações mais recentes. As capas são copiadas para o Storage
 * (bucket digital-card-media, pasta instagram/<usuario>/) porque os links do
 * Instagram expiram em poucos dias.
 *
 * Regra: na dúvida, não grava. O site já mostra dados válidos; trocá-los por
 * lixo é pior do que deixá-los envelhecer algumas horas.
 */

const WINDSOR = 'https://connectors.windsor.ai/instagram'
const PERFIS = ['institutovert.br', 'dra.anitaalmeida']
const BUCKET = 'digital-card-media'
const POSTS_POR_PERFIL = 6
const VARIACAO_MAXIMA = 0.35
const HORAS_ENTRE_LEITURAS = 5

type Linha = Record<string, unknown>

function responder(status: number, corpo: Record<string, unknown>) {
  return new Response(JSON.stringify(corpo, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

function inteiro(v: unknown): number | null {
  const n = Number(v)
  return Number.isInteger(n) && n >= 0 ? n : null
}

async function windsor(chave: string, campos: string[], preset: string): Promise<Linha[]> {
  const p = new URLSearchParams({ api_key: chave, date_preset: preset, fields: campos.join(',') })
  const r = await fetch(`${WINDSOR}?${p}`)
  const texto = await r.text()
  if (!r.ok) throw new Error(`Windsor HTTP ${r.status}: ${texto.slice(0, 300)}`)
  const dados = JSON.parse(texto)?.data
  if (!Array.isArray(dados)) throw new Error('Windsor sem campo data')
  return dados as Linha[]
}

Deno.serve(async (req) => {
  const chaveWindsor = Deno.env.get('WINDSOR_API_KEY')
  const url = Deno.env.get('SUPABASE_URL')
  const servico = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!chaveWindsor) return responder(500, { ok: false, etapa: 'configuracao', erro: 'WINDSOR_API_KEY nao esta nos secrets do projeto' })
  if (!url || !servico) return responder(500, { ok: false, etapa: 'configuracao', erro: 'ambiente sem SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY' })

  const db = { apikey: servico, Authorization: `Bearer ${servico}`, 'Content-Type': 'application/json' }
  const forcar = req.headers.get('x-forcar') === servico

  // 1. O que já está gravado (para a trava de tempo e a comparação).
  const atuais = new Map<string, Linha>()
  try {
    const r = await fetch(`${url}/rest/v1/site_instagram?select=*`, { headers: db })
    for (const l of (await r.json()) as Linha[]) atuais.set(String(l.usuario), l)
  } catch { /* segue sem comparação */ }

  if (!forcar && atuais.size === PERFIS.length) {
    const maisAntigo = Math.min(...[...atuais.values()].map((l) => Date.parse(String(l.atualizado_em))))
    const horas = (Date.now() - maisAntigo) / 36e5
    if (horas < HORAS_ENTRE_LEITURAS) {
      return responder(200, { ok: true, etapa: 'ignorado', motivo: `atualizado ha ${horas.toFixed(1)}h` })
    }
  }

  // 2. Ler da Windsor.
  let perfis: Linha[]
  let midias: Linha[]
  try {
    perfis = await windsor(chaveWindsor, ['username', 'name', 'followers_count', 'follows_count', 'media_count', 'biography', 'website'], 'last_1dT')
    midias = await windsor(chaveWindsor, ['username', 'media_id', 'media_type', 'media_product_type', 'timestamp', 'media_permalink', 'media_url', 'media_thumbnail_url'], 'last_90dT')
  } catch (e) {
    return responder(502, { ok: false, etapa: 'windsor', erro: String(e) })
  }

  const relatorio: Record<string, unknown> = {}

  for (const usuario of PERFIS) {
    // A frase de upgrade da Windsor aparece no lugar dos textos quando o plano
    // estoura; exigir o username exato barra esse caso.
    const p = perfis.find((l) => l.username === usuario)
    const seguidores = inteiro(p?.followers_count)
    const seguindo = inteiro(p?.follows_count)
    const publicacoes = inteiro(p?.media_count)
    if (!p || !seguidores || seguindo === null || !publicacoes) {
      relatorio[usuario] = { gravado: false, motivo: 'perfil ausente ou numeros invalidos' }
      continue
    }
    const anterior = inteiro(atuais.get(usuario)?.seguidores)
    if (anterior && Math.abs(seguidores - anterior) / anterior > VARIACAO_MAXIMA) {
      relatorio[usuario] = { gravado: false, motivo: 'variacao implausivel', anterior, recebido: seguidores }
      continue
    }

    // 3. Publicações mais recentes, com a capa copiada para o Storage.
    const recentes = midias
      .filter((m) => m.username === usuario && typeof m.media_permalink === 'string')
      .sort((a, b) => Date.parse(String(b.timestamp)) - Date.parse(String(a.timestamp)))
    const posts: Linha[] = []
    for (const m of recentes) {
      if (posts.length >= POSTS_POR_PERFIL) break
      const origem = String(m.media_thumbnail_url || (m.media_type === 'VIDEO' || m.media_type === 'REELS' ? '' : m.media_url) || '')
      if (!origem.startsWith('https://')) continue
      const caminho = `instagram/${usuario}/${m.media_id}.jpg`
      try {
        const img = await fetch(origem)
        if (!img.ok) continue
        const envio = await fetch(`${url}/storage/v1/object/${BUCKET}/${caminho}`, {
          method: 'POST',
          headers: { apikey: servico, Authorization: `Bearer ${servico}`, 'Content-Type': 'image/jpeg', 'x-upsert': 'true', 'cache-control': '31536000' },
          body: await img.arrayBuffer(),
        })
        if (!envio.ok) continue
      } catch { continue }
      posts.push({
        id: String(m.media_id),
        link: String(m.media_permalink),
        imagem: `${url}/storage/v1/object/public/${BUCKET}/${caminho}`,
        tipo: String(m.media_type || ''),
        data: String(m.timestamp || ''),
      })
    }

    const registro: Linha = {
      usuario,
      nome: typeof p.name === 'string' ? p.name.trim() : null,
      seguidores,
      seguindo,
      publicacoes,
      bio: typeof p.biography === 'string' ? p.biography.trim() : null,
      site: typeof p.website === 'string' ? p.website.trim() : null,
      atualizado_em: new Date().toISOString(),
    }
    // Com menos de 3 capas, mantém a grade anterior em vez de mostrar buracos.
    if (posts.length >= 3) registro.posts = posts

    const g = await fetch(`${url}/rest/v1/site_instagram?on_conflict=usuario`, {
      method: 'POST',
      headers: { ...db, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(registro),
    })
    relatorio[usuario] = g.ok
      ? { gravado: true, seguidores, posts: posts.length }
      : { gravado: false, motivo: `gravacao HTTP ${g.status}`, corpo: (await g.text()).slice(0, 300) }
  }

  return responder(200, { ok: true, etapa: 'concluido', perfis: relatorio })
})
