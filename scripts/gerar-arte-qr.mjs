// Gera a arte impressa (A5, PDF + PNG) do QR code de avaliação de cada unidade
// em docs/arte-qr/. Rode antes `node scripts/gerar-qr.mjs` para atualizar os QR.
// Uso: node scripts/gerar-arte-qr.mjs
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

const unidades = [
  { slug: 'franca', nome: 'Vert Franca', cidade: 'Franca / SP' },
  { slug: 'ribeirao-preto', nome: 'Vert Ribeirão Preto', cidade: 'Ribeirão Preto / SP' },
]
const logo = pathToFileURL(resolve('public/assets/marca/logo-circular-principal.png')).href

const html = (unidade, qrSvg) => `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  @page { size: 148mm 210mm; margin: 0 }
  * { box-sizing: border-box; margin: 0; padding: 0 }
  html, body { width: 148mm; height: 210mm; -webkit-print-color-adjust: exact; print-color-adjust: exact }
  body { background: #f7f3ec; color: #2b1b14; font-family: 'Montserrat', sans-serif; padding: 10mm; display: flex; flex-direction: column }
  .topo { height: 36mm; border-radius: 6mm; background: #2f2119 url(${logo}) center / auto 150% no-repeat; flex: none }
  .miolo { flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center; padding-top: 6mm }
  .olho { font-size: 7.5pt; font-weight: 600; letter-spacing: .32em; text-transform: uppercase; color: #7a5f4f }
  h1 { font-family: 'Cormorant Garamond', serif; font-weight: 500; font-size: 27pt; line-height: 1.05; margin-top: 2.5mm }
  .sub { font-size: 9.5pt; line-height: 1.5; color: #5f4638; margin-top: 3mm; max-width: 100mm }
  .qr { margin-top: 5mm; background: #fff; border: .35mm solid #e4d6c4; border-radius: 5mm; padding: 4mm; width: 62mm; height: 62mm; flex: none }
  .qr svg { width: 100%; height: 100%; display: block }
  .estrelas { margin-top: 4mm; font-size: 15pt; letter-spacing: .25em; color: #b88a52 }
  .unidade { margin-top: 1mm; font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 14pt }
  .passos { margin-top: 5mm; display: flex; gap: 4mm; width: 100%; border-top: .3mm solid #dccdb9; padding-top: 4mm }
  .passo { flex: 1; font-size: 7.8pt; line-height: 1.35; color: #5f4638 }
  .passo b { display: block; font-family: 'Cormorant Garamond', serif; font-size: 17pt; font-weight: 500; font-variant-numeric: lining-nums; color: #2b1b14; line-height: 1; margin-bottom: 1mm }
  .obrigado { margin-top: auto; padding-top: 3mm; font-size: 7.5pt; letter-spacing: .2em; text-transform: uppercase; color: #7a5f4f }
</style></head>
<body>
  <div class="topo" role="img" aria-label="Instituto Vert"></div>
  <div class="miolo">
    <p class="olho">Sua opinião importa</p>
    <h1>Como foi o seu atendimento?</h1>
    <p class="sub">Aponte a câmera do celular para o QR code e deixe sua avaliação no Google. Leva menos de 1 minuto.</p>
    <div class="qr">${qrSvg}</div>
    <p class="estrelas">★★★★★</p>
    <p class="unidade">${unidade.nome} · ${unidade.cidade}</p>
    <div class="passos">
      <div class="passo"><b>1</b>Abra a câmera do celular</div>
      <div class="passo"><b>2</b>Aponte para o QR code e toque no link</div>
      <div class="passo"><b>3</b>Escolha as estrelas e comente, se quiser</div>
    </div>
    <p class="obrigado">Obrigado pela confiança</p>
  </div>
</body></html>`

await mkdir('docs/arte-qr', { recursive: true })
const dir = join(tmpdir(), 'arte-qr')
await mkdir(dir, { recursive: true })
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
for (const unidade of unidades) {
  const qr = (await readFile(`public/assets/qr/avaliar-${unidade.slug}.svg`, 'utf8')).replace(/<\?xml[^>]*>\s*/, '')
  const arquivo = join(dir, `${unidade.slug}.html`)
  await writeFile(arquivo, html(unidade, qr))
  const page = await browser.newPage({ viewport: { width: 560, height: 794 }, deviceScaleFactor: 4 })
  await page.goto(pathToFileURL(arquivo).href, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  const sobra = await page.evaluate(() => document.documentElement.scrollHeight - document.documentElement.clientHeight)
  if (sobra > 0) throw new Error(`Conteúdo passa da página em ${sobra}px (${unidade.slug})`)
  await page.pdf({ path: `docs/arte-qr/avaliar-${unidade.slug}-A5.pdf`, width: '148mm', height: '210mm', printBackground: true })
  await page.screenshot({ path: `docs/arte-qr/avaliar-${unidade.slug}-A5.png` })
  await page.close()
  console.log('ok', unidade.slug)
}
await browser.close()
