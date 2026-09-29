import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { mkdir } from 'node:fs/promises'

const requireTools = createRequire(join(process.env.ARKHE_TEST_TOOLS || join(tmpdir(), 'arkhe-migration-checks'), 'package.json'))
const { chromium } = requireTools('playwright')
const browser = await chromium.launch({ channel: process.env.ARKHE_BROWSER || 'msedge', headless: true })
const base = process.env.ARKHE_TEST_URL || 'http://127.0.0.1:5173'
const artifacts = join(tmpdir(), 'arkhe-migration-checks', 'csv-funcionarios')
await mkdir(artifacts, { recursive: true })
const visible = (locator) => locator.waitFor({ state: 'visible', timeout: 8000 })

const usuario = { id_usuario: 57, nome: 'João Teste', cpf: '52998224725' }
const contaPJ = { id_conta: 2, id_titular: 57, tipo_conta: 1, vinculo: 'proprietario', nome_fantasia: 'Empresa Teste', cnpj: '11222333000181' }
const contaPF = { id_conta: 1, id_titular: 57, tipo_conta: 0, vinculo: 'proprietario' }
const ana = { id_funcionario: 7, id_usuario: 90, id_conta: 2, nome: 'Ana Souza', cpf: '39053344705', salario: 3000, status: 1, possui_conta_arkhe: true }
const bia = { id_funcionario: 8, id_usuario: null, id_conta: 2, nome: 'Bia Lima', cpf: '98765432100', salario: 2100, status: 0, possui_conta_arkhe: false }
const itensPreview = [
  { linha: 2, cpf: '11144477735', cpf_valido: true, nome: 'Carla Nova', salario: 2500, situacao: 'novo', possui_conta_arkhe: true },
  { linha: 3, cpf: ana.cpf, cpf_valido: true, nome: 'Ana Souza Atualizada', salario: 3200, situacao: 'existente', id_funcionario: 7, nome_atual: ana.nome, salario_atual: ana.salario, status_atual: 1, possui_conta_arkhe: true },
  { linha: 4, cpf: '12345678901', cpf_valido: true, nome: 'Pedro', salario: 2000, situacao: 'novo', possui_conta_arkhe: false },
]

async function ambiente({ tipo = 'PJ', width = 1440 } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, acceptDownloads: true })
  const page = await context.newPage()
  const state = { funcionarios: [structuredClone(ana), structuredClone(bia)], requests: [], erros: [], falharPreview: false, listagens: 0 }
  page.on('pageerror', (erro) => state.erros.push(erro.message))
  page.on('console', (evento) => { if (evento.type() === 'error' && !evento.text().includes('Failed to load resource')) state.erros.push(evento.text()) })
  await page.route('**/*', async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    if (url.origin === base) return route.continue()
    if (!['fetch', 'xhr'].includes(req.resourceType())) return route.abort()
    const path = url.pathname
    state.requests.push({ path, method: req.method(), headers: req.headers(), body: req.headers()['content-type']?.includes('application/json') ? req.postDataJSON() : null })
    const reply = (dados, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(dados) })
    const conta = tipo === 'PJ' ? contaPJ : contaPF
    if (path === '/sessao_usuario') return reply({ usuario, conta_selecionada: true })
    if (path === '/sessao') return reply({ usuario, conta })
    if (path === '/listar_funcionarios') { state.listagens += 1; return reply(state.funcionarios) }
    if (path === '/listar_folhas') return reply({ folhas: [], total: 0 })
    if (path === '/buscar_movimentacoes') return reply({ movimentacoes: [], cobrancas: [] })
    if (path === '/cartao') return reply({ mensagem: 'Sem cartão.' }, 404)
    if (path === '/funcionarios/csv/preview') {
      assert.equal(req.method(), 'POST')
      assert.match(req.headers()['content-type'], /^multipart\/form-data; boundary=/)
      assert.equal(req.headers()['content-type'].includes('application/json'), false)
      assert.ok(req.postDataBuffer().includes(Buffer.from('equipe.csv')))
      if (state.falharPreview) return reply({ mensagem: 'Serviço de importação indisponível.' }, 503)
      return reply({ mensagem: 'CSV analisado com sucesso', total_linhas: 3, novos: 1, existentes: 1, erros: 1, colunas_ausentes: [], itens: itensPreview })
    }
    if (path === '/funcionarios/csv/importar') {
      assert.equal(req.method(), 'POST')
      assert.match(req.headers()['content-type'], /^application\/json/)
      const dados = req.postDataJSON()
      assert.equal(dados.itens.length, 2, 'linhas com erro não são enviadas')
      assert.deepEqual(dados.itens.map((item) => item.acao), ['criar', 'atualizar'])
      assert.equal('status' in dados.itens[1], false)
      state.funcionarios[0] = { ...state.funcionarios[0], nome: 'Ana Souza Atualizada', salario: 3200 }
      state.funcionarios.push({ id_funcionario: 9, nome: 'Carla Nova', cpf: '11144477735', salario: 2500, status: 1, possui_conta_arkhe: true })
      return reply({ mensagem: 'Importacao concluida', criados: 1, atualizados: 1, ignorados: 0, quantidade_erros: 1, erros: [{ linha: 9, cpf: '99999999999', erro: 'Dados invalidos' }] })
    }
    throw new Error(`Endpoint inesperado: ${path}`)
  })
  return { context, page, state }
}

