// Executar com Vite ativo. Respostas simuladas somente aqui; nenhuma conta real é alterada.
// Reutiliza o Playwright externo das suítes de cartão e identidade.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { mkdir } from 'node:fs/promises'
import { metadadosMovimentacao } from '../src/utils/movimentacoes.js'

const requireTools = createRequire(join(process.env.ARKHE_TEST_TOOLS || join(tmpdir(), 'arkhe-migration-checks'), 'package.json'))
const { chromium } = requireTools('playwright')
const browser = await chromium.launch({ channel: process.env.ARKHE_BROWSER || 'msedge', headless: true })
const base = process.env.ARKHE_TEST_URL || 'http://127.0.0.1:5173'
const artifacts = join(tmpdir(), 'arkhe-migration-checks', 'folha')
await mkdir(artifacts, { recursive: true })
const visible = (locator) => locator.waitFor({ state: 'visible', timeout: 8000 })
const historico = (page) => page.getByRole('region', { name: 'Folhas anteriores', exact: true })
const statusPrevia = (page, texto) => page.locator('.folha-conteudo > .folha-topo-painel').getByText(texto, { exact: true })
const usuario = { id_usuario: 57, nome: 'João Teste', cpf: '52998224725' }
const conta = { id_conta: 2, id_titular: 57, tipo_conta: 1, vinculo: 'proprietario', nome_fantasia: 'Empresa Teste', cnpj: '11222333000181' }
const funcionario = { id_funcionario: 1, nome: 'Ana Silva', cpf: '52998224725', salario: 2500, status: 1, possui_conta_arkhe: true }
const pendente = { id_funcionario: 2, nome: 'Bruno Souza', cpf: '11144477735', salario: 1800, status: 1, possui_conta_arkhe: false }
const folhaInicial = {
  id_folha: 15, mes: 9, ano: 2026, status: 1, total: 4300, total_valido: 2500, total_pendente: 1800, total_pago: 0,
  quantidade_funcionarios: 2, quantidade_validos: 1, quantidade_pendentes: 1, quantidade_pagos: 0,
  itens: [
    { ...funcionario, id_item: 1, valor: 2500, status: 1 },
    { ...pendente, id_item: 2, valor: 1800, status: 0, erro: 'Conta PF Arkhé não encontrada' },
  ],
}

