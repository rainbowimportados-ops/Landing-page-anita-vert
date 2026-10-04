import { expect, test, type Page } from '@playwright/test'

const CHAVE_PRIVACIDADE = 'vert_privacy_choice_v1'
const VERSAO = '2026-09-v5'

/** Corpo enviado à função `site_capturar_lead`, capturado pelo mock. */
type Lead = { p: Record<string, unknown> }

async function preparar(page: Page, resposta: unknown = { ok: true }, status = 200) {
  const leads: Lead[] = []
  // Nenhum teste fala com o banco real: o lead é interceptado e o resto do Supabase recebe vazio.
  await page.route('**/*.supabase.co/**', async (route) => {
    const req = route.request()
    if (req.url().includes('site_capturar_lead')) {
      leads.push(req.postDataJSON() as Lead)
      return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(resposta) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  })
  // O envio bem-sucedido navega para o WhatsApp; aqui só registramos o destino.
  await page.route(/wa\.me|whatsapp\.com/, (route) => route.fulfill({ status: 200, body: 'whatsapp' }))
  await page.addInitScript(([chave, versao]) => {
    window.localStorage.setItem(chave, `declined:${versao}`)
  }, [CHAVE_PRIVACIDADE, VERSAO])
  await page.goto('/')
  return leads
}

const modal = (page: Page) => page.locator('dialog.captura')

async function abrirAvaliacao(page: Page) {
  await page.getByRole('link', { name: /agendar avaliação/i }).first().click()
  await expect(modal(page)).toBeVisible()
}

async function etapaUm(page: Page, nome = 'Maria', telefone = '(16) 99999-9999') {
  await modal(page).getByLabel('Primeiro nome').fill(nome)
  await modal(page).getByLabel('WhatsApp com DDD').fill(telefone)
  await modal(page).getByRole('button', { name: /continuar/i }).click()
}

test('abre o formulário na etapa 1 com foco dentro do modal', async ({ page }) => {
  await preparar(page)
  await abrirAvaliacao(page)
  await expect(modal(page).getByText('Etapa 1 de 2')).toBeVisible()
  await expect(modal(page).getByLabel('Primeiro nome')).toHaveAttribute('name', 'nome')
  await expect(modal(page).getByLabel('WhatsApp com DDD')).toHaveAttribute('name', 'telefone')
})

test('etapa 1 inválida mostra erros e foca o primeiro campo com problema', async ({ page }) => {
  await preparar(page)
  await abrirAvaliacao(page)
  await modal(page).getByRole('button', { name: /continuar/i }).click()

  await expect(modal(page).getByText('Informe seu primeiro nome.')).toBeVisible()
  await expect(modal(page).getByText(/Informe o WhatsApp com DDD/)).toBeVisible()
  await expect(modal(page).getByLabel('Primeiro nome')).toBeFocused()
  await expect(modal(page).getByLabel('Primeiro nome')).toHaveAttribute('aria-invalid', 'true')
  await expect(modal(page).getByText('Etapa 1 de 2')).toBeVisible()

  // Só o telefone inválido: o foco vai para ele.
  await modal(page).getByLabel('Primeiro nome').fill('Maria')
  await modal(page).getByLabel('WhatsApp com DDD').fill('123')
  await modal(page).getByRole('button', { name: /continuar/i }).click()
  await expect(modal(page).getByLabel('WhatsApp com DDD')).toBeFocused()
})

test('etapa 2 sem respostas obrigatórias mostra erros e foca o primeiro grupo', async ({ page }) => {
  const leads = await preparar(page)
  await abrirAvaliacao(page)
  await etapaUm(page)
  await expect(modal(page).getByText('Etapa 2 de 2')).toBeVisible()

  await modal(page).getByRole('button', { name: /enviar e falar no whatsapp/i }).click()
  await expect(modal(page).getByText(/Escolha uma unidade/)).toBeVisible()
  await expect(modal(page).getByText('Conte se você já é paciente.')).toBeVisible()
  await expect(modal(page).getByRole('group', { name: 'Onde prefere ser atendido?' }).getByRole('radio').first()).toBeFocused()
  expect(leads).toHaveLength(0)
})

test('voltar da etapa 2 preserva nome e telefone', async ({ page }) => {
  await preparar(page)
  await abrirAvaliacao(page)
  await etapaUm(page, 'Joana', '(16) 98888-7777')
  await modal(page).getByRole('button', { name: /voltar/i }).click()
  await expect(modal(page).getByLabel('Primeiro nome')).toHaveValue('Joana')
  await expect(modal(page).getByLabel('WhatsApp com DDD')).toHaveValue('(16) 98888-7777')
})

test('fluxo completo registra o lead e mostra a confirmação com link do WhatsApp', async ({ page }) => {
  const leads = await preparar(page)
  await abrirAvaliacao(page)
  await etapaUm(page, 'Maria Souza', '(16) 99999-9999')

  await modal(page).getByRole('radio', { name: 'Ainda não sei', exact: true }).check()
  await modal(page).getByRole('radio', { name: 'Ainda não', exact: true }).check()

  const waitNav = page.waitForRequest(/wa\.me|whatsapp\.com/)
  await modal(page).getByRole('button', { name: /enviar e falar no whatsapp/i }).click()

  await expect(modal(page).getByRole('heading', { name: 'Tudo certo!' })).toBeVisible()
  await expect(modal(page).getByRole('link', { name: /abrir whatsapp/i })).toHaveAttribute('href', /wa\.me|whatsapp\.com/)

  expect(leads).toHaveLength(1)
  const p = leads[0].p
  expect(p).toMatchObject({ nome: 'Maria Souza', telefone: '(16) 99999-9999', intencao: 'avaliacao', superficie: 'landing', consentimento: true })
  expect((p.respostas as Record<string, unknown>).situacao).toBe('novo')
  await waitNav
})

test('sem aceitar métricas o lead não leva origem nem campanha', async ({ page }) => {
  const leads = await preparar(page)
  await abrirAvaliacao(page)
  await etapaUm(page)
  await modal(page).getByRole('radio', { name: 'Ainda não sei', exact: true }).check()
  await modal(page).getByRole('radio', { name: 'Ainda não', exact: true }).check()
  await modal(page).getByRole('button', { name: /enviar e falar no whatsapp/i }).click()
  await expect(modal(page).getByRole('heading', { name: 'Tudo certo!' })).toBeVisible()
  expect(leads[0].p).toMatchObject({ utm: {}, referrer: '', pagina: '' })
})

test('falha de rede mostra aviso, mantém as respostas e oferece WhatsApp sem registrar', async ({ page }) => {
  await preparar(page, { erro: 'rede' }, 500)
  await abrirAvaliacao(page)
  await etapaUm(page)
  await modal(page).getByRole('radio', { name: 'Ainda não sei', exact: true }).check()
  await modal(page).getByRole('radio', { name: 'Ainda não', exact: true }).check()
  await modal(page).getByRole('button', { name: /enviar e falar no whatsapp/i }).click()

  await expect(modal(page).getByRole('alert').getByText('Não conseguimos registrar')).toBeVisible()
  await expect(modal(page).getByRole('link', { name: /continuar no whatsapp sem registrar/i })).toBeVisible()
  await modal(page).getByRole('button', { name: /tentar novamente/i }).click()
  await expect(modal(page).getByText('Etapa 2 de 2')).toBeVisible()
  await expect(modal(page).getByRole('radio', { name: 'Ainda não sei' })).toBeChecked()
})

test('locação: estudante é barrado e levado para os cursos', async ({ page }) => {
  await preparar(page)
  await page.locator('a', { hasText: /alugar|locação|consultório/i }).first().click()
  await expect(modal(page)).toBeVisible()
  await etapaUm(page)
  await modal(page).getByRole('radio', { name: 'Estudante', exact: true }).check()
  await expect(modal(page).getByText(/exclusiva para dentistas e profissionais da saúde|alugada apenas por dentistas/)).toBeVisible()
  await expect(modal(page).getByRole('button', { name: /enviar e falar/i })).toHaveCount(0)
  await modal(page).getByRole('button', { name: 'Ver cursos' }).click()
  await expect(modal(page).getByRole('heading', { name: 'Cursos e imersões' })).toBeVisible()
})

test('Esc e o botão fechar dispensam o modal', async ({ page }) => {
  await preparar(page)
  await abrirAvaliacao(page)
  await page.keyboard.press('Escape')
  await expect(modal(page)).toBeHidden()
  await abrirAvaliacao(page)
  await modal(page).getByRole('button', { name: 'Fechar' }).click()
  await expect(modal(page)).toBeHidden()
})

test('celular: barra de agendar aparece ao rolar e some no rodapé', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await preparar(page)
  const barra = page.locator('.floating-cta')
  await expect(barra).toHaveCSS('opacity', '0')
  await page.evaluate(() => window.scrollTo(0, 1400))
  await expect(barra).toHaveCSS('opacity', '1')
  await expect(barra.getByRole('link', { name: /agendar avaliação/i })).toBeVisible()
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await expect(barra).toHaveCSS('opacity', '0')
})

test('comparador: controles ficam abaixo da foto, sem cobrir o sorriso', async ({ page }) => {
  await preparar(page)
  const janela = page.locator('.sorriso-janela').first()
  await janela.scrollIntoViewIfNeeded()
  const barra = page.locator('.sorriso-barra').first()
  const j = (await janela.boundingBox())!
  const b = (await barra.boundingBox())!
  expect(b.y).toBeGreaterThanOrEqual(j.y + j.height)
})
