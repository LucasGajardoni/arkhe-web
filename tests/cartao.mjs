// Executar com Vite ativo. Usa Playwright instalado fora do projeto, como a suíte de identidade.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { mkdir } from 'node:fs/promises'

const requireTools = createRequire(join(process.env.ARKHE_TEST_TOOLS || join(tmpdir(), 'arkhe-migration-checks'), 'package.json'))
const { chromium } = requireTools('playwright')
const browser = await chromium.launch({ channel: process.env.ARKHE_BROWSER || 'msedge', headless: true })
const base = process.env.ARKHE_TEST_URL || 'http://127.0.0.1:5173'
const artifacts = join(tmpdir(), 'arkhe-migration-checks', 'cartao')
await mkdir(artifacts, { recursive: true })
const pessoa = { id_usuario: 57, nome: 'João Teste', cpf: '52998224725' }
const pf = { id_conta: 1, id_usuario: 57, id_titular: 57, tipo_conta: 0, vinculo: 'titular', numero_conta: '000001', agencia: '0001' }
const pj = { ...pf, id_conta: 9, id_titular: 12, tipo_conta: 1, vinculo: 'acesso', cargo: 1, nome_fantasia: 'Empresa XPTO', razao_social: 'Empresa XPTO Ltda', cnpj: '11222333000181' }
const cartao = { id_cartao: 7, id_conta: 1, numero_cartao: '2481234567890123', numero_formatado: '2481 2345 6789 0123', cvv: '082', vencimento: '2031-09-01', limite_total: 5000, limite_utilizado: 1200, limite_disponivel: 3800, dia_vencimento: 13, dia_fechamento: 10 }
const credito = {
  compras: [
    { id_compra: 31, valor_total: 120, valor_parcela: 40, qtd_parcelas: 3, data_compra: '2026-09-29 10:00:00', parcelas: [
      { id_fatura_compra: 81, id_compra: 31, numero: 1, total_parcelas: 3, status: 0, valor: 40, data_parcela: '2026-09-29', id_fatura: null, data_vencimento: null },
      { id_fatura_compra: 82, id_compra: 31, numero: 2, total_parcelas: 3, status: 0, valor: 40, data_parcela: '2026-10-29', id_fatura: null, data_vencimento: null },
      { id_fatura_compra: 83, id_compra: 31, numero: 3, total_parcelas: 3, status: 0, valor: 40, data_parcela: '2026-11-29', id_fatura: null, data_vencimento: null },
    ] },
  ],
  parcelas: [
    { id_fatura_compra: 81, id_compra: 31, numero: 1, total_parcelas: 3, status: 0, valor: 40, data_parcela: '2026-09-29', id_fatura: null, data_vencimento: null },
    { id_fatura_compra: 82, id_compra: 31, numero: 2, total_parcelas: 3, status: 0, valor: 40, data_parcela: '2026-10-29', id_fatura: null, data_vencimento: null },
    { id_fatura_compra: 83, id_compra: 31, numero: 3, total_parcelas: 3, status: 0, valor: 40, data_parcela: '2026-11-29', id_fatura: null, data_vencimento: null },
  ],
  resumo: { compras_credito: 1, parcelas_pendentes: 3, valor_pendente: 120, proxima_parcela: { id_fatura_compra: 81, id_compra: 31, numero: 1, total_parcelas: 3, status: 0, valor: 40, data_parcela: '2026-09-29', id_fatura: null, data_vencimento: null } },
}
const faturas = {
  faturas: [{
    id_fatura: 12, valor_total: 80, status: 0, situacao: 'FECHADA',
    data_fechamento: '2026-09-29', data_vencimento: '2026-10-13',
    itens: [
      { id_fatura_compra: 81, id_compra: 31, numero_parcela: 1, total_parcelas: 3, valor: 40, status: 0, data_parcela: '2026-09-28', data_compra: '2026-09-29 10:00:00', valor_compra: 120 },
      { id_fatura_compra: 84, id_compra: 32, numero_parcela: 1, total_parcelas: 2, valor: 40, status: 0, data_parcela: '2026-09-28', data_compra: '2026-09-29 10:30:00', valor_compra: 80 },
    ],
  }],
  proximas_faturas: [{
    data_fechamento: '2026-10-29', data_vencimento: '2026-11-13', valor_total: 40, situacao: 'PREVISTA',
    itens: [{ id_fatura_compra: 82, id_compra: 31, numero_parcela: 2, total_parcelas: 3, valor: 40, status: 0, data_parcela: '2026-10-29', data_compra: '2026-09-29 10:00:00', valor_compra: 120 }],
  }],
  fatura_atual: {
    id_fatura: 12, valor_total: 80, status: 0, situacao: 'FECHADA',
    data_fechamento: '2026-09-29', data_vencimento: '2026-10-13',
    itens: [
      { id_fatura_compra: 81, id_compra: 31, numero_parcela: 1, total_parcelas: 3, valor: 40, status: 0, data_parcela: '2026-09-28', data_compra: '2026-09-29 10:00:00', valor_compra: 120 },
      { id_fatura_compra: 84, id_compra: 32, numero_parcela: 1, total_parcelas: 2, valor: 40, status: 0, data_parcela: '2026-09-28', data_compra: '2026-09-29 10:30:00', valor_compra: 80 },
    ],
  },
  proxima_fatura: {
    data_fechamento: '2026-10-29', data_vencimento: '2026-11-13', valor_total: 40, situacao: 'PREVISTA',
    itens: [{ id_fatura_compra: 82, id_compra: 31, numero_parcela: 2, total_parcelas: 3, valor: 40, status: 0, data_parcela: '2026-10-29', data_compra: '2026-09-29 10:00:00', valor_compra: 120 }],
  },
}
const visible = (locator) => locator.waitFor({ state: 'visible', timeout: 8000 })