async function ambiente(opcoes = {}) {
  const context = await browser.newContext({ viewport: { width: opcoes.width || 1440, height: 1000 } })
  const page = await context.newPage()
  const state = { funcionarios: [], folha: structuredClone(folhaInicial), anteriores: [], conta: { ...conta }, requests: [], erros: [], ...opcoes }
  page.on('pageerror', (e) => state.erros.push(e.message))
  page.on('console', (e) => { if (e.type() === 'error' && !e.text().includes('Failed to load resource')) state.erros.push(e.text()) })
  await page.addInitScript(() => {
    window.__requests = []
    const original = window.fetch
    window.fetch = (url, options = {}) => {
      window.__requests.push({ path: new URL(url, location.href).pathname, credentials: options.credentials })
      return original(url, options)
    }
  })
  await page.route('**/*', async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    if (url.origin === base) return route.continue()
    if (!['fetch', 'xhr'].includes(req.resourceType())) return route.abort()
    const path = url.pathname
    const body = req.postDataJSON() || {}
    state.requests.push({ path, method: req.method(), body })
    const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
    if (path === '/sessao_usuario') return reply({ usuario, conta_selecionada: true })
    if (path === '/sessao') return reply({ usuario, conta: state.conta })
    if (path === '/listar_folhas') {
      assert.equal(req.method(), 'GET')
      const folhas = state.historicoVazio ? [] : [state.folha, ...state.anteriores]
        .sort((a, b) => b.ano - a.ano || b.mes - a.mes)
        .map(({ itens, ...resumo }) => resumo)
      const resultado = JSON.stringify({ folhas, total: folhas.length })
      if (state.atrasoHistorico) await new Promise((resolve) => setTimeout(resolve, state.atrasoHistorico))
      if (state.erroHistorico) return reply({ mensagem: 'Falha ao consultar histórico.' }, 500)
      if (state.historicoInvalido) return reply({})
      return route.fulfill({ status: 200, contentType: 'application/json', body: resultado })
    }
    if (path === '/listar_funcionarios') {
      if (state.sessaoExpirada) return reply({ mensagem: 'Sessão expirada.' }, 401)
      return state.erroEquipe ? reply({ mensagem: 'Não foi possível consultar a equipe.' }, 500) : reply(state.funcionarios)
    }
    if (path === '/adicionar_funcionario') {
      assert.match(body.cpf, /^\d{11}$/)
      assert.equal(typeof body.salario, 'number')
      state.funcionarios.push({ ...funcionario, ...body })
      return reply({ mensagem: 'Funcionário cadastrado.' })
    }
    if (path === '/editar_funcionario') {
      assert.equal(req.method(), 'PUT')
      assert.equal('cpf' in body, false)
      Object.assign(state.funcionarios.find((f) => f.id_funcionario === body.id_funcionario), body)
      return reply({ mensagem: 'Funcionário atualizado.' })
    }
    if (path === '/alterar_status_funcionario') {
      assert.equal(req.method(), 'PUT')
      state.funcionarios.find((f) => f.id_funcionario === body.id_funcionario).status = body.status
      return reply({ mensagem: 'Status atualizado.' })
    }
    if (path === '/criar_folha') {
      if (state.semFuncionarios) return reply({ mensagem: 'Nenhum funcionário ativo encontrado.' }, 400)
      assert.equal(typeof body.mes, 'number'); assert.equal(typeof body.ano, 'number')
      state.historicoVazio = false
      if (state.conflitoSemId) return reply({ mensagem: 'Conflito sem ID.' }, 409)
      return reply({ id_folha: 15, mensagem: 'Folha criada.' }, state.conflito ? 409 : 200)
    }
    if (path.startsWith('/folha/')) {
      const folha = [state.folha, ...state.anteriores].find((item) => String(item.id_folha) === path.split('/').pop())
      assert.ok(folha, 'Apenas IDs retornados pelo backend podem ser consultados')
      return state.erroFolha ? reply({ mensagem: 'Falha ao consultar folha.' }, 500) : reply(folha)
    }
    if (path === '/revalidar_folha') {
      assert.deepEqual(body, { id_folha: 15 })
      if (!state.vincular) return reply({ revalidados: 0, pendentes: 1 })
      Object.assign(state.folha, { quantidade_validos: 1, quantidade_pendentes: 0, total_valido: 1800, total_pendente: 0 })
      Object.assign(state.folha.itens[1], { status: 1, erro: null })
      return reply({ revalidados: 1, pendentes: 0 })
    }
    if (path === '/pagar_folha') {
      assert.deepEqual(body, { id_folha: 15 })
      await new Promise((resolve) => setTimeout(resolve, 350))
      if (state.saldoInsuficiente) return reply({ mensagem: 'Saldo insuficiente.', saldo: 100, total_folha: 2500 }, 400)
      for (const item of state.folha.itens) if (item.status === 1) {
        item.status = 2; item.data_pagamento = '2026-09-28T12:00:00'; state.folha.total_pago += item.valor
        state.folha.quantidade_pagos += 1
      }
      Object.assign(state.folha, { total_valido: 0, quantidade_validos: 0, status: state.folha.quantidade_pendentes > 0 ? 4 : 3 })
      state.folha.data_pagamento = '2026-09-28 09:45:00'
      if (state.falharAtualizacao) state.erroFolha = true
      return reply({ mensagem: 'Folha processada.', status: state.folha.status })
    }
    if (path === '/buscar_movimentacoes') return reply({ movimentacoes: [{ tipo: state.conta.tipo_conta === 1 ? 'saida' : 'entrada', valor: 2500, origem: 'folha_pagamento', id_folha: 15, id_movimentacao: 100, data_movimentacao: '2026-09-28T12:00:00' }], cobrancas: [] })
    if (path === '/cartao') return reply({ mensagem: 'Sem cartão.' }, 404)
    throw new Error(`Endpoint inesperado: ${path}`)
  })
  return { page, state, context }
}

