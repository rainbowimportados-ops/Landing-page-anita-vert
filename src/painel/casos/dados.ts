import type { Angulo, CampanhaResultados, FotoPublicada, ParPublicado } from '../../lib/casos'
import { SLUG, type Ajustes } from '../../lib/conteudo'
import { supabase } from '../supabase'

/**
 * Dados da aba Casos: importação de pastas, análise pela IA e publicação.
 *
 * As fotos ficam no bucket PRIVADO casos-pacientes até a publicação; só então
 * as escolhidas são copiadas para o bucket público do site.
 */

const PRIVADO = 'casos-pacientes'
const PUBLICO = 'digital-card-media'
const LADO_MAXIMO = 1800
const LADO_MINI = 360
const FORMATOS = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/avif']

export type Caso = {
  id: string
  nome: string
  status: 'importado' | 'analisando' | 'analisado' | 'erro'
  erro_analise: string | null
  autorizacao_paciente: boolean
  analisado_em: string | null
  publicado_em: string | null
  criado_em: string
}

export type FotoCaso = {
  id: string
  caso_id: string
  arquivo: string
  caminho: string
  caminho_mini: string
  largura: number
  altura: number
  momento: 'antes' | 'depois' | null
  angulo: Angulo | null
  dentes_x: number | null
  dentes_y: number | null
  confianca: number | null
  par: string | null
  ajustado_manualmente: boolean
  ordem: number
}

/** Foto com endereços temporários (assinados) para exibir no painel. */
export type FotoVista = FotoCaso & { url: string; urlMini: string }

const erroLegivel = (mensagem: string) =>
  mensagem.toLowerCase().includes('row-level security') ? 'Sua conta não tem permissão para esta ação.' : mensagem

// ---------- importação ----------

/** Agrupa arquivos por pasta de primeiro nível (uma pasta = um paciente). */
export function agruparPorPasta(arquivos: File[]): Map<string, File[]> {
  const grupos = new Map<string, File[]>()
  for (const arquivo of arquivos) {
    if (!FORMATOS.includes(arquivo.type) && !/\.(jpe?g|png|webp|heic|heif|avif)$/i.test(arquivo.name)) continue
    const caminho = (arquivo as File & { webkitRelativePath?: string }).webkitRelativePath || arquivo.name
    const partes = caminho.split('/')
    const pasta = partes.length > 1 ? partes[0] : `Caso de ${new Date().toLocaleDateString('pt-BR')}`
    grupos.set(pasta, [...(grupos.get(pasta) ?? []), arquivo])
  }
  for (const lista of grupos.values()) lista.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { numeric: true }))
  return grupos
}

/** Lê pastas arrastadas para a página (inclusive subpastas). */
export async function arquivosDoArraste(itens: DataTransferItemList): Promise<File[]> {
  type Entrada = FileSystemEntry & { createReader?: () => FileSystemDirectoryReader }
  const lerTudo = (leitor: FileSystemDirectoryReader) =>
    new Promise<FileSystemEntry[]>((resolver) => {
      const todas: FileSystemEntry[] = []
      const proximo = () => leitor.readEntries((lote) => (lote.length ? (todas.push(...lote), proximo()) : resolver(todas)), () => resolver(todas))
      proximo()
    })
  const visitar = async (entrada: Entrada, raiz: string): Promise<File[]> => {
    if (entrada.isFile) {
      const arquivo = await new Promise<File>((ok, falha) => (entrada as FileSystemFileEntry).file(ok, falha))
      // Guarda a pasta de origem no mesmo campo que o seletor de pastas usa.
      Object.defineProperty(arquivo, 'webkitRelativePath', { value: `${raiz}/${arquivo.name}` })
      return [arquivo]
    }
    if (entrada.isDirectory && entrada.createReader) {
      const filhos = await lerTudo(entrada.createReader())
      return (await Promise.all(filhos.map((f) => visitar(f as Entrada, raiz)))).flat()
    }
    return []
  }
  const entradas = [...itens].map((i) => i.webkitGetAsEntry()).filter(Boolean) as Entrada[]
  return (await Promise.all(entradas.map((e) => visitar(e, e.isDirectory ? e.name : `Caso de ${new Date().toLocaleDateString('pt-BR')}`)))).flat()
}

/**
 * Redimensiona no navegador, sem cortar e respeitando a orientação da câmera.
 * Só reduz o tamanho do arquivo: a foto continua sendo a que foi enviada.
 */
