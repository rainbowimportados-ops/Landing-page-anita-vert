// Gera os QR codes de avaliação de cada unidade em public/assets/qr/.
// Uso: node scripts/gerar-qr.mjs
// O QR aponta para /avaliar (e não direto ao Google): se o link de avaliação
// mudar, o QR já impresso continua valendo.
import { mkdir, writeFile } from 'node:fs/promises'
import QRCode from 'qrcode'

const site = 'https://institutovert.app'
const unidades = ['franca', 'ribeirao-preto']

await mkdir('public/assets/qr', { recursive: true })
for (const slug of unidades) {
  const url = `${site}/avaliar?u=${slug}&origem=qr`
  const svg = await QRCode.toString(url, { type: 'svg', margin: 2, errorCorrectionLevel: 'H', width: 1024 })
  await writeFile(`public/assets/qr/avaliar-${slug}.svg`, svg)
  console.log(`avaliar-${slug}.svg → ${url}`)
}