async function encerrar({ page, state, context }) {
  assert.deepEqual(state.erros, [], 'Nenhum erro de console/runtime')
  assert.equal(await page.evaluate(() => window.__requests.every((r) => r.credentials === 'include')), true)
  await context.close()
}

try {
  const a = await ambiente()
  const { page, state } = a
  await page.goto(`${base}/dashboard`)
  await page.getByRole('button', { name: /Folha Funcionários e pagamentos/ }).click()
  await visible(page.getByRole('heading', { name: 'Folha de pagamento', exact: true }))
  await page.getByRole('button', { name: 'Funcionários', exact: true }).click()
  await visible(page.getByText('Nenhum funcionário cadastrado ainda.'))
  await page.getByRole('button', { name: 'Adicionar funcionário', exact: true }).click()
  await page.getByLabel('Nome completo').fill('Ana Silva')
  await page.getByLabel('CPF', { exact: true }).fill('52998224725')
  assert.equal(await page.getByLabel('CPF', { exact: true }).inputValue(), '529.982.247-25')
  await page.getByLabel('Salário mensal (R$)', { exact: true }).fill('2.500,00')
  await page.getByRole('button', { name: 'Salvar funcionário', exact: true }).click()
  await visible(page.getByRole('heading', { name: 'Ana Silva', exact: true }))
  assert.equal(state.funcionarios[0].salario, 2500)
  await page.getByRole('button', { name: 'Editar Ana Silva', exact: true }).click()
  assert.equal(await page.getByRole('dialog').getByLabel('CPF', { exact: true }).count(), 0)
  await page.getByLabel('Salário mensal (R$)', { exact: true }).fill('2.800,50')
  await page.getByRole('button', { name: 'Salvar funcionário', exact: true }).click()
  await visible(page.getByText('R$ 2.800,50', { exact: true }))
  await page.getByRole('button', { name: 'Desativar Ana Silva', exact: true }).click()
  assert.equal(state.funcionarios[0].status, 1)
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click()
  await visible(page.getByText('Inativo', { exact: true }))
  await page.getByRole('button', { name: 'Reativar Ana Silva', exact: true }).click()
  await visible(page.getByText('Ativo', { exact: true }))
  await page.getByRole('button', { name: 'Folha do mês', exact: true }).click()
  await page.getByRole('button', { name: 'Gerar prévia da folha' }).click()
  await page.waitForURL('**/dashboard/folha?folha=15')
  await visible(page.getByRole('heading', { name: 'Folha de setembro de 2026' }))
  await visible(page.getByText('Conta PF Arkhé não encontrada', { exact: true }))
  await page.getByRole('button', { name: 'Verificar novamente' }).click()
  await visible(page.getByText('Os funcionários pendentes ainda não possuem uma conta PF Arkhé.', { exact: true }))
  await page.getByRole('button', { name: /^Pagar R/ }).click()
  const confirm = page.getByRole('button', { name: 'Confirmar pagamento', exact: true })
  await confirm.evaluate((button) => { button.click(); button.click() })
  await visible(page.getByRole('button', { name: 'Processando pagamentos...' }))
  await page.keyboard.press('Escape')
  assert.equal(await page.getByRole('dialog').isVisible(), true)
  await visible(statusPrevia(page, 'Pagamento parcial'))
  assert.equal(state.requests.filter((r) => r.path === '/pagar_folha').length, 1)
  assert.equal(state.folha.total_pago, 2500)
  assert.equal(state.folha.total_pendente, 1800)
  await page.reload()
  await visible(statusPrevia(page, 'Pagamento parcial'))
  state.vincular = true
  await page.getByRole('button', { name: 'Verificar novamente' }).click()
  await visible(page.getByText('1 funcionário foi atualizado.', { exact: true }))
  await page.getByRole('button', { name: /^Pagar R/ }).click()
  await page.getByRole('button', { name: 'Confirmar pagamento', exact: true }).click()
  await visible(statusPrevia(page, 'Paga'))
  assert.equal(await page.getByRole('button', { name: /^Pagar R/ }).count(), 0)
  await page.goto(`${base}/dashboard/extrato`)
  await page.getByRole('button', { name: /Folha de pagamento/ }).click()
  await page.getByRole('button', { name: 'Ver folha', exact: true }).click()
  await page.waitForURL('**/dashboard/folha?folha=15')
  await encerrar(a)
  console.log('PASS A–J: cadastro, edição, status, prévia, pendentes, revalidação, pagamento parcial/final, extrato e recarga.')

  const pf = await ambiente({ conta: { ...conta, tipo_conta: 0 } })
  await pf.page.goto(`${base}/dashboard/folha?folha=15`)
  await pf.page.waitForURL('**/dashboard')
  assert.equal(pf.state.requests.some((r) => r.path.includes('/folha') || ['/listar_funcionarios', '/listar_folhas'].includes(r.path)), false)
  assert.equal(await pf.page.getByRole('button', { name: /Folha Funcionários/ }).count(), 0)
  await pf.page.goto(`${base}/dashboard/extrato`)
  await pf.page.getByRole('button', { name: /Salário recebido/ }).click()
  assert.equal(await pf.page.getByRole('button', { name: 'Ver folha' }).count(), 0)
  await encerrar(pf)
  console.log('PASS PF: redirecionamento, sem atalho/requisições PJ, salário identificado no extrato.')

  for (const width of [320, 390, 768, 1440]) {
    const a = await ambiente({ width, funcionarios: [{ ...funcionario, nome: 'Funcionário com nome muito extenso para testar a disposição na tela', salario: 999999999.99 }, pendente], anteriores: [
      { ...structuredClone(folhaInicial), id_folha: 16, mes: 10, status: 4, total: 999999999.99, total_pago: 888888888.88, total_valido: 111111111.11, total_pendente: 0 },
    ] })
    await a.page.goto(`${base}/dashboard/folha?folha=15`)
    await visible(a.page.getByRole('heading', { name: 'Folha de setembro de 2026' }))
    await visible(historico(a.page).getByRole('heading', { name: 'Setembro de 2026' }))
    const semOverflow = () => a.page.evaluate(() => [...document.querySelectorAll('main, main *')].every((e) => e.getBoundingClientRect().right <= innerWidth + 1))
    assert.equal(await semOverflow(), true, `Prévia sem overflow em ${width}`)
    await a.page.screenshot({ path: join(artifacts, `previa-${width}.png`), fullPage: true })
    await a.page.getByRole('button', { name: 'Funcionários', exact: true }).click()
    assert.equal(await semOverflow(), true, `Equipe sem overflow em ${width}`)
    await a.page.screenshot({ path: join(artifacts, `equipe-${width}.png`), fullPage: true })
    await a.page.getByRole('button', { name: 'Adicionar funcionário', exact: true }).click()
    const box = await a.page.getByRole('dialog').boundingBox()
    assert.ok(box.x >= 0 && box.x + box.width <= width && box.height <= 1000)
    await a.page.keyboard.press('Tab')
    assert.equal(await a.page.evaluate(() => Boolean(document.activeElement.closest('[role="dialog"]'))), true)
    await a.page.keyboard.press('Escape')
    assert.equal(await a.page.getByRole('dialog').count(), 0)
    await encerrar(a)
  }
  console.log('PASS responsividade: 320, 390, 768 e 1440 px; nomes/valores longos; modal, foco e Escape.')

  const erro = await ambiente({ saldoInsuficiente: true })
  await erro.page.goto(`${base}/dashboard/folha?folha=15`)
  await erro.page.getByRole('button', { name: /^Pagar R/ }).click()
  await erro.page.getByRole('button', { name: 'Confirmar pagamento', exact: true }).click()
  await visible(erro.page.getByRole('alert').filter({ hasText: /Saldo insuficiente.*100,00.*2.500,00/ }))
  erro.state.saldoInsuficiente = false
  erro.state.falharAtualizacao = true
  await erro.page.getByRole('button', { name: /^Pagar R/ }).click()
  await erro.page.getByRole('button', { name: 'Confirmar pagamento', exact: true }).click()
  await visible(erro.page.getByRole('alert').filter({ hasText: /Não foi possível atualizar a folha/ }))
  assert.equal(await erro.page.getByRole('button', { name: /^Pagar R/ }).isDisabled(), true)
  erro.state.erroFolha = false
  await erro.page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
  await visible(statusPrevia(erro.page, 'Pagamento parcial'))
  await encerrar(erro)

  for (const status of [2, 3]) {
    const a = await ambiente({ folha: { ...structuredClone(folhaInicial), status } })
    await a.page.goto(`${base}/dashboard/folha?folha=15`)
    await visible(a.page.getByRole('heading', { name: 'Folha de setembro de 2026' }))
    assert.equal(await a.page.getByRole('button', { name: /^Pagar R/ }).count(), 0)
    assert.equal(await a.page.getByRole('button', { name: 'Verificar novamente' }).isDisabled(), true)
    await encerrar(a)
  }
  const invalido = await ambiente()
  await invalido.page.goto(`${base}/dashboard/folha?folha=abc`)
  await visible(invalido.page.getByRole('alert').filter({ hasText: /link da folha é inválido/ }))
  assert.equal(invalido.state.requests.some((r) => r.path.startsWith('/folha/')), false)
  await encerrar(invalido)
  console.log('PASS erros: saldo insuficiente com valores, falha no GET após débito, bloqueios paga/processando e URL inválida.')

  const equipe = await ambiente({ erroEquipe: true, funcionarios: [funcionario] })
  await equipe.page.goto(`${base}/dashboard/folha`)
  await equipe.page.getByRole('button', { name: 'Funcionários', exact: true }).click()
  await visible(equipe.page.getByRole('alert').filter({ hasText: 'Não foi possível consultar a equipe.' }))
  equipe.state.erroEquipe = false
  await equipe.page.getByRole('button', { name: 'Tentar novamente' }).click()
  await visible(equipe.page.getByRole('heading', { name: 'Ana Silva', exact: true }))
  await encerrar(equipe)

  const vazia = await ambiente({ semFuncionarios: true })
  await vazia.page.goto(`${base}/dashboard/folha`)
  await vazia.page.getByRole('button', { name: 'Gerar prévia da folha' }).click()
  await visible(vazia.page.getByRole('alert').filter({ hasText: /Nenhum funcionário ativo encontrado/ }))
  assert.equal(new URL(vazia.page.url()).search, '')
  vazia.state.semFuncionarios = false
  vazia.state.conflito = true
  await vazia.page.getByRole('button', { name: 'Gerar prévia da folha' }).click()
  await vazia.page.waitForURL('**/dashboard/folha?folha=15')
  await visible(vazia.page.getByRole('heading', { name: 'Folha de setembro de 2026' }))
  await encerrar(vazia)

  const expirada = await ambiente({ sessaoExpirada: true })
  await expirada.page.goto(`${base}/dashboard/folha`)
  await expirada.page.waitForURL('**/login')
  await encerrar(expirada)

  const itemErro = await ambiente({ folha: { ...structuredClone(folhaInicial), itens: [{ ...folhaInicial.itens[0], status: 3, erro: 'Não foi possível pagar este funcionário.' }] } })
  await itemErro.page.goto(`${base}/dashboard/folha?folha=15`)
  await visible(itemErro.page.getByText('Erro', { exact: true }))
  await visible(itemErro.page.getByText('Não foi possível pagar este funcionário.', { exact: true }))
  await encerrar(itemErro)
  console.log('PASS recuperação: erro da equipe, folha sem funcionários, competência existente com ID, sessão expirada e item com erro.')

  // K–P: histórico real, navegação, recarga, conflito, atualização e acesso PJ.
  const anteriores = [
    { ...structuredClone(folhaInicial), id_folha: 16, mes: 10, status: 4, total_pago: 2500 },
    { ...structuredClone(folhaInicial), id_folha: 14, mes: 8, status: 3, total_pago: 4300, total_valido: 0, total_pendente: 0, data_pagamento: '2026-08-28 09:45:00' },
    { ...structuredClone(folhaInicial), id_folha: 13, mes: 7, status: 2 },
    { ...structuredClone(folhaInicial), id_folha: 12, mes: 6, status: 0 },
  ]
  const h = await ambiente({ anteriores })
  await h.page.goto(`${base}/dashboard/folha`)
  await visible(historico(h.page).getByText('Folhas criadas:'))
  assert.deepEqual(await historico(h.page).locator('h3').allTextContents(), ['Outubro de 2026', 'Setembro de 2026', 'Agosto de 2026', 'Julho de 2026', 'Junho de 2026'])
  assert.match(await historico(h.page).innerText(), /Folhas criadas: 5/)
  await visible(historico(h.page).getByText('Pago em 28/08/2026'))
  for (const nome of ['Continuar de outubro de 2026', 'Abrir folha de setembro de 2026', 'Ver folha de agosto de 2026', 'Ver processamento de julho de 2026', 'Abrir folha de junho de 2026']) {
    assert.equal(await historico(h.page).getByRole('button', { name: nome, exact: true }).isVisible(), true)
  }
  // O item não navega por inteiro: somente a ação explícita.
  await historico(h.page).getByRole('heading', { name: 'Agosto de 2026' }).click()
  assert.equal(new URL(h.page.url()).search, '')
  await historico(h.page).getByRole('button', { name: 'Ver folha de agosto de 2026', exact: true }).click()
  await h.page.waitForURL('**/dashboard/folha?folha=14')
  await visible(h.page.getByRole('heading', { name: 'Folha de agosto de 2026' }))
  assert.ok(h.state.requests.some((r) => r.path === '/folha/14'))
  await h.page.reload()
  await visible(h.page.getByRole('heading', { name: 'Folha de agosto de 2026' }))
  await visible(historico(h.page).getByRole('heading', { name: 'Agosto de 2026' }))
  await h.page.screenshot({ path: join(artifacts, 'historico-desktop.png'), fullPage: true })
  await h.page.getByRole('button', { name: 'Outra competência', exact: true }).click()
  h.state.conflito = true
  const consultasAntesConflito = h.state.requests.filter((r) => r.path === '/listar_folhas').length
  await h.page.getByRole('button', { name: 'Gerar prévia da folha' }).click()
  await h.page.waitForURL('**/dashboard/folha?folha=15')
  await visible(h.page.getByRole('status').filter({ hasText: 'Essa competência já possui uma folha. Abrimos a folha existente.' }))
  await visible(h.page.getByRole('heading', { name: 'Folha de setembro de 2026' }))
  await visible(historico(h.page).getByRole('heading', { name: 'Setembro de 2026' }))
  assert.equal(await h.page.getByRole('alert').count(), 0)
  assert.ok(h.state.requests.filter((r) => r.path === '/listar_folhas').length > consultasAntesConflito)
  const consultasAntesPagamento = h.state.requests.filter((r) => r.path === '/listar_folhas').length
  await h.page.getByRole('button', { name: /^Pagar R/ }).click()
  await h.page.getByRole('button', { name: 'Confirmar pagamento', exact: true }).click()
  const setembro = historico(h.page).getByRole('listitem').filter({ has: h.page.getByRole('heading', { name: 'Setembro de 2026' }) })
  await visible(setembro.getByRole('button', { name: 'Continuar de setembro de 2026', exact: true }))
  await visible(setembro.getByText('Pagamento parcial', { exact: true }))
  await visible(setembro.getByText('Pago em 28/09/2026'))
  assert.match(await setembro.locator('dd').nth(1).innerText(), /^R\$\s2\.500,00$/)
  assert.ok(h.state.requests.filter((r) => r.path === '/listar_folhas').length > consultasAntesPagamento)
  h.state.vincular = true
  const consultasAntesRevalidacao = h.state.requests.filter((r) => r.path === '/listar_folhas').length
  await h.page.getByRole('button', { name: 'Verificar novamente' }).click()
  await visible(setembro.getByText('Pronto para pagar', { exact: true }))
  assert.equal(await setembro.getByText('Pendente', { exact: true }).count(), 0)
  assert.ok(h.state.requests.filter((r) => r.path === '/listar_folhas').length > consultasAntesRevalidacao)
  await h.page.getByRole('button', { name: /^Pagar R/ }).click()
  await h.page.getByRole('button', { name: 'Confirmar pagamento', exact: true }).click()
  await visible(setembro.getByRole('button', { name: 'Ver folha de setembro de 2026', exact: true }))
  assert.match(await setembro.locator('dd').nth(1).innerText(), /^R\$\s4\.300,00$/)
  await encerrar(h)
  console.log('PASS K–P: histórico ordenado, cinco status/ações, GET pela URL, F5, aviso de 409, atualização após pagamento/revalidação e bloqueio PF.')

  const vazioHistorico = await ambiente({ historicoVazio: true, atrasoHistorico: 500 })
  await vazioHistorico.page.goto(`${base}/dashboard/folha`)
  await visible(historico(vazioHistorico.page).getByRole('status').filter({ hasText: 'Carregando folhas anteriores...' }))
  await visible(historico(vazioHistorico.page).getByText('Nenhuma folha criada ainda.'))
  await visible(historico(vazioHistorico.page).getByText('Quando você gerar a primeira folha de pagamento, ela aparecerá aqui.'))
  await vazioHistorico.page.getByRole('button', { name: 'Gerar prévia da folha' }).click()
  await visible(historico(vazioHistorico.page).getByRole('heading', { name: 'Setembro de 2026' }))
  await encerrar(vazioHistorico)

  const falhaHistorico = await ambiente({ erroHistorico: true, funcionarios: [funcionario] })
  await falhaHistorico.page.goto(`${base}/dashboard/folha?folha=15`)
  await visible(historico(falhaHistorico.page).getByRole('alert'))
  assert.equal(await falhaHistorico.page.getByRole('button', { name: /^Pagar R/ }).isEnabled(), true)
  await falhaHistorico.page.getByRole('button', { name: 'Funcionários', exact: true }).click()
  await visible(falhaHistorico.page.getByRole('heading', { name: 'Ana Silva', exact: true }))
  await falhaHistorico.page.getByRole('button', { name: 'Adicionar funcionário', exact: true }).click()
  await visible(falhaHistorico.page.getByRole('dialog'))
  await falhaHistorico.page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await falhaHistorico.page.getByRole('button', { name: 'Folha do mês', exact: true }).click()
  falhaHistorico.state.erroHistorico = false
  falhaHistorico.state.historicoInvalido = true
  await historico(falhaHistorico.page).getByRole('button', { name: 'Tentar novamente', exact: true }).click()
  await visible(historico(falhaHistorico.page).getByRole('alert'))
  assert.equal(await falhaHistorico.page.getByRole('button', { name: /^Pagar R/ }).isEnabled(), true)
  falhaHistorico.state.historicoInvalido = false
  await historico(falhaHistorico.page).getByRole('button', { name: 'Tentar novamente', exact: true }).click()
  await visible(historico(falhaHistorico.page).getByRole('heading', { name: 'Setembro de 2026' }))
  await encerrar(falhaHistorico)

  const semId = await ambiente({ conflitoSemId: true })
  await semId.page.goto(`${base}/dashboard/folha`)
  await semId.page.getByRole('button', { name: 'Gerar prévia da folha' }).click()
  await visible(semId.page.getByRole('alert').filter({ hasText: 'Conflito sem ID.' }))
  assert.equal(new URL(semId.page.url()).search, '')
  await encerrar(semId)
  console.log('PASS estados independentes do histórico: loading, vazio, criação, erro/retry sem bloquear equipe ou pagamento e 409 sem ID.')

  assert.equal(metadadosMovimentacao({ origem: 'folha_pagamento', tipo: 'entrada' }).descricao, 'Salário recebido')
  assert.equal(metadadosMovimentacao({ origem: 'folha_pagamento', tipo: 'saida', id_folha: 15 }).detalhe, 'Folha #15')
  assert.equal(metadadosMovimentacao({ origem: 'pix', tipo: 'entrada' }).descricao, 'Pix recebido')
  console.log(`PASS metadados. Capturas: ${artifacts}`)
} finally { await browser.close() }