async function reduzir(arquivo: File, lado: number, qualidade: number) {
  let imagem: ImageBitmap
  try {
    imagem = await createImageBitmap(arquivo, { imageOrientation: 'from-image' })
  } catch {
    throw new Error(`Não foi possível abrir "${arquivo.name}". Fotos HEIC do iPhone abrem só no Safari; no Chrome, exporte como JPG.`)
  }
  const escala = Math.min(1, lado / Math.max(imagem.width, imagem.height))
  const largura = Math.round(imagem.width * escala)
  const altura = Math.round(imagem.height * escala)
  const tela = document.createElement('canvas')
  tela.width = largura
  tela.height = altura
  tela.getContext('2d')!.drawImage(imagem, 0, 0, largura, altura)
  imagem.close()
  const blob = await new Promise<Blob>((ok, falha) => tela.toBlob((b) => (b ? ok(b) : falha(new Error('Falha ao converter a foto.'))), 'image/webp', qualidade))
  return { blob, largura, altura }
}

/** Cria o caso e envia as fotos para o armazenamento privado. */
export async function importarCaso(nome: string, arquivos: File[], progresso: (feitas: number) => void): Promise<string> {
  const { data: caso, error } = await supabase.from('site_casos').insert({ nome: nome.slice(0, 120) }).select('id').single()
  if (error || !caso) throw new Error(erroLegivel(error?.message ?? 'Não foi possível criar o caso.'))

  for (const [ordem, arquivo] of arquivos.entries()) {
    const foto = await reduzir(arquivo, LADO_MAXIMO, 0.88)
    const mini = await reduzir(arquivo, LADO_MINI, 0.8)
    const base = `${caso.id}/${crypto.randomUUID()}`
    for (const [caminho, blob] of [[`${base}.webp`, foto.blob], [`${base}-mini.webp`, mini.blob]] as const) {
      const envio = await supabase.storage.from(PRIVADO).upload(caminho, blob, { contentType: 'image/webp', upsert: false })
      if (envio.error) throw new Error(erroLegivel(envio.error.message))
    }
    const linha = await supabase.from('site_caso_fotos').insert({
      caso_id: caso.id,
      arquivo: arquivo.name,
      caminho: `${base}.webp`,
      caminho_mini: `${base}-mini.webp`,
      largura: foto.largura,
      altura: foto.altura,
      ordem,
    })
    if (linha.error) throw new Error(erroLegivel(linha.error.message))
    progresso(ordem + 1)
  }
  return caso.id
}

// ---------- leitura e edição ----------

export async function listarCasos(): Promise<Caso[]> {
  const { data, error } = await supabase.from('site_casos').select('*').order('criado_em', { ascending: false })
  if (error) throw new Error(erroLegivel(error.message))
  return data as Caso[]
}

export async function carregarCaso(id: string): Promise<{ caso: Caso; fotos: FotoVista[] }> {
  const [c, f] = await Promise.all([
    supabase.from('site_casos').select('*').eq('id', id).single(),
    supabase.from('site_caso_fotos').select('*').eq('caso_id', id).order('ordem'),
  ])
  if (c.error) throw new Error(erroLegivel(c.error.message))
  if (f.error) throw new Error(erroLegivel(f.error.message))
  const fotos = f.data as FotoCaso[]
  const caminhos = fotos.flatMap((x) => [x.caminho, x.caminho_mini])
  const assinadas = caminhos.length ? await supabase.storage.from(PRIVADO).createSignedUrls(caminhos, 60 * 60 * 3) : { data: [] }
  const url = new Map((assinadas.data ?? []).map((a) => [a.path, a.signedUrl]))
  return {
    caso: c.data as Caso,
    fotos: fotos.map((x) => ({ ...x, url: url.get(x.caminho) ?? '', urlMini: url.get(x.caminho_mini) ?? '' })),
  }
}

export async function atualizarFoto(id: string, campos: Partial<FotoCaso>) {
  const { error } = await supabase.from('site_caso_fotos').update(campos).eq('id', id)
  if (error) throw new Error(erroLegivel(error.message))
}

export async function atualizarCaso(id: string, campos: Partial<Caso> & { autorizado_em?: string | null }) {
  const { error } = await supabase.from('site_casos').update(campos).eq('id', id)
  if (error) throw new Error(erroLegivel(error.message))
}

export async function excluirCaso(id: string) {
  const { data } = await supabase.storage.from(PRIVADO).list(id, { limit: 1000 })
  if (data?.length) await supabase.storage.from(PRIVADO).remove(data.map((o) => `${id}/${o.name}`))
  const { error } = await supabase.from('site_casos').delete().eq('id', id)
  if (error) throw new Error(erroLegivel(error.message))
}

