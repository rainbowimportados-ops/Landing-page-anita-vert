// Gera a arte da placa de mesa com NFC (A5, PDF + PNG) de cada unidade em
// docs/arte-qr/, e o guia de gravação do chip em docs/arte-qr/placa-nfc-guia.md.
// O chip NFC (adesivo) fica atrás do ícone de aproximação; o QR code é o reserva.
// Rode antes `node scripts/gerar-qr.mjs` se o endereço do QR mudar.
// Uso: node scripts/gerar-placa-nfc.mjs
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

const site = 'https://institutovert.app'
const unidades = [
  { slug: 'franca', nome: 'Vert Franca', cidade: 'Franca / SP' },
  { slug: 'ribeirao-preto', nome: 'Vert Ribeirão Preto', cidade: 'Ribeirão Preto / SP' },
]
const logo = pathToFileURL(resolve('public/assets/marca/logo-circular-principal.png')).href
const MM = 25.4 / 96

const html = (unidade, qrSvg) => `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,400&family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  @page { size: 148mm 210mm; margin: 0 }
  * { box-sizing: border-box; margin: 0; padding: 0 }
  html, body { width: 148mm; height: 210mm; -webkit-print-color-adjust: exact; print-color-adjust: exact }
  body { background: #f7f3ec; color: #2b1b14; font-family: 'Montserrat', sans-serif; padding: 10mm; display: flex; flex-direction: column }
  .topo { height: 30mm; border-radius: 6mm; background: #2f2119 url(${logo}) center / auto 175% no-repeat; flex: none }
  .miolo { flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center; padding-top: 7mm }
  .olho { font-size: 7.5pt; font-weight: 600; letter-spacing: .32em; text-transform: uppercase; color: #7a5f4f }
  h1 { font-family: 'Cormorant Garamond', serif; font-weight: 500; font-size: 30pt; line-height: 1.05; margin-top: 2.5mm }
  .nfc { margin-top: 7mm; width: 54mm; height: 54mm; border-radius: 50%; background: #2f2119; display: grid; place-items: center; flex: none }
  .nfc svg { width: 32mm; height: 32mm }
  .sub { margin-top: 7mm; font-size: 10pt; line-height: 1.45; color: #5f4638; max-width: 105mm }
  .estrelas { margin-top: 4mm; font-size: 14pt; letter-spacing: .25em; color: #b88a52; padding-left: .25em }
  .ou { margin-top: auto; width: 100%; border-top: .3mm solid #dccdb9; padding-top: 4mm; display: flex; align-items: center; justify-content: center; gap: 6mm; text-align: left }
  .qr { width: 34mm; height: 34mm; background: #fff; border: .3mm solid #e4d6c4; border-radius: 3mm; padding: 2mm; flex: none }
  .qr svg { width: 100%; height: 100%; display: block }
  .ou b { display: block; font-family: 'Cormorant Garamond', serif; font-size: 15pt; font-weight: 500 }
  .ou span { display: block; margin-top: 1mm; font-size: 8pt; line-height: 1.4; color: #5f4638 }
  .unidade { margin-top: 1.5mm; font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 11pt; color: #7a5f4f }
</style></head>
<body>
  <div class="topo" role="img" aria-label="Instituto Vert"></div>
  <div class="miolo">
    <p class="olho">Sua opinião importa</p>
    <h1>Aproxime o celular</h1>
    <div class="nfc" aria-label="Aproxime o celular aqui">
      <svg viewBox="2.5 0 48 48" fill="none" stroke="#f7f3ec" stroke-width="2.6" stroke-linecap="round">
        <path d="M14 14a14 14 0 0 1 0 20"/><path d="M20 10a20 20 0 0 1 0 28"/><path d="M26 6a26 26 0 0 1 0 36"/><path d="M32 2a32 32 0 0 1 0 44" opacity=".55"/>
        <circle cx="8" cy="24" r="2.4" fill="#f7f3ec" stroke="none"/>
      </svg>
    </div>
    <p class="sub">e deixe sua avaliação no Google. Leva menos de 1 minuto.</p>
    <p class="estrelas">★★★★★</p>
    <div class="ou">
      <div class="qr">${qrSvg}</div>
      <div><b>Sem NFC no celular?</b><span>Escaneie o QR code com a câmera.</span><p class="unidade">${unidade.nome} · ${unidade.cidade}</p></div>
    </div>
  </div>
</body></html>`