async function conteudoDownload(page, botao, nomeEsperado) {
  await page.evaluate(() => {
    window.__csvCapturado = null
    if (!window.__cliqueOriginalCsv) window.__cliqueOriginalCsv = HTMLAnchorElement.prototype.click
    HTMLAnchorElement.prototype.click = function clicarLink() {
      if (!this.download) return window.__cliqueOriginalCsv.call(this)
      const nome = this.download
      fetch(this.href).then((resposta) => resposta.arrayBuffer()).then((buffer) => {
        const bytes = new Uint8Array(buffer)
        window.__csvCapturado = { nome, bom: Array.from(bytes.slice(0, 3)), conteudo: new TextDecoder().decode(bytes.slice(3)) }
      })
    }
  })
  await botao.click()
  await page.waitForFunction(() => window.__csvCapturado !== null)
  const download = await page.evaluate(() => window.__csvCapturado)
  assert.equal(download.nome, nomeEsperado)
  assert.deepEqual(download.bom, [239, 187, 191], 'CSV inclui BOM UTF-8')
  return download.conteudo
}

async function enviarCsv(dialogo) {
  await dialogo.locator('input[type="file"]').setInputFiles({ name: 'equipe.csv', mimeType: 'text/csv', buffer: Buffer.from('cpf,nome,salario\n11144477735,Carla Nova,2500.00') })
  await visible(dialogo.getByText('equipe.csv', { exact: true }))
  await visible(dialogo.getByText(/bytes|KB/))
  await dialogo.getByRole('button', { name: 'Analisar arquivo', exact: true }).click()
}

