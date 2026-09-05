import { supabase } from './supabase'

const BUCKET = 'digital-card-media'

/** Limite do bucket: 20 MB. Barrar aqui dá uma mensagem melhor que o erro do servidor. */
const TAMANHO_MAXIMO = 20 * 1024 * 1024

const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml', 'image/gif']

/**
 * Envia uma imagem e devolve a URL pública.
 *
 * O bucket é público para leitura e só aceita escrita de quem está em
 * digital_card_admins — a mesma regra do painel do cartão.
 */
export async function enviarImagem(arquivo: File, pasta: string): Promise<string> {
  if (!TIPOS.includes(arquivo.type)) {
    throw new Error('Formato não aceito. Use JPG, PNG, WebP, AVIF, GIF ou SVG.')
  }
  if (arquivo.size > TAMANHO_MAXIMO) {
    throw new Error(`Arquivo de ${(arquivo.size / 1024 / 1024).toFixed(1)} MB. O limite é 20 MB.`)
  }

  const extensao = arquivo.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  // Nome único: evita colisão e força o CDN a servir a imagem nova.
  const caminho = `landing/${pasta}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extensao}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(caminho, arquivo, { cacheControl: '31536000', upsert: false })

  if (error) {
    throw new Error(
      error.message.toLowerCase().includes('row-level security')
        ? 'Sua conta não tem permissão para enviar imagens.'
        : error.message,
    )
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(caminho)
  return data.publicUrl
}