await mkdir('docs/arte-qr', { recursive: true })
const dir = join(tmpdir(), 'placa-nfc')
await mkdir(dir, { recursive: true })
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
let centro = null
for (const unidade of unidades) {
  const qr = (await readFile(`public/assets/qr/avaliar-${unidade.slug}.svg`, 'utf8')).replace(/<\?xml[^>]*>\s*/, '')
  const arquivo = join(dir, `${unidade.slug}.html`)
  await writeFile(arquivo, html(unidade, qr))
  const page = await browser.newPage({ viewport: { width: 560, height: 794 }, deviceScaleFactor: 4 })
  await page.goto(pathToFileURL(arquivo).href, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  const m = await page.evaluate(() => {
    const r = (s) => document.querySelector(s).getBoundingClientRect()
    return { nfc: r('.nfc'), fim: r('.ou').bottom, base: document.body.getBoundingClientRect().height }
  })
  if (m.fim > m.base - 10 / MM + 1) throw new Error(`Conteúdo não cabe (${unidade.slug}): fim ${m.fim * MM}mm`)
  centro = { x: (m.nfc.left + m.nfc.width / 2) * MM, y: (m.nfc.top + m.nfc.height / 2) * MM, d: m.nfc.width * MM }
  await page.pdf({ path: `docs/arte-qr/placa-nfc-${unidade.slug}-A5.pdf`, width: '148mm', height: '210mm', printBackground: true })
  await page.screenshot({ path: `docs/arte-qr/placa-nfc-${unidade.slug}-A5.png` })
  await page.close()
  console.log('ok', unidade.slug)
}
await browser.close()

const urls = unidades.map((u) => `| ${u.nome} | \`${site}/avaliar?u=${u.slug}&origem=nfc\` |`).join('\n')
await writeFile('docs/arte-qr/placa-nfc-guia.md', `# Placa de mesa NFC — guia de gravação e montagem

## Endereço de cada chip

| Unidade | Gravar no chip (tipo URL) |
| --- | --- |
${urls}

O \`origem=nfc\` faz os cliques aparecerem como "nfc" nos relatórios, separados do QR code (\`origem=qr\`).

## O que comprar

- **Adesivo NFC redondo de 25 a 30 mm, chip NTAG213, NTAG215 ou NTAG216** (qualquer um guarda o endereço acima). Um por placa.
- **Não cole sobre metal** (suporte ou base metálica): o sinal não passa. Se for inevitável, compre o adesivo "anti-metal" (com camada de ferrite).

## Como gravar (celular, ~2 minutos por chip)

1. Instale o app gratuito **NFC Tools** (Android ou iPhone).
2. Abra *Gravar* → *Adicionar um registro* → **URL/URI** → cole o endereço da unidade, com \`https://\` → *OK*.
3. Aproxime o celular do adesivo e toque em *Gravar*. Espere a confirmação.
4. **Teste:** feche o app e aproxime o celular do adesivo. Deve abrir a página "Como foi o seu atendimento?" da unidade certa.
5. Depois de testar, vá em *Outras ações* → **Bloquear tag** (somente leitura), para ninguém sobrescrever. **Isso é irreversível**, então só bloqueie depois de testar.

## Montagem

- Imprima a placa em A5, em papel couchê ou fotográfico, e coloque no suporte de acrílico A5.
- Cole o adesivo NFC **atrás do ícone de ondas**, no verso do papel, **com o centro a ${centro.x.toFixed(1)} mm da borda esquerda e ${centro.y.toFixed(1)} mm do topo** da folha (o círculo escuro tem ${centro.d.toFixed(0)} mm de diâmetro; o adesivo de 25–30 mm cabe inteiro).
- O NFC lê através de papel e acrílico, mas não através de metal. Teste de novo com a placa montada.

## Como o cliente usa

- **Android:** NFC ligado (quase sempre já vem ligado), tela desbloqueada, encostar o celular no ícone.
- **iPhone XS ou mais novo:** lê sozinho com a tela desbloqueada, sem abrir app. iPhones mais antigos (7, 8 e X) não leem sozinhos; para eles, e para celulares sem NFC, o QR code da placa cobre o caso.
`)
console.log('centro do chip (mm):', centro)