/** Pede à IA a análise do caso (função analisar-caso no Supabase). */
export async function analisarCaso(id: string): Promise<{ fotos: number; pares: number }> {
  // A função responde na hora e analisa em segundo plano (16 fotos podem levar
  // mais que o limite de uma requisição); aqui acompanhamos o status do caso.
  const { error } = await supabase.functions.invoke('analisar-caso', { body: { casoId: id } })
  if (error) {
    const corpo = await (error as { context?: Response }).context?.json?.().catch(() => null)
    throw new Error(corpo?.erro ?? 'A análise não respondeu. Verifique se a função analisar-caso foi publicada no Supabase.')
  }
  const limite = Date.now() + 6 * 60_000
  while (Date.now() < limite) {
    await new Promise((r) => setTimeout(r, 3000))
    const { data, error: erroLeitura } = await supabase.from('site_casos').select('status, erro_analise').eq('id', id).single()
    if (erroLeitura) throw new Error(erroLegivel(erroLeitura.message))
    if (data.status === 'erro') throw new Error(data.erro_analise ?? 'A análise falhou.')
    if (data.status === 'analisado') {
      const { data: fotos } = await supabase.from('site_caso_fotos').select('par').eq('caso_id', id)
      const pares = new Set((fotos ?? []).map((f) => f.par).filter(Boolean)).size
      return { fotos: fotos?.length ?? 0, pares }
    }
  }
  throw new Error('A análise está demorando mais que o normal. Abra o caso de novo em alguns minutos.')
}

// ---------- publicação ----------

/** Lê o conteúdo atual da landing (para mesclar sem apagar o que o editor gravou). */
async function conteudoAtual(): Promise<Ajustes> {
  const { data, error } = await supabase.from('landing_content').select('content').eq('slug', SLUG).maybeSingle()
  if (error) throw new Error(erroLegivel(error.message))
  return (data?.content as Ajustes) ?? {}
}

async function gravarResultados(resultados: CampanhaResultados | null) {
  const content = { ...(await conteudoAtual()), resultados }
  const { error } = await supabase.from('landing_content').upsert({ slug: SLUG, content, updated_at: new Date().toISOString() })
  if (error) throw new Error(erroLegivel(error.message))
}

/** Copia uma foto (e a miniatura) do privado para o público e devolve como o site a usa. */
async function publicarFoto(foto: FotoCaso): Promise<FotoPublicada> {
  const copiar = async (origem: string) => {
    const { data, error } = await supabase.storage.from(PRIVADO).download(origem)
    if (error || !data) throw new Error(`Não foi possível ler ${foto.arquivo}.`)
    const destino = `landing/casos/${origem}`
    // O caminho tem o id único da foto e o conteúdo nunca muda: se já existe
    // (caso publicado antes), basta reaproveitar. Sem upsert porque o bucket
    // público não tem política de leitura para sobrescrever.
    const envio = await supabase.storage.from(PUBLICO).upload(destino, data, { contentType: 'image/webp', cacheControl: '31536000', upsert: false })
    if (envio.error && !/exist|duplicate/i.test(envio.error.message)) throw new Error(erroLegivel(envio.error.message))
    return supabase.storage.from(PUBLICO).getPublicUrl(destino).data.publicUrl
  }
  const [src, mini] = [await copiar(foto.caminho), await copiar(foto.caminho_mini)]
  return { src, mini, largura: foto.largura, altura: foto.altura, dentes: { x: foto.dentes_x ?? 0.5, y: foto.dentes_y ?? 0.5 } }
}

export type ParEscolhido = { angulo: Angulo; antes: FotoCaso; depois: FotoCaso }

/**
 * Publica o caso: copia as fotos dos pares escolhidos para o armazenamento
 * público e troca a seção Resultados do site. Exige a autorização do paciente.
 */
export async function publicarCaso(caso: Caso, pares: ParEscolhido[], destaque: ParEscolhido) {
  if (!caso.autorizacao_paciente) throw new Error('Marque a autorização do paciente antes de publicar.')
  const publicados = new Map<ParEscolhido, ParPublicado>()
  for (const par of new Set([destaque, ...pares])) {
    publicados.set(par, { angulo: par.angulo, antes: await publicarFoto(par.antes), depois: await publicarFoto(par.depois) })
  }
  const lista = pares.map((p) => publicados.get(p)!)
  await gravarResultados({
    casoId: caso.id,
    destaque: publicados.get(destaque)!,
    perto: lista.filter((p) => p.angulo === 'sorriso'),
    rosto: lista.filter((p) => p.angulo !== 'sorriso'),
    publicadoEm: new Date().toISOString(),
  })
  await atualizarCaso(caso.id, { publicado_em: new Date().toISOString() })
}

/** Volta a seção Resultados para as fotos fixas do site. */
export async function despublicar() {
  await gravarResultados(null)
}

/** Qual caso está no site agora (id), ou null. */
export async function casoNoSite(): Promise<string | null> {
  return (await conteudoAtual()).resultados?.casoId ?? null
}
