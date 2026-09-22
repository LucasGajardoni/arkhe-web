// Browser regression suite. Backend and facial SDK are simulated; no real accounts are changed.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { mkdir } from 'node:fs/promises'

const requireTools = createRequire(join(process.env.ARKHE_TEST_TOOLS || join(tmpdir(), 'arkhe-migration-checks'), 'package.json'))
const { chromium } = requireTools('playwright')
const browser = await chromium.launch({ channel: process.env.ARKHE_BROWSER || 'msedge', headless: true })
const base = process.env.ARKHE_TEST_URL || 'http://127.0.0.1:5173'
const artifacts = join(tmpdir(), 'arkhe-migration-checks', 'artifacts')
await mkdir(artifacts, { recursive: true })
const usuario = { id_usuario: 57, nome: 'João Teste', email: 'joao@example.test', telefone: '11987654321', cpf: '52998224725' }
const pf = { id_conta: 1, id_usuario: 57, id_titular: 57, tipo_conta: 0, vinculo: 'titular', cargo: null, numero_conta: '000001', agencia: '0001', banco: 'Arkhé' }
const pj = { ...pf, id_conta: 2, tipo_conta: 1, vinculo: 'proprietario', numero_conta: '000002', cnpj: '11222333000181', nome_fantasia: 'Empresa Própria', razao_social: 'Empresa Própria Ltda' }
const delegada = { ...pj, id_conta: 9, id_titular: 12, vinculo: 'acesso', cargo: 1, nome_fantasia: 'Empresa XPTO', numero_conta: '000009' }
const convite = { ...delegada, id_acesso: 30, empresa: 'Empresa XPTO', cargo_nome: 'Financeiro', data_convite: '2026-09-20T12:00:00' }
const membro = { id_acesso: 40, ...usuario, nome: 'Maria Teste', cargo: 0, status: 0, data_convite: '2026-09-20T12:00:00' }

