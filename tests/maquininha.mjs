// Com Vite ativo: node tests/maquininha.mjs. Reutiliza as ferramentas das outras suítes.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { mkdir } from 'node:fs/promises'

const requireTools = createRequire(join(process.env.ARKHE_TEST_TOOLS || join(tmpdir(), 'arkhe-migration-checks'), 'package.json'))
const { chromium } = requireTools('playwright')
const browser = await chromium.launch({ channel: process.env.ARKHE_BROWSER || 'msedge', headless: true })
const base = process.env.ARKHE_TEST_URL || 'http://127.0.0.1:5173'
const artifacts = join(tmpdir(), 'arkhe-migration-checks', 'maquininha')
await mkdir(artifacts, { recursive: true })
const pessoa = { id_usuario: 57, nome: 'João Teste', cpf: '52998224725' }
const conta = { id_conta: 9, id_usuario: 57, id_titular: 57, tipo_conta: 1, vinculo: 'titular', numero_conta: '000009', agencia: '0001', nome_fantasia: 'Empresa Teste', cnpj: '11222333000181' }
const visible = (locator) => locator.waitFor({ state: 'visible', timeout: 8000 })
const panel = (page) => page.getByRole('region', { name: 'Venda presencial', exact: true })

async function ambiente(options = {}) {
  const state = { requests: [], erros: [], logs: [], codigo: null, ...options }
  const context = await browser.newContext({ viewport: { width: options.width || 1440, height: options.height || 1000 } })
  const page = await context.newPage()
  page.on('pageerror', (erro) => state.erros.push(erro.message))
  page.on('console', (msg) => state.logs.push(msg.text()))
  await page.addInitScript(({ semSerial, cancelarSeletor, atrasoAbertura, atrasoSeletor, falhaWriter }) => {
    window.__pay = { comandos: [], aberturas: [], fechamentos: 0, seletores: 0, requests: [], semGesto: false }
    const original = window.fetch
    window.fetch = (url, options = {}) => {
      if (new URL(url, location.href).pathname.startsWith('/maquininha/')) {
        window.__pay.requests.push({ credentials: options.credentials, comandos: [...window.__pay.comandos] })
      }
      return original(url, options)
    }
    if (semSerial) { delete Navigator.prototype.serial; return }
    const serial = new EventTarget()
    let controller
    const porta = {
      async open(config) {
        window.__pay.aberturas.push(config)
        if (atrasoAbertura) await new Promise((r) => setTimeout(r, atrasoAbertura))
        this.readable = new ReadableStream({ start(c) { controller = c }, cancel() { window.__pay.readerCancelado = true } })
        this.writable = falhaWriter ? { getWriter() { throw new Error('Stream indisponível') } } : new WritableStream({ write(bytes) {
          if (window.__pay.falharEscrita) throw new Error('Dispositivo removido')
          window.__pay.comandos.push(new TextDecoder().decode(bytes))
        }, abort() { window.__pay.writerAbortado = true } })
      },
      async close() {
        window.__pay.locksAoFechar = [this.readable?.locked || false, this.writable?.locked || false]
        if (window.__pay.locksAoFechar.some(Boolean)) throw new Error('Porta presa')
        window.__pay.fechamentos++
      },
    }
    serial.requestPort = async () => {
      window.__pay.seletores++
      if (!navigator.userActivation.isActive) window.__pay.semGesto = true
      if (cancelarSeletor) throw new DOMException('Seleção cancelada', 'NotFoundError')
      if (atrasoSeletor) await new Promise((r) => setTimeout(r, atrasoSeletor))
      return porta
    }
    window.__pay.receber = (texto) => controller.enqueue(new TextEncoder().encode(texto))
    window.__pay.remover = () => { const evento = new Event('disconnect'); Object.defineProperty(evento, 'port', { value: porta }); serial.dispatchEvent(evento) }
    window.__pay.encerrarLeitura = () => controller.close()
    Object.defineProperty(navigator, 'serial', { value: serial, configurable: true })
  }, options)
  await page.route('**/*', async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    if (url.origin === base) return route.continue()
    if (!['fetch', 'xhr'].includes(req.resourceType())) return route.abort()
    const path = url.pathname
    let json
    try { json = req.postDataJSON() } catch { /* GET */ }
    state.requests.push({ path, json })
    const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
    if (path === '/sessao_usuario') return reply({ usuario: pessoa, conta_selecionada: true })
    if (path === '/sessao') return reply({ usuario: pessoa, conta: { ...conta, tipo_conta: options.pf ? 0 : 1 } })
    if (path === '/buscar_movimentacoes') return reply({ movimentacoes: [], cobrancas: [] })
    if (path === '/cartao') return reply({ possui_cartao: false, cartao: null })
    if (path === '/contas_disponiveis') return reply({ contas: [conta] })
    if (path === '/convites_pendentes') return reply({ convites: [] })
    if (path === '/maquininha/identificar') {
      if (state.delayIdentificar) await new Promise((r) => setTimeout(r, state.delayIdentificar))
      if (state.erroIdentificar) return reply({ cartao_encontrado: false, codigo: state.erroIdentificar }, state.http || 400)
      return reply({ cartao_encontrado: true, nome: 'Lais Teste', final_cartao: '1234' })
    }
    if (path === '/maquininha/comprar') {
      if (state.delayComprar) await new Promise((r) => setTimeout(r, state.delayComprar))
      if (state.falhaRede) return route.abort('failed')
      if (state.codigo) return reply({ aprovado: false, codigo: state.codigo }, state.http || 400)
      return reply({ aprovado: true, codigo: 'APROVADO', valor: 10, nome: 'Lais Teste', final_cartao: '1234' })
    }
    return reply({}, 404)
  })
  await page.goto(`${base}/dashboard`)
  await visible(page.getByRole('heading', { name: 'Movimentações recentes' }))
  return { page, context, state }
}