async function ambiente(options = {}) {
  const state = { conta: pf, cartao: null, credito, faturas, movimentacoes: [], statusGet: 200, statusPost: 201, requests: [], erros: [], ...options }
  const context = await browser.newContext({ viewport: { width: options.width || 1440, height: 1000 } })
  const page = await context.newPage()
  page.on('pageerror', (error) => state.erros.push(error.message))
  await page.addInitScript(() => {
    window.__cartaoFetches = []
    const original = window.fetch
    window.fetch = (url, options = {}) => {
      const path = new URL(url, location.href).pathname
      if (path.startsWith('/cartao') || path === '/adicionar_cartao') window.__cartaoFetches.push({ path, credentials: options.credentials })
      return original(url, options)
    }
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (value) => { window.__copia = value } }, configurable: true })
  })
  await page.route('**/*', async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    if (url.origin === base) return route.continue()
    if (!['fetch', 'xhr'].includes(req.resourceType())) return route.abort()
    const path = url.pathname
    let json = {}
    try { json = req.postDataJSON() } catch { /* GET. */ }
    state.requests.push({ path, method: req.method(), json })
    const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
    if (path === '/sessao_usuario') return reply({ usuario: pessoa, conta_selecionada: true })
    if (path === '/sessao') return reply({ usuario: pessoa, conta: state.conta })
    if (path === '/buscar_movimentacoes') return reply({ movimentacoes: state.movimentacoes, cobrancas: [] })
    if (path === '/edicao_usuario') return reply({ mensagem: 'Usuário atualizado com sucesso', usuario: pessoa })
    if (path === '/contas_disponiveis') return reply({ contas: [pf, pj] })
    if (path === '/convites_pendentes') return reply({ convites: [] })
    if (path === '/selecionar_conta') { state.conta = json.id_conta === 9 ? pj : pf; state.cartao = { ...cartao, id_conta: 9, numero_cartao: '2481234567899999', numero_formatado: '2481 2345 6789 9999' }; return reply({ conta: state.conta }) }
    if (path === '/cartao') {
      const payload = { possui_cartao: Boolean(state.cartao), cartao: state.cartao }
      if (state.delayGet) await new Promise((resolve) => setTimeout(resolve, state.delayGet))
      return state.statusGet === 200 ? reply(payload) : reply({ mensagem: 'Consulta de cartão indisponível' }, state.statusGet)
    }
    if (path === '/cartao/compras') return reply(state.credito)
    if (path === '/cartao/faturas') return reply(state.faturas)
    if (path === '/adicionar_cartao') {
      if (state.delayPost) await new Promise((resolve) => setTimeout(resolve, state.delayPost))
      if (state.statusPost === 201 || state.statusPost === 409) {
        state.cartao = { ...cartao, id_conta: state.conta.id_conta, ...json }
        return reply({ possui_cartao: true, cartao: state.cartao, mensagem: state.statusPost === 409 ? 'Esta conta ja possui cartao' : 'Cartao gerado com sucesso' }, state.statusPost)
      }
      return reply({ mensagem: 'Não foi possível gerar seu cartão agora.' }, state.statusPost)
    }
    return reply({ mensagem: 'Rota não simulada' }, 404)
  })
  return { page, context, state }
}