async function ambiente(opcoes = {}) {
  const context = await browser.newContext({ viewport: opcoes.mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 } })
  const page = await context.newPage()
  const state = { autenticado: true, selecionada: null, obrigatorio: false, semBiometria: false, contas: [structuredClone(pf)], convites: [], acessos: [], requests: [], erros: [], ...opcoes }
  page.on('pageerror', (error) => state.erros.push(error.message))
  await page.addInitScript(() => {
    window.__fetches = []
    const fetchOriginal = window.fetch
    window.fetch = (url, options = {}) => {
      window.__fetches.push({ path: new URL(url, location.href).pathname, credentials: options.credentials })
      return fetchOriginal(url, options)
    }
    function scanner(modo, options) {
      window.__modoFacial = modo
      const button = document.createElement('button')
      button.textContent = 'Concluir face simulada'
      button.type = 'button'
      button.onclick = () => options.onSuccess({ matched: true, ready: true })
      options.mount.appendChild(button)
      return { ui: { captureButton: { click() {} } }, stop() { button.remove() } }
    }
    window.FaceIdentity = { enroll: (options) => scanner('cadastro', options), verify: (options) => scanner('login', options) }
  })
  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.origin === base && !url.pathname.startsWith('/api/')) return route.continue()
    if (!['fetch', 'xhr'].includes(request.resourceType())) return route.abort()
    const path = url.pathname
    const body = request.postData() || ''
    let json = {}
    try { json = JSON.parse(body) } catch { /* Multipart form. */ }
    state.requests.push({ path, method: request.method(), json, body })
    const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
    if (state.falhaPath === path) return reply({ mensagem: 'Falha simulada do servidor' }, 500)
    if (path === '/sessao_usuario') return state.autenticado ? reply({ usuario, conta_selecionada: Boolean(state.selecionada) }) : reply({ mensagem: 'Sessão expirada' }, 401)
    if (path === '/sessao') return state.contaIndisponivel ? reply({ mensagem: 'Conta indisponível' }, 401) : reply({ usuario, conta: state.selecionada })
    if (path === '/login_usuario') {
      if (state.expirado) return reply({ mensagem: 'PIN temporário expirado', pin_temporario_expirado: true }, 401)
      assert.deepEqual(Object.keys(json).sort(), ['cadastro_facial', 'cpf', 'pin'])
      if (!json.cadastro_facial) return reply({ reconhecimento_facial_pendente: true, troca_pin_obrigatoria: state.obrigatorio })
      state.autenticado = true
      state.selecionada = null
      return reply({ usuario, troca_pin_obrigatoria: state.obrigatorio, selecao_conta_pendente: true })
    }
    if (path === '/v1/verifications') return state.semBiometria ? reply({ detail: 'identity not found' }, 404) : reply({ session_id: 'simulada', session_token: 'fixture' })
    if (path === '/v1/enrollments') return reply({ session_id: 'simulada', session_token: 'fixture' })
    if (path === '/verificar_usuario') return reply({ usuario_existente: !state.novoCadastro, usuario })
    if (path === '/definir_pin_pessoal') { assert.match(json.novo_pin, /^\d{6}$/); state.obrigatorio = false; return reply({ mensagem: 'PIN pessoal definido' }) }
    if (path === '/contas_disponiveis') return state.obrigatorio ? reply({ troca_pin_obrigatoria: true }, 403) : reply({ contas: state.contas })
    if (path === '/convites_pendentes') return reply({ convites: state.convites })
    if (path === '/selecionar_conta') { state.selecionada = state.contas.find((c) => c.id_conta === json.id_conta); return reply({ conta: state.selecionada }) }
    if (/^\/convites\/\d+\/aceitar$/.test(path)) { state.convites = []; state.contas.push(structuredClone(delegada)); return reply({ mensagem: 'Convite aceito' }) }
    if (/^\/convites\/\d+\/recusar$/.test(path)) { state.convites = []; return reply({ mensagem: 'Convite recusado' }) }
    if (path === '/acessos') return reply({ empresa: pj, acessos: state.acessos })
    if (path === '/acessos/verificar_usuario') return reply(state.consulta || { usuario_existente: true, usuario, possui_vinculo: false })
    if (path === '/acessos/convidar') { state.acessos = [{ ...membro, nome: json.nome || usuario.nome, cargo: json.cargo }]; return reply({ mensagem: 'Convite enviado', usuario_novo: !state.consulta?.usuario_existente && Boolean(json.nome) }) }
    if (/^\/acessos\/\d+/.test(path)) {
      if (path.endsWith('/cargo')) state.acessos[0].cargo = json.cargo
      if (path.endsWith('/bloquear')) state.acessos[0].status = 2
      if (path.endsWith('/ativar')) state.acessos[0].status = 1
      if (request.method() === 'DELETE') state.acessos[0].status = 3
      return reply({ mensagem: path.endsWith('/reenviar-convite') ? 'Convite reenviado' : 'Acesso atualizado' })
    }
    if (path === '/buscar_movimentacoes') return reply({ movimentacoes: [{ id_movimentacao: 1, tipo: 'entrada', valor: state.selecionada?.id_conta === 1 ? 123 : 987, descricao: state.selecionada?.id_conta === 1 ? 'Movimento PF' : 'Movimento PJ', data: '2026-09-22' }], cobrancas: [] })
    if (path === '/adicionar_conta') {
      assert(!body.includes('name="pin"'), 'Abertura existente não pode enviar PIN')
      const empresarial = /name="tipo_conta"\r\n\r\n1/.test(body)
      state.selecionada = structuredClone(empresarial ? pj : pf)
      state.contas.push(state.selecionada)
      return reply({ mensagem: 'Conta criada' })
    }
    if (path === '/adicionar_usuario') return reply({ mensagem: 'Cadastro concluído' })
    if (path === '/esqueci_pin' || path === '/verificar_codigo' || path === '/trocar_pin') { assert(!('tipo_conta' in json)); return reply({ mensagem: 'PIN pessoal atualizado' }) }
    if (path === '/logout') { state.autenticado = false; state.selecionada = null; return reply({ mensagem: 'Sessão encerrada' }) }
    return reply({ mensagem: `Rota não simulada: ${path}` }, 404)
  })
  return { page, state, context }
}

const testes = []
const caso = (nome, options, run) => testes.push({ nome, options, run })
const visivel = (locator) => locator.waitFor({ state: 'visible', timeout: 10000 })
async function login(page) {
  await page.goto(`${base}/login`)
  await page.getByLabel('CPF', { exact: true }).fill(usuario.cpf)
  await page.getByLabel('PIN pessoal', { exact: true }).fill('864209')
  await page.getByRole('button', { name: 'Continuar', exact: true }).click()
  await page.getByRole('button', { name: 'Concluir face simulada' }).click()
}
async function entrar(page, nome) {
  await page.locator('article').filter({ has: page.getByRole('heading', { name: nome, exact: true }) }).getByRole('button', { name: 'Entrar nesta conta' }).click()
  await page.waitForURL('**/dashboard')
}
async function equipe(page) { await page.goto(`${base}/dashboard/acessos`); await visivel(page.getByRole('heading', { name: 'Equipe e acessos' })) }