async function conectar(page) {
  await panel(page).getByRole('button', { name: 'Conectar maquininha', exact: true }).click()
  await visible(panel(page).getByText('Maquininha conectada', { exact: true }))
}
async function iniciar(page) {
  await conectar(page)
  await page.getByLabel('VALOR DA VENDA', { exact: true }).fill('1000')
  await panel(page).getByRole('button', { name: /Cobrar/ }).click()
  await visible(panel(page).getByRole('heading', { name: 'Aproxime o cartão', exact: true }))
}
async function identificar(page) {
  await page.evaluate(() => { window.__pay.receber('PRON'); window.__pay.receber('TO\r\nCART'); window.__pay.receber('AO| 0D94'); window.__pay.receber('A4A5 \r\nCARTAO|0D94A4A5\n') })
  await visible(page.getByRole('dialog', { name: 'Digite o PIN' }))
}
async function pagar(page) {
  await page.getByLabel('PIN de 6 dígitos', { exact: true }).fill('123456')
  await page.getByRole('button', { name: 'Confirmar pagamento' }).click()
}
const casos = []
const caso = (nome, options, run) => casos.push({ nome, options, run })

caso('fluxo-completo-fragmentos-duplicados-privacidade', {}, async ({ page, state }) => {
  assert.equal(await page.getByRole('heading', { name: 'Panorama do mês' }).count(), 0)
  assert(await panel(page).evaluate((el) => el.previousElementSibling.classList.contains('cartao-resumo')))
  await iniciar(page)
  await identificar(page)
  assert.equal(state.requests.filter((r) => r.path === '/maquininha/identificar').length, 1)
  assert.deepEqual(state.requests.find((r) => r.path === '/maquininha/identificar').json, { uid: '0D94A4A5' })
  const antes = state.requests.filter((r) => r.path === '/buscar_movimentacoes').length
  await pagar(page)
  await visible(panel(page).getByRole('heading', { name: 'Pagamento aprovado' }))
  await page.waitForFunction(() => window.__pay.comandos.includes('APROVADO|10.00\n'))
  assert(state.requests.filter((r) => r.path === '/buscar_movimentacoes').length > antes)
  assert.deepEqual(state.requests.find((r) => r.path === '/maquininha/comprar').json, { uid: '0D94A4A5', pin: '123456', valor: 10, tipo: 'DEBITO', parcelas: 1 })
  assert.deepEqual(await page.evaluate(() => window.__pay.comandos), ['INICIAR|10.00|DEBITO\n', 'PROCESSANDO\n', 'APROVADO|10.00\n'])
  assert.deepEqual(await page.evaluate(() => window.__pay.aberturas), [{ baudRate: 115200 }])
  assert.equal(await page.evaluate(() => window.__pay.semGesto), false)
  assert(await page.evaluate(() => window.__pay.requests[1].comandos.includes('PROCESSANDO\n')))
  assert(!(await panel(page).innerText()).includes('0D94A4A5'))
  await panel(page).getByRole('button', { name: 'Nova venda' }).click()
  assert.equal(await page.getByLabel('VALOR DA VENDA').inputValue(), 'R$ 0,00')
  assert(await panel(page).getByText('Maquininha conectada', { exact: true }).isVisible())
  await panel(page).getByRole('button', { name: 'Desconectar', exact: true }).click()
  await page.waitForFunction(() => window.__pay.fechamentos === 1)
  assert.deepEqual(await page.evaluate(() => window.__pay.locksAoFechar), [false, false])
  await conectar(page)
})
caso('credito-parcelado', {}, async ({ page, state }) => {
  await conectar(page)
  await page.getByLabel('VALOR DA VENDA').fill('12000')
  await panel(page).getByRole('button', { name: /Crédito/ }).click()
  await page.getByLabel('Parcelamento').selectOption('3')
  await panel(page).getByRole('button', { name: /Cobrar/ }).click()
  await visible(panel(page).getByRole('heading', { name: 'Aproxime o cartão', exact: true }))
  assert((await page.evaluate(() => window.__pay.comandos)).includes('INICIAR|120.00|CREDITO\n'))
  await identificar(page)
  assert(await page.getByRole('dialog').getByText(/Crédito 3x/).isVisible())
  await pagar(page)
  await visible(panel(page).getByRole('heading', { name: 'Pagamento aprovado' }))
  assert.deepEqual(state.requests.find((r) => r.path === '/maquininha/comprar').json,
    { uid: '0D94A4A5', pin: '123456', valor: 120, tipo: 'CREDITO', parcelas: 3 })
  assert(await panel(page).getByText('Crédito · 3x', { exact: true }).isVisible())
})
caso('credito-quinze-parcelas', {}, async ({ page, state }) => {
  await conectar(page)
  await page.getByLabel('VALOR DA VENDA').fill('15000')
  await panel(page).getByRole('button', { name: /Crédito/ }).click()
  await page.getByLabel('Parcelamento').selectOption('15')
  await panel(page).getByRole('button', { name: /Cobrar/ }).click()
  await visible(panel(page).getByRole('heading', { name: 'Aproxime o cartão', exact: true }))
  await identificar(page)
  assert(await page.getByRole('dialog').getByText(/Crédito 15x/).isVisible())
  await pagar(page)
  await visible(panel(page).getByRole('heading', { name: 'Pagamento aprovado' }))
  assert.deepEqual(state.requests.find((r) => r.path === '/maquininha/comprar').json,
    { uid: '0D94A4A5', pin: '123456', valor: 150, tipo: 'CREDITO', parcelas: 15 })
})
caso('pf-preserva-panorama', { pf: true }, async ({ page }) => {
  await visible(page.getByRole('heading', { name: 'Panorama do mês' }))
  assert.equal(await panel(page).count(), 0)
})
caso('sem-web-serial', { semSerial: true }, async ({ page }) => {
  await visible(panel(page).getByText('Este navegador não oferece suporte à conexão USB da maquininha.'))
  assert(await panel(page).getByRole('button', { name: /Cobrar/ }).isDisabled())
})
caso('fechar-seletor', { cancelarSeletor: true }, async ({ page }) => {
  await panel(page).getByRole('button', { name: 'Conectar maquininha', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('.pay-botao-conexao')?.disabled === false)
  assert.equal(await panel(page).getByRole('alert').count(), 0)
  assert(await panel(page).getByRole('button', { name: /Cobrar/ }).isDisabled())
})
caso('entrada-monetaria-teclado-e-limites', {}, async ({ page }) => {
  await conectar(page)
  const input = page.getByLabel('VALOR DA VENDA')
  await input.click()
  for (const [key, esperado] of [['1', '0,01'], ['0', '0,10'], ['0', '1,00'], ['0', '10,00']]) {
    await page.keyboard.press(key)
    assert((await input.inputValue()).endsWith(esperado))
  }
  await page.keyboard.press('Backspace')
  assert((await input.inputValue()).endsWith('1,00'))
  await panel(page).getByRole('button', { name: 'Limpar', exact: true }).click()
  assert(await panel(page).getByRole('button', { name: /Cobrar/ }).isDisabled())
  await panel(page).getByRole('button', { name: '5', exact: true }).click()
  assert((await input.inputValue()).endsWith('0,05'))
  await input.fill('-5')
  assert((await input.inputValue()).endsWith('0,05'))
  await input.fill('99999999')
  assert((await input.inputValue()).endsWith('999.999,99'))
})
caso('duplo-clique-cobrar-e-confirmar', { delayComprar: 500 }, async ({ page, state }) => {
  await conectar(page)
  await page.getByLabel('VALOR DA VENDA').fill('1000')
  await panel(page).getByRole('button', { name: /Cobrar/ }).evaluate((el) => { el.click(); el.click() })
  await identificar(page)
  const modal = page.getByRole('dialog')
  assert(await modal.getByRole('button', { name: 'Confirmar pagamento' }).isDisabled())
  await page.getByLabel('PIN de 6 dígitos', { exact: true }).fill('123456')
  await modal.getByRole('button', { name: 'Confirmar pagamento' }).evaluate((el) => { el.click(); el.click() })
  await visible(panel(page).getByRole('heading', { name: 'Processando pagamento...' }))
  assert(await panel(page).getByRole('button', { name: 'Cancelar', exact: true }).isDisabled())
  assert.equal(await page.getByLabel('PIN de 6 dígitos', { exact: true }).count(), 0)
  await visible(panel(page).getByRole('heading', { name: 'Pagamento aprovado' }))
  assert.equal(state.requests.filter((r) => r.path === '/maquininha/comprar').length, 1)
  assert.equal((await page.evaluate(() => window.__pay.comandos)).filter((c) => c.startsWith('INICIAR')).length, 1)
})
for (const codigo of ['PIN_INVALIDO', 'SALDO_INSUFICIENTE', 'LIMITE_INSUFICIENTE', 'PARCELAS_INVALIDAS', 'COMPRA_DUPLICADA', 'CARTAO_BLOQUEADO', 'CONTA_INVALIDA', 'ERRO_INTERNO', 'EMPRESA_NAO_AUTENTICADA', 'CONTA_NAO_PJ', 'MODALIDADE_INDISPONIVEL', 'DADOS_INVALIDOS']) {
  caso(`negado-${codigo}`, { codigo, http: codigo === 'PIN_INVALIDO' ? 200 : 400 }, async ({ page }) => {
    await iniciar(page)
    await identificar(page)
    await pagar(page)
    await visible(panel(page).getByRole('heading', { name: 'Pagamento não aprovado' }))
    await page.waitForFunction((codigo) => window.__pay.comandos.includes(`NEGADO|${codigo}\n`), codigo)
    assert.equal(await page.getByRole('dialog').count(), 0)
    await panel(page).getByRole('button', { name: 'Nova venda' }).click()
    assert.equal(await panel(page).getByText('Lais Teste').count(), 0)
  })
}
for (const codigo of ['CARTAO_NAO_RECONHECIDO', 'CARTAO_BLOQUEADO', 'UID_INVALIDO']) {
  caso(`identificacao-${codigo}`, { erroIdentificar: codigo }, async ({ page, state }) => {
    await iniciar(page)
    await page.evaluate(() => window.__pay.receber('CARTAO|0D94A4A5\n'))
    await visible(panel(page).getByRole('heading', { name: 'Pagamento não aprovado' }))
    await page.waitForFunction((codigo) => window.__pay.comandos.includes(`NEGADO|${codigo}\n`), codigo)
    assert.equal(state.requests.filter((r) => r.path === '/maquininha/comprar').length, 0)
  })
}
caso('cancelar-espera', {}, async ({ page, state }) => {
  await iniciar(page)
  await panel(page).getByRole('button', { name: 'Cancelar', exact: true }).click()
  await visible(page.getByLabel('VALOR DA VENDA'))
  await page.evaluate(() => window.__pay.receber('CARTAO|0D94A4A5\n'))
  assert((await page.evaluate(() => window.__pay.comandos)).includes('CANCELAR\n'))
  assert.equal(state.requests.filter((r) => r.path.startsWith('/maquininha/')).length, 0)
})
caso('cancelar-identificacao-pendente', { delayIdentificar: 500 }, async ({ page }) => {
  await iniciar(page)
  await page.evaluate(() => window.__pay.receber('CARTAO|0D94A4A5\n'))
  await visible(panel(page).getByRole('heading', { name: 'Lendo cartão...' }))
  await panel(page).getByRole('button', { name: 'Cancelar', exact: true }).click()
  await page.waitForTimeout(600)
  assert.equal(await page.getByRole('dialog').count(), 0)
  assert(await page.getByLabel('VALOR DA VENDA').isVisible())
})
caso('cancelar-pin-e-teclado-fisico', {}, async ({ page, state }) => {
  await iniciar(page)
  await identificar(page)
  await page.getByRole('dialog').focus()
  await page.keyboard.type('1234567')
  assert.equal(await page.locator('.pay-pin-indicadores .preenchido').count(), 6)
  await page.keyboard.press('Escape')
  await visible(page.getByLabel('VALOR DA VENDA'))
  assert.equal(await page.getByRole('dialog').count(), 0)
  assert.equal(state.requests.filter((r) => r.path === '/maquininha/comprar').length, 0)
})
caso('cabo-removido-no-pin', {}, async ({ page }) => {
  await iniciar(page)
  await identificar(page)
  await page.evaluate(() => window.__pay.remover())
  await page.waitForFunction(() => window.__pay.fechamentos === 1)
  assert.equal(await page.getByRole('dialog').count(), 0)
  assert(await panel(page).getByRole('button', { name: /Cobrar/ }).isDisabled())
  assert.deepEqual(await page.evaluate(() => window.__pay.locksAoFechar), [false, false])
  await conectar(page)
})
caso('cabo-removido-processando-preserva-aprovacao', { delayComprar: 500 }, async ({ page }) => {
  await iniciar(page)
  await identificar(page)
  await pagar(page)
  await page.waitForFunction(() => window.__pay.requests.length === 2)
  await page.evaluate(() => window.__pay.remover())
  await visible(panel(page).getByRole('heading', { name: 'Pagamento aprovado' }))
  assert(await panel(page).getByText('Maquininha desconectada').isVisible())
})
caso('falha-notificar-aprovacao-nao-vira-negacao', { delayComprar: 500 }, async ({ page }) => {
  await iniciar(page)
  await identificar(page)
  await pagar(page)
  await page.waitForFunction(() => window.__pay.requests.length === 2)
  await page.evaluate(() => { window.__pay.falharEscrita = true })
  await visible(panel(page).getByRole('heading', { name: 'Pagamento aprovado' }))
  await page.waitForFunction(() => window.__pay.fechamentos === 1)
  assert.equal(await panel(page).getByRole('heading', { name: 'Pagamento não aprovado' }).count(), 0)
})
caso('rede-sem-resposta-nao-reenvia-compra', { falhaRede: true }, async ({ page, state }) => {
  await iniciar(page)
  await identificar(page)
  await pagar(page)
  await visible(panel(page).getByRole('heading', { name: 'Confirme no extrato' }))
  assert.equal(state.requests.filter((r) => r.path === '/maquininha/comprar').length, 1)
  assert(!(await page.evaluate(() => window.__pay.comandos)).some((c) => c.startsWith('NEGADO|')))
})
caso('saida-pagina-libera-porta', {}, async ({ page }) => {
  await iniciar(page)
  await page.getByRole('button', { name: /Ver extrato/ }).first().click()
  await page.waitForFunction(() => window.__pay.fechamentos === 1)
  assert.deepEqual(await page.evaluate(() => window.__pay.locksAoFechar), [false, false])
  assert(await page.evaluate(() => window.__pay.readerCancelado && window.__pay.writerAbortado))
})
caso('saida-durante-abertura', { atrasoAbertura: 600 }, async ({ page }) => {
  await panel(page).getByRole('button', { name: 'Conectar maquininha', exact: true }).click()
  await page.getByRole('button', { name: /Ver extrato/ }).first().click()
  await page.waitForFunction(() => window.__pay.fechamentos === 1)
  assert.deepEqual(await page.evaluate(() => window.__pay.locksAoFechar), [false, false])
})
caso('fim-do-stream-libera-porta', {}, async ({ page }) => {
  await conectar(page)
  await page.evaluate(() => window.__pay.encerrarLeitura())
  await page.waitForFunction(() => window.__pay.fechamentos === 1)
  assert(await panel(page).getByText('Maquininha desconectada').isVisible())
})
caso('falha-writer-libera-reader', { falhaWriter: true }, async ({ page }) => {
  await panel(page).getByRole('button', { name: 'Conectar maquininha', exact: true }).click()
  await visible(panel(page).getByRole('alert'))
  await page.waitForFunction(() => window.__pay.fechamentos === 1)
  assert.deepEqual(await page.evaluate(() => window.__pay.locksAoFechar), [false, false])
})
caso('saida-com-seletor-pendente', { atrasoSeletor: 600 }, async ({ page }) => {
  await panel(page).getByRole('button', { name: 'Conectar maquininha', exact: true }).click()
  await page.getByRole('button', { name: /Ver extrato/ }).first().click()
  await page.waitForTimeout(700)
  assert.deepEqual(await page.evaluate(() => window.__pay.aberturas), [])
})
for (const width of [320, 390, 650, 900, 1440]) {
  caso(`responsivo-${width}`, { width, height: 800 }, async ({ page }) => {
    await conectar(page)
    await page.getByLabel('VALOR DA VENDA').fill('99999999')
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    assert(await panel(page).evaluate((el) => el.scrollWidth <= el.clientWidth))
    await panel(page).screenshot({ path: join(artifacts, `pay-${width}.png`) })
    await panel(page).getByRole('button', { name: /Cobrar/ }).click()
    await identificar(page)
    const modal = page.getByRole('dialog')
    const rect = await modal.boundingBox()
    assert(rect.x >= 0 && rect.x + rect.width <= width && rect.y >= 0 && rect.y + rect.height <= 800)
    assert(await modal.evaluate((el) => el.scrollWidth <= el.clientWidth))
    await page.screenshot({ path: join(artifacts, `pin-${width}.png`) })
  })
}

let falhas = 0
try {
  for (const { nome, options, run } of casos) {
    const env = await ambiente(options)
    try {
      await run(env)
      assert.deepEqual(env.state.erros, [])
      assert.equal(await env.page.evaluate(() => localStorage.length + sessionStorage.length), 0)
      assert(await env.page.evaluate(() => window.__pay.requests.every((r) => r.credentials === 'include')))
      assert(!env.state.logs.some((msg) => msg.includes('123456') || msg.includes('0D94A4A5')))
      console.log(`PASS ${nome}`)
    } catch (erro) {
      falhas++
      console.error(`FAIL ${nome}: ${erro.message}`)
      await env.page.screenshot({ path: join(artifacts, `${nome}-falha.png`) })
    } finally { await env.context.close() }
  }
} finally { await browser.close() }
console.log(`${casos.length - falhas}/${casos.length} cenários aprovados. Capturas: ${artifacts}`)
process.exitCode = falhas ? 1 : 0
