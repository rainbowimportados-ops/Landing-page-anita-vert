// Gera as artes de Instagram do convite de avaliação (feed 1080x1350 e story
// 1080x1920) em docs/arte-qr/. Sem QR code: quem vê o post no celular não
// consegue escanear a própria tela, então a chamada é para o link da bio.
// Uso: node scripts/gerar-arte-instagram.mjs
import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

const logo = pathToFileURL(resolve('public/assets/marca/logo-circular-principal.png')).href

const formatos = [
  { nome: 'feed', largura: 1080, altura: 1350, logo: 360, titulo: 92, topo: 80, base: 80, cta: 'Avalie no Google · link na bio' },
  { nome: 'story', largura: 1080, altura: 1920, logo: 385, titulo: 106, topo: 260, base: 360, cta: 'Toque no link e avalie' },
]

const html = (f) => `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,400&family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0 }
  html, body { width: ${f.largura}px; height: ${f.altura}px; overflow: hidden }
  body { background: #2f2119; color: #f7f3ec; font-family: 'Montserrat', sans-serif; display: flex; flex-direction: column; align-items: center; text-align: center; padding: ${f.topo}px 90px ${f.base}px }
  .logo { width: ${f.logo}px; height: ${f.logo}px; flex: none; background: url(${logo}) center / 165% no-repeat;
    -webkit-mask-image: radial-gradient(circle closest-side, #000 90%, transparent 100%); mask-image: radial-gradient(circle closest-side, #000 90%, transparent 100%); margin-bottom: ${f.nome === 'feed' ? 0 : 20}px }
  .miolo { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center }
  .olho { font-size: 26px; font-weight: 600; letter-spacing: .38em; text-transform: uppercase; color: #cfae86 }
  h1 { font-family: 'Cormorant Garamond', serif; font-weight: 500; font-size: ${f.titulo}px; line-height: 1.02; margin-top: 26px }
  .estrelas { margin-top: ${f.nome === 'feed' ? 38 : 54}px; font-size: ${f.nome === 'feed' ? 70 : 84}px; letter-spacing: .22em; color: #cfae86; padding-left: .22em }
  .sub { margin-top: ${f.nome === 'feed' ? 32 : 46}px; font-size: ${f.nome === 'feed' ? 31 : 34}px; line-height: 1.5; color: #d8c8b6; max-width: 780px }
  .cta { margin-top: ${f.nome === 'feed' ? 44 : 64}px; background: #f7f3ec; color: #2b1b14; font-size: 32px; font-weight: 600; letter-spacing: .04em; padding: 30px 56px; border-radius: 999px }
  .unidades { margin-top: ${f.nome === 'feed' ? 30 : 44}px; font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 38px; color: #cfae86 }
</style></head>
<body>
  <div class="logo" role="img" aria-label="Instituto Vert"></div>
  <div class="miolo">
    <p class="olho">Sua opinião importa</p>
    <h1>Como foi o seu atendimento?</h1>
    <p class="estrelas">★★★★★</p>
    <p class="sub">Sua avaliação no Google leva menos de 1 minuto e ajuda outras pessoas a nos encontrarem.</p>
    <p class="cta">${f.cta}</p>
    <p class="unidades">Franca · Ribeirão Preto</p>
  </div>
</body></html>`

await mkdir('docs/arte-qr', { recursive: true })
const dir = join(tmpdir(), 'arte-instagram')
await mkdir(dir, { recursive: true })
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
for (const f of formatos) {
  const arquivo = join(dir, `${f.nome}.html`)
  await writeFile(arquivo, html(f))
  const page = await browser.newPage({ viewport: { width: f.largura, height: f.altura }, deviceScaleFactor: 1 })
  await page.goto(pathToFileURL(arquivo).href, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  // Confere pela posição real dos blocos, e não pelo scrollHeight (conteúdo centralizado estoura para os dois lados).
  const { topo, fim } = await page.evaluate(() => ({
    topo: document.querySelector('.logo').getBoundingClientRect().top,
    fim: document.querySelector('.unidades').getBoundingClientRect().bottom,
  }))
  if (topo < f.topo - 1 || fim > f.altura - f.base + 1) throw new Error(`Conteúdo não cabe no ${f.nome}: topo ${topo}, fim ${fim}`)
  await page.screenshot({ path: `docs/arte-qr/instagram-${f.nome}-${f.largura}x${f.altura}.png` })
  await page.close()
  console.log('ok', f.nome)
}
await browser.close()