caso('01-login-pf', { autenticado: false }, async ({ page, state }) => {
  await login(page); await page.waitForURL('**/selecionar-conta')
  assert.equal(await page.evaluate(() => window.__modoFacial), 'login')
  await entrar(page, 'Conta pessoal')
  assert.equal(state.requests.filter((r) => r.path === '/login_usuario').length, 2)
  assert(!state.requests.some((r) => r.path === '/login'))
})
caso('02-troca-pf-pj', { contas: [pf, pj] }, async ({ page }) => {
  await page.goto(`${base}/selecionar-conta`); await entrar(page, 'Conta pessoal')
  await visivel(page.getByText(/123,00/).first())
  await page.getByRole('button', { name: 'Trocar conta', exact: true }).click()
  await entrar(page, 'Empresa Própria')
  await visivel(page.getByText(/987,00/).first())
  assert.equal(await page.getByText(/123,00/).count(), 0)
  await visivel(page.getByRole('button', { name: 'Equipe', exact: true }))
})
caso('03-convite-usuario-existente', { convites: [convite] }, async ({ page }) => {
  await page.goto(`${base}/selecionar-conta`)
  await page.getByRole('button', { name: 'Aceitar', exact: true }).click()
  await entrar(page, 'Empresa XPTO')
  assert.equal(await page.getByRole('button', { name: 'Equipe', exact: true }).count(), 0)
  await visivel(page.getByText('Conta empresarial · Financeiro'))
})
caso('04-novo-convidado-enrollment', { autenticado: false, obrigatorio: true, semBiometria: true, contas: [], convites: [convite] }, async ({ page, state }) => {
  await login(page); await page.waitForURL('**/primeiro-acesso')
  assert.equal(await page.evaluate(() => window.__modoFacial), 'cadastro')
  const paths = state.requests.map((r) => r.path)
  assert(paths.indexOf('/verificar_usuario') > paths.indexOf('/login_usuario'))
  assert(paths.indexOf('/v1/enrollments') > paths.indexOf('/verificar_usuario'))
  await page.getByLabel('Novo PIN pessoal', { exact: true }).fill('864209')
  await page.getByLabel('Confirmar PIN pessoal', { exact: true }).fill('864209')
  await page.getByRole('button', { name: 'Salvar PIN pessoal' }).click()
  await page.waitForURL('**/selecionar-conta')
  await page.getByRole('button', { name: 'Aceitar', exact: true }).click()
  await entrar(page, 'Empresa XPTO')
  assert.equal(state.contas.length, 1)
  assert(!state.requests.some((r) => r.path === '/adicionar_usuario' || r.path === '/adicionar_conta'))
})
caso('05-pin-temporario-expirado', { autenticado: false, expirado: true }, async ({ page, state }) => {
  await page.goto(`${base}/login`)
  await page.getByLabel('CPF', { exact: true }).fill(usuario.cpf)
  await page.getByLabel('PIN pessoal', { exact: true }).fill('864209')
  await page.getByRole('button', { name: 'Continuar', exact: true }).click()
  await visivel(page.getByRole('alert').filter({ hasText: 'Seu PIN temporário expirou' }))
  assert(!state.requests.some((r) => r.path.startsWith('/v1/')))
})
caso('06-convidar-existente', { contas: [pj], selecionada: pj }, async ({ page, state }) => {
  await equipe(page); await page.getByRole('button', { name: 'Adicionar pessoa' }).click()
  await page.getByLabel('CPF', { exact: true }).fill(usuario.cpf)
  await page.getByRole('button', { name: 'Verificar CPF' }).click()
  await page.getByLabel('Cargo', { exact: true }).selectOption('1')
  await page.getByRole('button', { name: 'Enviar convite' }).click()
  await visivel(page.getByText('Convite enviado', { exact: true }))
  assert.deepEqual(state.requests.find((r) => r.path === '/acessos/convidar').json, { cpf: usuario.cpf, cargo: 1 })
})
caso('07-convidar-novo', { contas: [pj], selecionada: pj, consulta: { usuario_existente: false } }, async ({ page, state }) => {
  await equipe(page); await page.getByRole('button', { name: 'Adicionar pessoa' }).click()
  await page.getByLabel('CPF', { exact: true }).fill(usuario.cpf)
  await page.getByRole('button', { name: 'Verificar CPF' }).click()
  await page.getByLabel('Nome', { exact: true }).fill('Maria Teste')
  await page.getByLabel('Email', { exact: true }).fill('maria@example.test')
  await page.getByLabel('Telefone', { exact: true }).fill('11987654321')
  await page.getByRole('button', { name: 'Enviar convite' }).click()
  await visivel(page.getByText('O usuário foi criado sem conta própria e recebeu um PIN temporário por email.'))
  assert.equal(state.requests.find((r) => r.path === '/acessos/convidar').json.nome, 'Maria Teste')
})
caso('08-reenviar-pendente', { contas: [pj], selecionada: pj, acessos: [structuredClone(membro)] }, async ({ page }) => {
  await equipe(page); await page.getByRole('button', { name: 'Reenviar convite' }).click()
  await visivel(page.getByText('Convite reenviado', { exact: true }))
})
caso('09-gerenciar-acesso', { contas: [pj], selecionada: pj, acessos: [{ ...membro, status: 1 }] }, async ({ page, state }) => {
  await equipe(page)
  await page.getByLabel('Cargo de Maria Teste').selectOption('4')
  await page.getByRole('button', { name: 'Salvar cargo' }).click()
  await visivel(page.getByText('Compras', { exact: true }).first())
  await page.getByRole('button', { name: 'Bloquear', exact: true }).click()
  assert.equal(state.acessos[0].status, 1)
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click()
  await page.getByRole('button', { name: 'Reativar', exact: true }).click()
  await page.getByRole('button', { name: 'Revogar', exact: true }).click()
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click()
  await visivel(page.getByText('Revogado', { exact: true }))
  assert.equal(await page.getByRole('button', { name: 'Revogar', exact: true }).count(), 0)
})
caso('10-equipe-delegado-negada', { contas: [delegada], selecionada: delegada }, async ({ page, state }) => {
  await page.goto(`${base}/dashboard/acessos`); await page.waitForURL('**/dashboard')
  assert(!state.requests.some((r) => r.path === '/acessos'))
})
caso('11-reload-primeiro-acesso', { obrigatorio: true, contas: [] }, async ({ page }) => {
  await page.goto(`${base}/primeiro-acesso`); await page.reload()
  await visivel(page.getByRole('heading', { name: 'Crie seu PIN pessoal' }))
  await page.goto(`${base}/dashboard`); await page.waitForURL('**/primeiro-acesso')
})
caso('12-reload-seletor', {}, async ({ page }) => {
  await page.goto(`${base}/selecionar-conta`); await page.reload()
  await visivel(page.getByRole('heading', { name: 'Conta pessoal', exact: true }))
  await page.goto(`${base}/primeiro-acesso`); await page.waitForURL('**/selecionar-conta')
})
caso('13-reload-dashboard', { selecionada: pf }, async ({ page, state }) => {
  await page.goto(`${base}/dashboard`); await page.reload()
  await visivel(page.getByRole('button', { name: 'Trocar conta', exact: true }))
  assert(state.requests.findIndex((r) => r.path === '/sessao') > state.requests.findIndex((r) => r.path === '/sessao_usuario'))
})
caso('14-convidado-abre-pf', { contas: [delegada] }, async ({ page, state }) => {
  await page.goto(`${base}/cadastro`)
  await page.getByRole('button', { name: 'Abrir conta PF' }).click()
  assert.equal(await page.locator('input[type=password]').count(), 0)
  await page.getByRole('button', { name: 'Abrir nova conta' }).click()
  await page.waitForURL('**/dashboard')
  assert(!state.requests.some((r) => r.path === '/adicionar_usuario'))
  assert.equal(state.contas.length, 2)
})
caso('15-recuperacao-pin-pessoal', { autenticado: false }, async ({ page, state }) => {
  await page.goto(`${base}/login`); await page.getByRole('button', { name: 'Esqueci meu PIN' }).click()
  await page.getByLabel('E-mail', { exact: true }).fill(usuario.email)
  await page.getByRole('button', { name: 'Enviar código' }).click()
  await page.getByLabel('Código de verificação').fill('123456')
  await page.getByRole('button', { name: 'Validar código' }).click()
  await page.getByLabel('Novo PIN', { exact: true }).fill('864209')
  await page.getByLabel('Confirmar novo PIN').fill('864209')
  await page.getByRole('button', { name: 'Alterar PIN', exact: true }).click()
  await visivel(page.getByLabel('PIN pessoal', { exact: true }))
  assert.deepEqual(state.requests.find((r) => r.path === '/trocar_pin').json, { email: usuario.email, codigo: '123456', novo_pin: '864209' })
})
caso('16-segunda-conta-sem-pin', { contas: [pf] }, async ({ page, state }) => {
  await page.goto(`${base}/cadastro`)
  assert.equal(await page.getByRole('button', { name: 'Abrir conta PF' }).count(), 0)
  await page.getByRole('button', { name: 'Abrir conta PJ' }).click()
  await page.getByLabel('CNPJ', { exact: true }).fill(pj.cnpj)
  await page.getByLabel('Razão social', { exact: true }).fill(pj.razao_social)
  await page.getByLabel('Nome fantasia', { exact: true }).fill(pj.nome_fantasia)
  await page.getByRole('button', { name: 'Continuar', exact: true }).click()
  await page.getByRole('button', { name: 'Abrir nova conta' }).click()
  await page.waitForURL('**/dashboard')
  assert.equal(state.selecionada.tipo_conta, 1)
})
caso('17-recusa-confirmada-mobile', { contas: [], convites: [convite], mobile: true }, async ({ page, state }) => {
  await page.goto(`${base}/selecionar-conta`)
  await page.getByRole('button', { name: 'Recusar', exact: true }).click()
  assert.equal(state.convites.length, 1)
  await page.keyboard.press('Escape')
  assert.equal(state.convites.length, 1)
  await page.getByRole('button', { name: 'Recusar', exact: true }).click()
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click()
  await visivel(page.getByText('Você ainda não possui uma conta própria nem acessos ativos.'))
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  await page.screenshot({ path: join(artifacts, 'seletor-mobile.png'), fullPage: true })
})
caso('18-equipe-mobile-e-logout', { contas: [pj], selecionada: pj, mobile: true }, async ({ page }) => {
  await page.goto(`${base}/dashboard`)
  await page.getByRole('button', { name: 'Equipe', exact: true }).click()
  await visivel(page.getByRole('heading', { name: 'Equipe e acessos' }))
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  await page.screenshot({ path: join(artifacts, 'equipe-mobile.png'), fullPage: true })
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  await page.waitForURL('**/login')
  await page.goto(`${base}/selecionar-conta`); await page.waitForURL('**/login')
})
caso('19-restauracao-erro-retry', { falhaPath: '/sessao_usuario' }, async ({ page, state }) => {
  await page.goto(`${base}/selecionar-conta`)
  await visivel(page.getByText('Falha simulada do servidor'))
  state.falhaPath = null
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await visivel(page.getByRole('heading', { name: 'Conta pessoal', exact: true }))
})