const casos = []
const caso = (nome, options, run) => casos.push({ nome, options, run })
const bloco = (page) => page.getByRole('region', { name: 'Cartão Arkhé', exact: true })
async function abrir(page, existe = false) {
  await page.goto(`${base}/dashboard`)
  await page.getByRole('button', { name: existe ? 'Gerenciar cartão' : 'Gerar meu cartão' }).click()
  return page.getByRole('dialog', { name: 'Seu cartão Arkhé' })
}

caso('geracao-dias-privacidade-copia', { delayPost: 300 }, async ({ page, state }) => {
  const modal = await abrir(page)
  assert.equal(state.requests.filter((r) => r.path === '/adicionar_cartao').length, 0)
  assert.equal(await page.getByLabel('Dia de fechamento da fatura').inputValue(), '10')
  assert((await modal.innerText()).includes('vencerá automaticamente no dia 13'))
  await page.getByLabel('Dia de fechamento da fatura').selectOption('20')
  assert((await modal.innerText()).includes('vencerá automaticamente no dia 23'))
  await page.getByRole('button', { name: 'Gerar cartão', exact: true }).click()
  await visible(page.getByRole('button', { name: 'Gerando cartão...' }))
  await page.keyboard.press('Escape')
  assert(await modal.isVisible())
  await visible(page.getByText('Seu cartão foi criado.', { exact: true }))
  assert.equal(state.requests.filter((r) => r.path === '/adicionar_cartao').length, 1)
  assert.deepEqual(state.requests.find((r) => r.path === '/adicionar_cartao').json, { dia_vencimento: 23, dia_fechamento: 20 })
  assert(!(await modal.innerText()).includes(cartao.numero_formatado))
  assert(!(await modal.innerText()).includes(cartao.cvv))
  await page.getByRole('button', { name: 'Mostrar dados' }).click()
  assert((await modal.innerText()).includes(cartao.numero_formatado))
  assert((await modal.innerText()).includes('082'))
  assert(!(await bloco(page).innerText()).includes(cartao.numero_formatado))
  assert(!(await bloco(page).innerText()).includes(cartao.cvv))
  await page.getByRole('button', { name: 'Copiar número' }).click()
  await visible(page.getByText('Número do cartão copiado.'))
  assert.equal(await page.evaluate(() => window.__copia), cartao.numero_cartao)
  await page.keyboard.press('Escape')
  assert.equal(await page.getByRole('dialog').count(), 0)
  await page.getByRole('button', { name: 'Gerenciar cartão' }).click()
  assert(!(await modal.innerText()).includes(cartao.numero_formatado))
  await page.getByRole('button', { name: 'Fechar cartão' }).click()
  assert.equal(await page.getByRole('dialog').count(), 0)
})
caso('historico-credito-e-parcelas', { cartao }, async ({ page }) => {
  const modal = await abrir(page, true)
  await visible(modal.getByText('Crédito comprometido', { exact: true }))
  assert((await modal.innerText()).includes('R$ 120,00'))
  assert((await modal.innerText()).includes('Parcela 1/3'))

  await modal.getByRole('button', { name: /Compras 1/ }).click()
  await visible(modal.getByRole('heading', { name: 'Compras no crédito', exact: true }))
  await visible(modal.getByText('3x de R$ 40,00', { exact: true }))

  await modal.getByRole('button', { name: /Parcelas 3/ }).click()
  await visible(modal.getByRole('heading', { name: 'Todas as parcelas', exact: true }))
  assert.equal(await modal.locator('.cartao-parcela-item').count(), 3)
  await visible(modal.getByText('Parcela 1/3', { exact: true }))
})
caso('faturas-fechadas-e-previsoes', { cartao }, async ({ page }) => {
  const modal = await abrir(page, true)
  await visible(modal.locator('.cartao-fatura-destaque'))
  assert((await modal.locator('.cartao-fatura-destaque').innerText()).includes('R$ 80,00'))

  await modal.getByRole('button', { name: /Faturas 1/ }).click()
  await visible(modal.getByRole('heading', { name: 'Suas faturas', exact: true }))
  assert.equal(await modal.locator('.cartao-fatura-card').count(), 2)
  assert((await modal.locator('.cartao-fatura-card').first().innerText()).includes('Setembro 2026'))
  assert((await modal.locator('.cartao-fatura-card').first().innerText()).includes('Parcela 1/3'))
  assert((await modal.locator('.cartao-fatura-card').nth(1).innerText()).includes('Outubro 2026'))
  assert((await modal.locator('.cartao-fatura-card').nth(1).innerText()).includes('Prevista'))
})
caso('erro-consulta-retry', { statusGet: 500 }, async ({ page, state }) => {
  await page.goto(`${base}/dashboard`)
  await visible(bloco(page).getByRole('alert'))
  assert.equal(await page.getByRole('button', { name: 'Gerar meu cartão' }).count(), 0)
  state.statusGet = 200
  await bloco(page).getByRole('button', { name: 'Tentar novamente' }).click()
  await visible(page.getByRole('button', { name: 'Gerar meu cartão' }))
})
caso('erro-geracao-sem-sucesso-falso', { statusPost: 500 }, async ({ page }) => {
  const modal = await abrir(page)
  await page.getByRole('button', { name: 'Gerar cartão', exact: true }).click()
  await visible(modal.getByRole('alert'))
  assert.equal(await modal.getByRole('button', { name: 'Mostrar dados' }).count(), 0)
  assert(!(await page.getByRole('button', { name: 'Gerar cartão', exact: true }).isDisabled()))
})
caso('conflito-409-reconcilia', { statusPost: 409 }, async ({ page }) => {
  const modal = await abrir(page)
  await page.getByRole('button', { name: 'Gerar cartão', exact: true }).click()
  await visible(modal.getByText('Esta conta ja possui cartao'))
  await visible(page.getByRole('button', { name: 'Mostrar dados' }))
  assert(!(await modal.innerText()).includes('Seu cartão foi criado.'))
})
caso('troca-pf-pj-delegada', { cartao }, async ({ page, state }) => {
  await abrir(page, true)
  await page.getByRole('button', { name: 'Mostrar dados' }).click()
  await page.getByRole('button', { name: 'Fechar cartão' }).click()
  const antes = state.requests.filter((r) => r.path === '/cartao').length
  await page.getByRole('button', { name: 'Trocar conta', exact: true }).click()
  await page.locator('article').filter({ hasText: 'Empresa XPTO' }).getByRole('button', { name: 'Entrar nesta conta' }).click()
  await visible(page.getByRole('button', { name: 'Gerenciar cartão' }))
  assert((await bloco(page).innerText()).includes('9999'))
  assert(!(await bloco(page).innerText()).includes('0123'))
  assert(state.requests.filter((r) => r.path === '/cartao').length > antes)
  assert.equal(await bloco(page).locator('.cartao-visual-titular strong').innerText(), 'EMPRESA XPTO')
})
caso('resposta-de-conta-errada-rejeitada', { cartao: { ...cartao, id_conta: 999 } }, async ({ page }) => {
  await page.goto(`${base}/dashboard`)
  await visible(bloco(page).getByRole('alert'))
  assert(!(await bloco(page).innerText()).includes('0123'))
})
caso('resposta-atrasada-nao-vaza-na-troca', { cartao, delayGet: 1200 }, async ({ page, state }) => {
  await page.goto(`${base}/dashboard`)
  await visible(bloco(page).getByRole('status'))
  await page.getByRole('button', { name: 'Trocar conta', exact: true }).click()
  state.delayGet = 0
  await page.locator('article').filter({ hasText: 'Empresa XPTO' }).getByRole('button', { name: 'Entrar nesta conta' }).click()
  await visible(page.getByRole('button', { name: 'Gerenciar cartão' }))
  await page.waitForTimeout(1300)
  assert((await bloco(page).innerText()).includes('9999'))
  assert(!(await bloco(page).innerText()).includes('0123'))
})
caso('dashboard-limita-movimentacoes-a-tres', {
  movimentacoes: Array.from({ length: 5 }, (_, indice) => ({ id_movimentacao: indice + 1, tipo: 'entrada', valor: 100 + indice, descricao: `Movimento ${indice + 1}`, data: `2026-09-${20 - indice}` })),
}, async ({ page }) => {
  await page.goto(`${base}/dashboard`)
  await visible(page.getByRole('heading', { name: 'Movimentações recentes' }))
  await visible(page.locator('.lista-dashboard[aria-busy="false"]'))
  assert.equal(await page.locator('.lista-dashboard article').count(), 3)
})
for (const [nome, total, usado, esperado] of [['zero', 0, 10, 0], ['nulos', null, null, 0], ['excedido', 5000, 8000, 100]]) {
  caso(`limite-${nome}`, { cartao: { ...cartao, limite_total: total, limite_utilizado: usado, limite_disponivel: null } }, async ({ page }) => {
    const modal = await abrir(page, true)
    assert.equal(await modal.locator('progress').evaluate((elemento) => elemento.value), esperado)
    assert.equal(await bloco(page).locator('.anel-limite').getAttribute('aria-label'), `${esperado}% do limite utilizado`)
    assert(!(await modal.innerText()).includes('NaN'))
    assert(!(await modal.innerText()).includes('Infinity'))
  })
}
for (const width of [390, 650, 900, 1440]) {
  caso(`responsivo-${width}`, { cartao, width }, async ({ page }) => {
    const modal = await abrir(page, true)
    await page.getByRole('button', { name: 'Mostrar dados' }).click()
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    assert(await modal.evaluate((el) => el.scrollWidth <= el.clientWidth))
    const rect = await modal.boundingBox()
    assert(rect.x >= 0 && rect.x + rect.width <= width)
    assert.equal(await bloco(page).locator('.anel-limite').getAttribute('aria-label'), '24% do limite utilizado')
    assert.equal(await bloco(page).locator('.cartao-resumo-informacoes').count(), 1)
    await page.screenshot({ path: join(artifacts, `modal-${width}.png`) })
    await page.getByRole('button', { name: 'Fechar cartão' }).click()
    await bloco(page).screenshot({ path: join(artifacts, `resumo-${width}.png`) })
  })
}
caso('criacao-responsiva-390', { width: 390 }, async ({ page }) => {
  const modal = await abrir(page)
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  assert(await modal.evaluate((elemento) => elemento.scrollWidth <= elemento.clientWidth))
  await visible(page.getByLabel('Dia de fechamento da fatura'))
  await modal.screenshot({ path: join(artifacts, 'criacao-390.png') })
})
for (const width of [390, 1440]) {
  caso(`perfil-renovado-${width}`, { width }, async ({ page }) => {
    await page.goto(`${base}/dashboard`)
    await page.getByRole('button', { name: 'Abrir perfil de João Teste' }).click()
    const modal = page.getByRole('dialog', { name: 'Seus dados pessoais' })
    await visible(modal)
    assert.equal(await page.getByLabel('CPF', { exact: true }).inputValue(), '529.982.247-25')
    assert(!(await modal.innerText()).includes('***'))
    assert.equal(await modal.locator('footer').getByRole('button', { name: 'Trocar conta' }).count(), 1)
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    assert(await modal.evaluate((elemento) => elemento.scrollWidth <= elemento.clientWidth))
    await page.waitForTimeout(250)
    await modal.screenshot({ path: join(artifacts, `perfil-${width}.png`) })
  })
}

let failures = 0
for (const { nome, options, run } of casos) {
  const env = await ambiente(structuredClone(options))
  try {
    await run(env)
    assert.deepEqual(env.state.erros, [])
    assert(await env.page.evaluate(() => window.__cartaoFetches.every((r) => r.credentials === 'include')))
    assert.equal(await env.page.evaluate(() => localStorage.length + sessionStorage.length), 0)
    assert(!env.page.url().includes(cartao.numero_cartao))
    console.log(`PASS ${nome}`)
  } catch (error) {
    failures += 1
    console.error(`FAIL ${nome}: ${error.message}`)
    await env.page.screenshot({ path: join(artifacts, `${nome}-falha.png`) })
  } finally { await env.context.close() }
}
await browser.close()
console.log(`${casos.length - failures}/${casos.length} cenários aprovados. Capturas: ${artifacts}`)
process.exitCode = failures ? 1 : 0