try {
  const h = await ambiente()
  await h.page.goto(`${base}/dashboard/funcionarios`)
  await visible(h.page.getByRole('heading', { name: 'Sua equipe', exact: true }))

  const exportado = await conteudoDownload(h.page, h.page.getByRole('button', { name: 'Exportar funcionários', exact: true }), 'funcionarios_arkhe.csv')
  assert.ok(exportado.startsWith('cpf,nome,salario,status\r\n'))
  assert.match(exportado, /39053344705,Ana Souza,3000\.00,ativo/)
  assert.match(exportado, /98765432100,Bia Lima,2100\.00,inativo/)
  assert.doesNotMatch(exportado, /id_funcionario|id_usuario|id_conta/)

  await h.page.getByRole('button', { name: 'Importar CSV', exact: true }).click()
  let dialogo = h.page.getByRole('dialog', { name: 'Importe sua equipe em poucos minutos' })
  await visible(dialogo)
  const modelo = await conteudoDownload(h.page, dialogo.getByRole('button', { name: 'Baixar modelo CSV', exact: true }), 'modelo_funcionarios_arkhe.csv')
  assert.match(modelo, /52998224725/)
  assert.match(modelo, /11144477735/)
  assert.doesNotMatch(modelo, /12345678901/)

  const previewsAntesInvalido = h.state.requests.filter((item) => item.path === '/funcionarios/csv/preview').length
  await dialogo.locator('input[type="file"]').setInputFiles({ name: 'equipe.txt', mimeType: 'text/plain', buffer: Buffer.from('invalido') })
  await visible(dialogo.getByRole('alert').filter({ hasText: 'Escolha um arquivo no formato CSV.' }))
  assert.equal(h.state.requests.filter((item) => item.path === '/funcionarios/csv/preview').length, previewsAntesInvalido)

  await enviarCsv(dialogo)
  dialogo = h.page.getByRole('dialog', { name: 'Confira os funcionários' })
  await visible(dialogo)
  assert.deepEqual(await dialogo.locator('.importacao-resumo dd').allTextContents(), ['3', '1', '1', '1'])
  await visible(dialogo.getByText('Carla Nova', { exact: true }))
  await visible(dialogo.getByText('Ana Souza Atualizada', { exact: true }))
  await visible(dialogo.getByText('CPF inválido', { exact: true }))
  const linhaAna = dialogo.locator('.importacao-linha.existente')
  assert.equal(await linhaAna.getByRole('button', { name: 'Ignorar', exact: true }).getAttribute('aria-pressed'), 'true')
  await dialogo.getByRole('button', { name: 'Erros', exact: true }).click()
  assert.equal(await dialogo.locator('.importacao-linha.erro').isVisible(), true)
  assert.equal(await dialogo.locator('.importacao-linha.novo').count(), 0)
  await dialogo.getByRole('button', { name: 'Todos', exact: true }).click()
  await dialogo.getByLabel('Buscar na prévia').fill('Ana')
  await visible(dialogo.getByText('Ana Souza Atualizada', { exact: true }))
  assert.equal(await dialogo.getByText('Carla Nova', { exact: true }).count(), 0)
  await dialogo.getByLabel('Buscar na prévia').fill('')
  await h.page.screenshot({ path: join(artifacts, 'preview-desktop.png'), fullPage: true })

  await dialogo.getByRole('button', { name: 'Continuar', exact: true }).click()
  dialogo = h.page.getByRole('dialog', { name: 'Confirmar importação?' })
  await visible(dialogo)
  assert.match(await dialogo.innerText(), /existentes que serão ignorados\s*1/)
  await dialogo.getByRole('button', { name: 'Voltar', exact: true }).click()
  dialogo = h.page.getByRole('dialog', { name: 'Confira os funcionários' })
  await visible(dialogo)

  await dialogo.getByRole('button', { name: 'Atualizar todos os existentes', exact: true }).click()
  const confirmacaoMassa = dialogo.getByRole('alertdialog', { name: 'Confirmar atualização em massa' })
  await visible(confirmacaoMassa)
  await visible(confirmacaoMassa.getByText('Isso atualizará nome e salário dos funcionários existentes usando os dados do CSV.', { exact: false }))
  await confirmacaoMassa.getByRole('button', { name: 'Confirmar atualização', exact: true }).click()
  assert.equal(await linhaAna.getByRole('button', { name: 'Atualizar', exact: true }).getAttribute('aria-pressed'), 'true')
  await linhaAna.getByRole('button', { name: 'Ignorar', exact: true }).click()
  assert.equal(await linhaAna.getByRole('button', { name: 'Ignorar', exact: true }).getAttribute('aria-pressed'), 'true')
  await linhaAna.getByRole('button', { name: 'Atualizar', exact: true }).click()

  await dialogo.getByRole('button', { name: 'Continuar', exact: true }).click()
  dialogo = h.page.getByRole('dialog', { name: 'Confirmar importação?' })
  await visible(dialogo)
  assert.match(await dialogo.innerText(), /Novos funcionários que serão cadastrados\s*1/)
  assert.match(await dialogo.innerText(), /existentes que serão atualizados\s*1/)
  assert.match(await dialogo.innerText(), /Linhas com erro que não serão importadas\s*1/)
  const listagensAntes = h.state.listagens
  await dialogo.getByRole('button', { name: 'Confirmar importação', exact: true }).click()
  await visible(h.page.getByRole('dialog', { name: 'Importação concluída' }))
  dialogo = h.page.getByRole('dialog', { name: 'Importação concluída' })
  await visible(dialogo.getByText('1', { exact: true }).first())
  await visible(dialogo.getByText('Alguns funcionários não puderam ser importados.', { exact: true }))
  await visible(dialogo.getByText('Linha 9 — CPF 999.999.999-99', { exact: true }))
  assert.ok(h.state.listagens > listagensAntes)
  await dialogo.getByRole('button', { name: 'Concluir', exact: true }).click()
  await visible(h.page.getByRole('heading', { name: 'Carla Nova', exact: true }))
  const cartaoAna = h.page.locator('.folha-funcionario').filter({ has: h.page.getByRole('heading', { name: 'Ana Souza Atualizada', exact: true }) })
  await visible(cartaoAna.getByText('R$ 3.200,00', { exact: true }))

  h.state.falharPreview = true
  await h.page.getByRole('button', { name: 'Importar CSV', exact: true }).click()
  dialogo = h.page.getByRole('dialog', { name: 'Importe sua equipe em poucos minutos' })
  await enviarCsv(dialogo)
  await visible(dialogo.getByRole('alert').filter({ hasText: 'Serviço de importação indisponível.' }))
  await dialogo.getByRole('button', { name: 'Fechar importação' }).click()
  assert.deepEqual(h.state.erros, [])
  await h.context.close()
  console.log('PASS CSV: modelo, exportação segura, arquivo inválido, upload multipart, prévia, filtros, novo/existente/erro, escolhas, confirmação, importação parcial, recarga e indisponibilidade.')

  const mobile = await ambiente({ width: 390 })
  await mobile.page.goto(`${base}/dashboard/funcionarios`)
  await visible(mobile.page.getByRole('button', { name: 'Importar CSV', exact: true }))
  await mobile.page.getByRole('button', { name: 'Importar CSV', exact: true }).click()
  let modalMobile = mobile.page.getByRole('dialog', { name: 'Importe sua equipe em poucos minutos' })
  await enviarCsv(modalMobile)
  modalMobile = mobile.page.getByRole('dialog', { name: 'Confira os funcionários' })
  await visible(modalMobile)
  assert.equal(await modalMobile.evaluate((elemento) => elemento.scrollWidth <= elemento.clientWidth + 1), true, 'modal mobile sem scroll horizontal')
  await mobile.page.screenshot({ path: join(artifacts, 'preview-mobile.png'), fullPage: true })
  await modalMobile.getByText('Carla Nova', { exact: true }).scrollIntoViewIfNeeded()
  await mobile.page.screenshot({ path: join(artifacts, 'preview-mobile-itens.png'), fullPage: true })
  assert.deepEqual(mobile.state.erros, [])
  await mobile.context.close()
  console.log('PASS CSV responsivo: prévia em cards a 390 px sem scroll horizontal.')

  const pf = await ambiente({ tipo: 'PF' })
  await pf.page.goto(`${base}/dashboard/funcionarios`)
  await pf.page.waitForURL('**/dashboard')
  assert.equal(await pf.page.getByRole('button', { name: 'Importar CSV', exact: true }).count(), 0)
  assert.equal(pf.state.requests.some((item) => item.path.startsWith('/funcionarios/csv/')), false)
  assert.deepEqual(pf.state.erros, [])
  await pf.context.close()
  console.log(`PASS CSV PF sem acesso. Capturas: ${artifacts}`)
} finally {
  await browser.close()
}