caso('20-contratos-cadastro-nascimento-perfil', {}, async ({ page, state }) => {
  await page.goto(`${base}/selecionar-conta`)
  await visivel(page.getByRole('heading', { name: 'Escolha sua conta' }))
  const perfil = await page.evaluate(async () => {
    const { cadastrarUsuario } = await import('/src/services/authService.js')
    const { montarPerfilVisual } = await import('/src/utils/perfil.js')
    await cadastrarUsuario({ tipoConta: 'PF', dadosPF: { nome: 'Teste', cpf: '52998224725', pin: '864209', dataNascimento: '1990-01-20' }, dadosPJ: {} })
    await cadastrarUsuario({ tipoConta: 'PJ', dadosPF: {}, dadosPJ: { nomeResponsavel: 'Teste', cpfResponsavel: '52998224725', pin: '864209', dataNascimentoResponsavel: '1985-03-10' } })
    return montarPerfilVisual({ usuario: { id_usuario: 57, nome: 'João', nome_fantasia: 'Dado legado' }, conta: { id_conta: 9, id_titular: 12, vinculo: 'acesso', cargo: 0, tipo_conta: 1, nome_fantasia: 'Empresa atual' } })
  })
  const requests = state.requests.filter((r) => r.path === '/adicionar_usuario')
  assert(requests[0].body.includes('name="data_nascimento"\r\n\r\n1990-01-20'))
  assert(requests[1].body.includes('name="data_nascimento"\r\n\r\n1985-03-10'))
  assert.deepEqual([perfil.idUsuario, perfil.idConta, perfil.idTitular, perfil.vinculo, perfil.cargo, perfil.nome, perfil.nomeFantasia], [57, 9, 12, 'acesso', 0, 'João', 'Empresa atual'])
})
caso('21-delegada-nao-bloqueia-pj-propria', { contas: [delegada] }, async ({ page }) => {
  await page.goto(`${base}/cadastro`)
  await visivel(page.getByRole('button', { name: 'Abrir conta PJ' }))
  await visivel(page.getByRole('button', { name: 'Abrir conta PF' }))
  await page.goto(`${base}/cadastro/pj`)
  await page.reload()
  await visivel(page.getByLabel('CNPJ', { exact: true }))
})
caso('22-convite-pendente-sem-duplicata', { contas: [pj], selecionada: pj, consulta: { usuario_existente: true, usuario, possui_vinculo: true, acesso: { id_acesso: 40, status: 0 } } }, async ({ page, state }) => {
  await equipe(page); await page.getByRole('button', { name: 'Adicionar pessoa' }).click()
  await page.getByLabel('CPF', { exact: true }).fill(usuario.cpf)
  await page.getByRole('button', { name: 'Verificar CPF' }).click()
  await visivel(page.getByText('Vínculo atual: Pendente.'))
  assert.equal(await page.getByRole('button', { name: 'Enviar convite', exact: true }).count(), 0)
  await page.getByRole('button', { name: 'Reenviar convite' }).click()
  await visivel(page.getByText('Convite reenviado', { exact: true }))
  assert(!state.requests.some((r) => r.path === '/acessos/convidar'))
})
caso('23-falha-facial-nao-cria-enrollment', { autenticado: false, falhaPath: '/v1/verifications' }, async ({ page, state }) => {
  await page.goto(`${base}/login`)
  await page.getByLabel('CPF', { exact: true }).fill(usuario.cpf)
  await page.getByLabel('PIN pessoal', { exact: true }).fill('864209')
  await page.getByRole('button', { name: 'Continuar', exact: true }).click()
  await visivel(page.getByRole('alert'))
  assert(!state.requests.some((r) => r.path === '/v1/enrollments' || r.path === '/verificar_usuario'))
})
caso('24-conta-criada-retry-sessao-sem-duplicar', { contas: [], falhaPath: '/sessao' }, async ({ page, state }) => {
  await page.goto(`${base}/cadastro/pf`)
  await page.getByRole('button', { name: 'Abrir nova conta' }).click()
  await visivel(page.getByRole('alert'))
  state.falhaPath = null
  await page.getByRole('button', { name: 'Continuar para minha conta' }).click()
  await page.waitForURL('**/dashboard')
  assert.equal(state.requests.filter((r) => r.path === '/adicionar_conta').length, 1)
})

caso('25-conta-indisponivel-preserva-identidade', { contas: [pf], selecionada: delegada, contaIndisponivel: true }, async ({ page }) => {
  await page.goto(`${base}/dashboard`)
  await page.waitForURL('**/selecionar-conta')
  await visivel(page.getByRole('heading', { name: 'Conta pessoal', exact: true }))
})

let falhas = 0
for (const { nome, options, run } of testes) {
  const env = await ambiente(structuredClone(options))
  try {
    await run(env)
    assert.deepEqual(env.state.erros, [], 'Erros de execução no navegador')
    const requests = await env.page.evaluate(() => window.__fetches)
    assert(requests.filter((r) => !r.path.startsWith('/v1/')).every((r) => r.credentials === 'include'))
    assert.equal(await env.page.evaluate(() => localStorage.length + sessionStorage.length), 0)
    console.log(`PASS ${nome}`)
  } catch (error) {
    falhas += 1
    console.error(`FAIL ${nome}: ${error.message}`)
    await env.page.screenshot({ path: join(artifacts, `${nome}-falha.png`), fullPage: true })
  } finally { await env.context.close() }
}
await browser.close()
console.log(`${testes.length - falhas}/${testes.length} cenários aprovados. Capturas: ${artifacts}`)
process.exitCode = falhas ? 1 : 0
