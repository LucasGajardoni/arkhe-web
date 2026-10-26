import { useEffect, useRef, useState } from 'react'
import { API_URL } from '../../config/api.js'
import './ApiDocs.css'

const baseUrl = API_URL.replace(/\/+$/, '')

const exemploHeaders = `const headers = {
  'X-Client-ID': 'SEU_CLIENT_ID',
  'X-Client-Secret': 'SEU_CLIENT_SECRET'
}`

const exemploConta = `${exemploHeaders}

const response = await fetch('${baseUrl}/api/v1/conta', {
  method: 'GET',
  headers
})

const data = await response.json()
console.log(data)`

const exemploConsultaCpf = `${exemploHeaders}

const response = await fetch('${baseUrl}/api/v1/contas/verificar-cpf', {
  method: 'POST',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({ cpf: '529.982.247-25' })
})
if (!response.ok) throw new Error('Consulta de CPF indisponível ou não autorizada')
const data = await response.json()
console.log(data.possui_conta) // true ou false, sem dados pessoais`

const exemploSaldo = `${exemploHeaders}

const response = await fetch('${baseUrl}/api/v1/saldo', {
  method: 'GET',
  headers
})

const data = await response.json()
console.log(data.saldo)`

const exemploMovimentacoes = `${exemploHeaders}

const response = await fetch('${baseUrl}/api/v1/movimentacoes', {
  method: 'GET',
  headers
})

const data = await response.json()
console.log(data.movimentacoes)`

const exemploMovimentacoesPeriodo = `${exemploHeaders}

const parametros = new URLSearchParams({
  data_inicio: '2026-09-01',
  data_fim: '2026-09-15'
})

const response = await fetch(
  '${baseUrl}/api/v1/movimentacoes?' + parametros,
  { method: 'GET', headers }
)

const data = await response.json()
console.log(data.movimentacoes)`

const exemploResumo = `${exemploHeaders}

const response = await fetch('${baseUrl}/api/v1/resumo-financeiro', {
  method: 'GET',
  headers
})

const data = await response.json()
console.log('Receitas:', data.total_receitas)
console.log('Despesas:', data.total_despesas)
console.log('Saldo do período:', data.saldo_periodo)`

const exemploResumoPeriodo = `${exemploHeaders}

const parametros = new URLSearchParams({
  data_inicio: '2026-09-01',
  data_fim: '2026-09-15'
})

const response = await fetch(
  '${baseUrl}/api/v1/resumo-financeiro?' + parametros,
  { method: 'GET', headers }
)

const data = await response.json()
console.log(data)`

const exemploCriarCobranca = `${exemploHeaders}

const response = await fetch('${baseUrl}/api/v1/cobrancas/pix', {
  method: 'POST',
  headers: {
    ...headers,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ valor: 125.50 })
})

const data = await response.json()
console.log('ID:', data.id_cobranca)
console.log('Código Pix:', data.codigo_pagamento)`

const exemploConsultarCobranca = `${exemploHeaders}

const idCobranca = 123

const response = await fetch(
  '${baseUrl}/api/v1/cobrancas/pix/' + encodeURIComponent(idCobranca),
  { method: 'GET', headers }
)

const data = await response.json()

if (data.status === 1) {
  console.log('Pagamento confirmado')
}`

const exemploQrLivre = `${exemploHeaders}

const response = await fetch('${baseUrl}/api/v1/cobrancas/pix/qrcode', {
  method: 'POST',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({ valor_livre: true })
})
const pix = await response.json()
if (!response.ok) throw new Error(pix.mensagem)
// Guarde o ID e entregue a imagem SVG ao seu frontend.
console.log(pix.id_cobranca, pix.codigo_pagamento, pix.qr_code_svg)`

const dadosBoleto = {
  documento_pagador: '52998224725',
  valor: 125.50,
  data_vencimento: '2026-11-10',
}

const dadosVenda = {
  numero_cartao: '2481000000000001',
  validade: '09/2031',
  cvv: '082',
  valor: 100,
  tipo: 'CREDITO',
  parcelas: 3,
}

const exemploBoleto = `${exemploHeaders}

const response = await fetch('${baseUrl}/api/v1/cobrancas/boletos', {
  method: 'POST',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify(${JSON.stringify(dadosBoleto, null, 2)})
})
const boleto = await response.json()
if (!response.ok) throw new Error(boleto.mensagem)
console.log(boleto.id_cobranca, boleto.codigo_pagamento, boleto.url_pdf)`

const exemploVenda = `${exemploHeaders}

const response = await fetch('${baseUrl}/api/v1/vendas/cartao', {
  method: 'POST',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify(${JSON.stringify(dadosVenda, null, 2)})
})
const venda = await response.json()
if (!response.ok) throw new Error(venda.mensagem)
console.log(venda.aprovado, venda.id_compra, venda.valor_recebido)`

const exemploPdfBoleto = `// No servidor Node.js, usando as mesmas credenciais.
import { writeFile } from 'node:fs/promises'

${exemploHeaders}
const idCobranca = 123
const response = await fetch('${baseUrl}/api/v1/cobrancas/boletos/' + idCobranca + '/pdf', { headers })
if (!response.ok) throw new Error((await response.json()).mensagem)
await writeFile('boleto.pdf', Buffer.from(await response.arrayBuffer()))`

const respostaBoleto = JSON.stringify({
  mensagem: 'Boleto criado com sucesso', id_cobranca: 123,
  id_pagador: 12, id_recebedor: 9, valor: 125.50, data_vencimento: '2026-11-10',
  codigo_pagamento: '2480000000123', status: 0, tipo_cobranca: 0,
  url_pdf: '/api/v1/cobrancas/boletos/123/pdf',
}, null, 2)

const respostaVenda = JSON.stringify({
  aprovado: true, mensagem: 'Venda aprovada',
  id_compra: 456, id_movimentacao: 789, valor: 100, valor_recebido: 95, taxa: 5,
  tipo: 'CREDITO', parcelas: 3, final_cartao: '0001', data_compra: '2026-10-19T10:30:00',
}, null, 2)

const exemploErros = `const response = await fetch('${baseUrl}/api/v1/saldo', { headers })
const data = await response.json()

if (!response.ok) {
  console.error(data.mensagem || 'Não foi possível concluir a requisição')
  return
}

console.log(data)`

const respostaConta = `{
  "id_conta": 9,
  "numero_conta": "00012345",
  "agencia": "0001",
  "banco": "Arkhé",
  "tipo_conta": 1,
  "nome": "Empresa Exemplo"
}`

const respostaSaldo = `{
  "saldo": 5250.75
}`

const respostaMovimentacoes = `{
  "data_inicio": "2026-09-01",
  "data_fim": "2026-09-15",
  "movimentacoes": [
    {
      "id_movimentacao": 53,
      "id_pagador": 12,
      "nome_pagador": "João da Silva",
      "id_recebedor": 9,
      "nome_recebedor": "Empresa Exemplo",
      "nome_contraparte": "João da Silva",
      "valor": 350.00,
      "data_movimentacao": "2026-09-15 09:43:10",
      "id_cobranca": null,
      "tipo_cobranca": null,
      "tipo": "entrada",
      "origem": "pix"
    }
  ]
}`

const respostaResumo = `{
  "data_inicio": "2026-09-01",
  "data_fim": "2026-09-15",
  "total_receitas": 8500.00,
  "total_despesas": 3240.50,
  "saldo_periodo": 5259.50
}`

const respostaCobranca = `{
  "id_cobranca": 123,
  "valor": 125.50,
  "codigo_pagamento": "ARKHEPIX:EXEMPLO123",
  "status": 0,
  "tipo_cobranca": 1
}`

const respostaConsultaCobranca = `{
  "id_cobranca": 123,
  "id_recebedor": 9,
  "valor": 125.50,
  "codigo_pagamento": "ARKHEPIX:EXEMPLO123",
  "status": 1,
  "tipo_cobranca": 1
}`

const endpoints = [
  ['endpoint-conta', 'Conta'],
  ['endpoint-consulta-cpf', 'Verificar CPF (restrito)'],
  ['endpoint-saldo', 'Saldo'],
  ['endpoint-movimentacoes', 'Movimentações'],
  ['endpoint-resumo', 'Resumo financeiro'],
  ['endpoint-criar-cobranca', 'Criar cobrança Pix'],
  ['endpoint-consultar-cobranca', 'Consultar cobrança Pix'],
  ['endpoint-gerar-qrcode', 'Gerar QR Code Pix'],
  ['endpoint-criar-boleto', 'Emitir boleto'],
  ['endpoint-consultar-boleto', 'Consultar boleto e PDF'],
  ['endpoint-venda-cartao', 'Venda com cartão virtual'],
  ['repeticao-pedidos', 'Pedidos repetidos'],
]

function BlocoCodigo({ titulo, codigo }) {
  const [copiado, setCopiado] = useState(false)
  const temporizadorRef = useRef(null)

  useEffect(() => () => {
    if (temporizadorRef.current) clearTimeout(temporizadorRef.current)
  }, [])

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
      if (temporizadorRef.current) clearTimeout(temporizadorRef.current)
      temporizadorRef.current = setTimeout(() => setCopiado(false), 1800)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <div className="bloco-codigo-api">
      <header><span>{titulo}</span><button type="button" aria-label={`Copiar exemplo ${titulo}`} onClick={copiar}>{copiado ? 'Copiado' : 'Copiar'}</button></header>
      <pre tabIndex="0"><code>{codigo}</code></pre>
      <span className="feedback-codigo-api" aria-live="polite">{copiado ? 'Exemplo copiado.' : ''}</span>
    </div>
  )
}

function CabecalhoEndpoint({ metodo, caminho, children }) {
  return (
    <header className="cabecalho-endpoint-api">
      <div><span className={`metodo-api ${metodo.toLowerCase()}`}>{metodo}</span><code>{caminho}</code></div>
      <p>{children}</p>
    </header>
  )
}

export default function DocumentacaoApi() {
  return (
    <div className="pagina-documentacao-api" id="documentacao-api">
      <section className="hero-documentacao-api">
        <div className="conteudo-documentacao-api">
          <p>DESENVOLVEDORES</p>
          <h1>API Arkhé</h1>
          <span>Integre seu sistema à infraestrutura financeira do Arkhé.</span>
          <div className="base-url-api"><small>BASE URL</small><code>{baseUrl}</code></div>
        </div>
      </section>

      <div className="conteudo-documentacao-api layout-documentacao-api">
        <aside className="menu-documentacao-api">
          <nav aria-label="Seções da documentação">
            <a href="#introducao">Introdução</a>
            <a href="#autenticacao">Autenticação</a>
            <a href="#endpoints">Endpoints</a>
            <a href="#erros-api">Erros da API</a>
            <a href="#boas-praticas">Boas práticas</a>
          </nav>
        </aside>

        <div className="conteudo-principal-documentacao-api">
          <section id="introducao" className="secao-documentacao-api" aria-labelledby="titulo-introducao-api">
            <p className="rotulo-documentacao-api">VISÃO GERAL</p>
            <h2 id="titulo-introducao-api">Integração para contas empresariais</h2>
            <p>A API Arkhé permite que sistemas autorizados por uma conta PJ consultem informações financeiras, emitam cobranças Pix e boletos e recebam vendas com cartões virtuais Arkhé.</p>
            <div className="nota-documentacao-api"><strong>Antes de começar</strong><span>Crie uma integração na conta PJ e salve o Client ID e o Client Secret exibidos.</span></div>
            <p>Boletos e cartões funcionam entre contas do próprio Arkhé. A conta recebedora vem das credenciais da integração.</p>
            <p><a href="/arkhe-api.postman_collection.json" download>Baixar coleção do Postman</a> · <a href="/exemplo-integracao-arkhe.py" download>Baixar exemplo Python</a></p>
          </section>

          <section id="autenticacao" className="secao-documentacao-api" aria-labelledby="titulo-autenticacao-api">
            <p className="rotulo-documentacao-api">AUTENTICAÇÃO</p>
            <h2 id="titulo-autenticacao-api">Credenciais em todas as requisições</h2>
            <p>Todas as rotas externas da API exigem o Client ID e o Client Secret da integração nos headers abaixo.</p>
            <BlocoCodigo titulo="JavaScript" codigo={exemploHeaders} />
            <p className="alerta-seguranca-api"><strong>Nunca exponha o Client Secret no frontend público.</strong> Faça as chamadas à API pelo servidor do sistema integrado.</p>
          </section>

          <section id="endpoints" className="secao-documentacao-api" aria-labelledby="titulo-endpoints-api">
            <p className="rotulo-documentacao-api">REFERÊNCIA</p>
            <h2 id="titulo-endpoints-api">Endpoints disponíveis</h2>
            <nav className="atalhos-endpoints-api" aria-label="Endpoints da API">
              {endpoints.map(([id, rotulo]) => <a href={`#${id}`} key={id}>{rotulo}</a>)}
            </nav>

            <article className="endpoint-api" id="endpoint-conta">
              <CabecalhoEndpoint metodo="GET" caminho="/api/v1/conta">Retorna os dados da conta PJ vinculada à integração.</CabecalhoEndpoint>
              <div className="detalhes-endpoint-api">
                <h3>Exemplo JavaScript</h3>
                <BlocoCodigo titulo="JavaScript" codigo={exemploConta} />
                <h3>Exemplo de resposta</h3>
                <BlocoCodigo titulo="JSON" codigo={respostaConta} />
              </div>
            </article>

            <article className="endpoint-api" id="endpoint-consulta-cpf">
              <CabecalhoEndpoint metodo="POST" caminho="/api/v1/contas/verificar-cpf">Consulta restrita: informa somente se um CPF válido está vinculado a uma conta Arkhé.</CabecalhoEndpoint>
              <div className="detalhes-endpoint-api">
                <p className="alerta-seguranca-api"><strong>Permissão especial obrigatória.</strong> Por proteção dos dados pessoais, credenciais PJ comuns não podem consultar livremente CPFs de terceiros. O administrador precisa aprovar explicitamente o Client ID na configuração <code>ARKHE_API_CONSULTA_CPF_CLIENT_IDS</code>.</p>
                <p>Faça a consulta exclusivamente no servidor da integração, com finalidade legítima e base apropriada para tratar esse CPF. Não utilize em cadastros públicos ou para descobrir indiscriminadamente quem é cliente.</p>
                <h3>Corpo da requisição</h3>
                <BlocoCodigo titulo="JSON" codigo={'{ "cpf": "529.982.247-25" }'} />
                <h3>Exemplo JavaScript (servidor)</h3>
                <BlocoCodigo titulo="JavaScript" codigo={exemploConsultaCpf} />
                <h3>Resposta de exemplo</h3>
                <BlocoCodigo titulo="JSON" codigo={'{ "possui_conta": true }'} />
                <p><code>true</code> significa que existe pelo menos uma conta vinculada ao CPF; <code>false</code>, nenhuma. Não significa que a conta esteja ativa. Não são retornados nome, saldo, número da conta nem informações pessoais.</p>
                <p>Erros: <code>400</code> CPF inválido, <code>401</code> credenciais ausentes/incorretas, <code>403</code> integração sem permissão especial, <code>429</code> excesso de consultas e <code>503</code> Redis indisponível. Limites: 10/minuto por integração e 20/dia por CPF, entre integrações autorizadas.</p>
              </div>
            </article>

            <article className="endpoint-api" id="endpoint-saldo">
              <CabecalhoEndpoint metodo="GET" caminho="/api/v1/saldo">Retorna o saldo atual da conta vinculada à integração.</CabecalhoEndpoint>
              <div className="detalhes-endpoint-api">
                <h3>Exemplo JavaScript</h3>
                <BlocoCodigo titulo="JavaScript" codigo={exemploSaldo} />
                <h3>Exemplo de resposta</h3>
                <BlocoCodigo titulo="JSON" codigo={respostaSaldo} />
              </div>
            </article>

            <article className="endpoint-api" id="endpoint-movimentacoes">
              <CabecalhoEndpoint metodo="GET" caminho="/api/v1/movimentacoes">Retorna as movimentações da conta.</CabecalhoEndpoint>
              <div className="detalhes-endpoint-api">
                <p>Sem datas, a API consulta automaticamente do primeiro dia do mês atual até hoje.</p>
                <h3>Parâmetros opcionais</h3>
                <dl>
                  <div><dt>data_inicio</dt><dd>Data inicial no formato YYYY-MM-DD.</dd></div>
                  <div><dt>data_fim</dt><dd>Data final no formato YYYY-MM-DD.</dd></div>
                </dl>
                <h3>Exemplo sem período</h3>
                <BlocoCodigo titulo="JavaScript" codigo={exemploMovimentacoes} />
                <h3>Exemplo com período</h3>
                <BlocoCodigo titulo="JavaScript" codigo={exemploMovimentacoesPeriodo} />
                <h3>Exemplo de resposta</h3>
                <BlocoCodigo titulo="JSON" codigo={respostaMovimentacoes} />
                <h3>Campos da movimentação</h3>
                <dl>
                  <div><dt>tipo</dt><dd><code>entrada</code> ou <code>saida</code>.</dd></div>
                  <div><dt>origem</dt><dd><code>pix</code>, <code>pix_qrcode</code> ou <code>boleto</code>.</dd></div>
                  <div><dt>nome_pagador</dt><dd>Nome da conta que realizou o pagamento.</dd></div>
                  <div><dt>nome_recebedor</dt><dd>Nome da conta que recebeu o pagamento.</dd></div>
                  <div><dt>nome_contraparte</dt><dd>Nome da outra parte da movimentação, facilitando o uso no frontend integrador.</dd></div>
                </dl>
              </div>
            </article>

            <article className="endpoint-api" id="endpoint-resumo">
              <CabecalhoEndpoint metodo="GET" caminho="/api/v1/resumo-financeiro">Retorna receitas, despesas e saldo do período.</CabecalhoEndpoint>
              <div className="detalhes-endpoint-api">
                <p>Sem datas, a API considera automaticamente do primeiro dia do mês atual até hoje.</p>
                <h3>Parâmetros opcionais</h3>
                <dl>
                  <div><dt>data_inicio</dt><dd>Data inicial no formato YYYY-MM-DD.</dd></div>
                  <div><dt>data_fim</dt><dd>Data final no formato YYYY-MM-DD.</dd></div>
                </dl>
                <h3>Exemplo sem período</h3>
                <BlocoCodigo titulo="JavaScript" codigo={exemploResumo} />
                <h3>Exemplo com período</h3>
                <BlocoCodigo titulo="JavaScript" codigo={exemploResumoPeriodo} />
                <h3>Exemplo de resposta</h3>
                <BlocoCodigo titulo="JSON" codigo={respostaResumo} />
              </div>
            </article>

            <article className="endpoint-api" id="endpoint-criar-cobranca">
              <CabecalhoEndpoint metodo="POST" caminho="/api/v1/cobrancas/pix">Cria uma cobrança Pix para a conta vinculada à integração.</CabecalhoEndpoint>
              <div className="detalhes-endpoint-api">
                <h3>Body</h3>
                <BlocoCodigo titulo="JSON" codigo={'{\n  "valor": 125.50\n}'} />
                <h3>Exemplo JavaScript</h3>
                <BlocoCodigo titulo="JavaScript" codigo={exemploCriarCobranca} />
                <h3>Exemplo de resposta</h3>
                <BlocoCodigo titulo="JSON" codigo={respostaCobranca} />
                <p>O <code>codigo_pagamento</code> identifica a cobrança e pode ser usado pelo sistema integrado para gerar o QR Code do Pix Arkhé.</p>
                <div className="status-cobranca-docs"><span><b>0</b> Pendente</span><span><b>1</b> Pago</span></div>
              </div>
            </article>

            <article className="endpoint-api" id="endpoint-consultar-cobranca">
              <CabecalhoEndpoint metodo="GET" caminho="/api/v1/cobrancas/pix/{id_cobranca}">Consulta os dados e o status de uma cobrança Pix criada pela integração.</CabecalhoEndpoint>
              <div className="detalhes-endpoint-api">
                <h3>Parâmetro de rota</h3>
                <dl><div><dt>id_cobranca</dt><dd>Identificador retornado na criação da cobrança.</dd></div></dl>
                <h3>Exemplo JavaScript</h3>
                <BlocoCodigo titulo="JavaScript" codigo={exemploConsultarCobranca} />
                <h3>Exemplo de resposta</h3>
                <BlocoCodigo titulo="JSON" codigo={respostaConsultaCobranca} />
                <div className="status-cobranca-docs"><span><b>0</b> Pendente</span><span><b>1</b> Pago</span></div>
              </div>
            </article>

            <article className="endpoint-api" id="endpoint-gerar-qrcode">
              <CabecalhoEndpoint metodo="POST" caminho="/api/v1/cobrancas/pix/qrcode">Gera a imagem de um QR Code Pix Arkhé com valor fixo ou escolhido por quem paga.</CabecalhoEndpoint>
              <div className="detalhes-endpoint-api">
                <dl>
                  <div><dt>valor_livre</dt><dd>Envie <code>true</code> para a pessoa informar o valor ao pagar no Arkhé. O campo <code>valor</code> não é necessário.</dd></div>
                  <div><dt>valor</dt><dd>Para definir a quantia antes de gerar, envie somente <code>{'{ "valor": 125.50 }'}</code>.</dd></div>
                  <div><dt>qr_code_svg</dt><dd>A resposta contém a imagem SVG pronta para exibir ou salvar, além do código Pix Copia e Cola.</dd></div>
                </dl>
                <BlocoCodigo titulo="Gerar QR Code com valor livre" codigo={exemploQrLivre} />
                <BlocoCodigo titulo="Resposta do QR Code" codigo={JSON.stringify({ id_cobranca: 124, codigo_pagamento: 'ARKHEPIX:EXEMPLO124', valor: null, valor_livre: true, qr_code_svg: '<svg ...>...</svg>', status: 0, tipo_cobranca: 1 }, null, 2)} />
                <p>Quem escaneia escolhe o valor, confere o recebedor e confirma o pagamento no Arkhé. O QR Code vale para um pagamento. Depois de pago, gere outro para um novo recebimento.</p>
                <p>Consulte <code>/api/v1/cobrancas/pix/{'{id_cobranca}'}</code> para acompanhar. Após o pagamento, a consulta informa <code>status: 1</code> e o valor efetivamente pago. A geração também funciona na rota Pix anterior e não movimenta dinheiro.</p>
              </div>
            </article>

            <article className="endpoint-api" id="endpoint-criar-boleto">
              <CabecalhoEndpoint metodo="POST" caminho="/api/v1/cobrancas/boletos">Emite um boleto para uma conta Arkhé, identificada pelo CPF ou CNPJ do pagador.</CabecalhoEndpoint>
              <div className="detalhes-endpoint-api">
                <dl>
                  <div><dt>documento_pagador</dt><dd>CPF da conta PF ou CNPJ da conta PJ. Aceita documento com ou sem pontuação.</dd></div>
                  <div><dt>valor</dt><dd>Valor positivo em reais, com ponto para os centavos.</dd></div>
                  <div><dt>data_vencimento</dt><dd>Data YYYY-MM-DD, igual ou posterior a hoje.</dd></div>
                </dl>
                <BlocoCodigo titulo="Emitir boleto no servidor JavaScript" codigo={exemploBoleto} />
                <BlocoCodigo titulo="Resposta da emissão" codigo={respostaBoleto} />
                <p>A emissão retorna <code>201</code>. O boleto aparece na conta pagadora e pode ser pago pelo fluxo normal do Arkhé. Emitir não significa que o pagamento já aconteceu.</p>
                <p>Guarde o <code>id_cobranca</code> no pedido do seu sistema. Um boleto pendente com o mesmo pagador, recebedor, valor e vencimento impede outra emissão igual: a API retorna <code>409</code> com o ID do boleto existente.</p>
              </div>
            </article>

            <article className="endpoint-api" id="endpoint-consultar-boleto">
              <CabecalhoEndpoint metodo="GET" caminho="/api/v1/cobrancas/boletos/{id_cobranca}">Consulta o estado atual do boleto da conta vinculada à integração.</CabecalhoEndpoint>
              <div className="detalhes-endpoint-api">
                <p>Use os mesmos headers. O campo <code>status</code> informa <code>0</code> para pendente e <code>1</code> para pago.</p>
                <CabecalhoEndpoint metodo="GET" caminho="/api/v1/cobrancas/boletos/{id_cobranca}/pdf">Baixa o PDF do boleto com autenticação da integração.</CabecalhoEndpoint>
                <p>O PDF exige as credenciais nos headers. Abra-o pelo seu servidor ou entregue o arquivo ao cliente; o endereço isolado não concede acesso.</p>
                <BlocoCodigo titulo="Baixar PDF no servidor Node.js" codigo={exemploPdfBoleto} />
              </div>
            </article>

            <article className="endpoint-api" id="endpoint-venda-cartao">
              <CabecalhoEndpoint metodo="POST" caminho="/api/v1/vendas/cartao">Recebe uma venda com o cartão virtual Arkhé do comprador.</CabecalhoEndpoint>
              <div className="detalhes-endpoint-api">
                <dl>
                  <div><dt>numero_cartao</dt><dd>Número do cartão virtual Arkhé, com 16 dígitos.</dd></div>
                  <div><dt>validade / cvv</dt><dd>Validade MM/YYYY e CVV como texto com 3 dígitos, preservando zeros à esquerda. Não envie o PIN pessoal.</dd></div>
                  <div><dt>valor</dt><dd>Valor total positivo em reais. Cada parcela deve ter pelo menos um centavo.</dd></div>
                  <div><dt>tipo</dt><dd><code>DEBITO</code> ou <code>CREDITO</code>. O padrão é débito.</dd></div>
                  <div><dt>parcelas</dt><dd>Uma parcela no débito; de 1 a 15 no crédito. O padrão é 1.</dd></div>
                </dl>
                <p>No débito, o comprador precisa de saldo e o vendedor recebe o valor integral. No crédito, o limite é conferido sobre o valor integral, o comprador recebe as parcelas na fatura e o vendedor recebe 95%, com desconto de 5%.</p>
                <BlocoCodigo titulo="Receber venda no servidor JavaScript" codigo={exemploVenda} />
                <BlocoCodigo titulo="Resposta da venda" codigo={respostaVenda} />
                <p>Cartões bloqueados, vencidos, com dados inválidos ou sem saldo/limite são recusados. A resposta devolve somente os quatro últimos dígitos do cartão.</p>
                <p>Guarde <code>id_compra</code>, <code>id_movimentacao</code> e o resultado junto ao pedido do seu sistema. Os recebimentos aparecem na consulta de movimentações da conta.</p>
              </div>
            </article>

            <article className="endpoint-api" id="repeticao-pedidos">
              <div className="detalhes-endpoint-api">
                <h3>Pedidos repetidos e falhas de conexão</h3>
                <p>Se a conexão cair depois do envio, a operação pode ter sido aprovada. Confira o boleto ou o recebimento nas movimentações antes de enviar uma nova cobrança. Desative a repetição automática de POST no seu sistema.</p>
                <p>No cartão, uma venda com o mesmo cartão, vendedor, valor, modalidade e número de parcelas nos últimos cinco minutos retorna <code>409</code>, com código <code>VENDA_SEMELHANTE_RECENTE</code>. Isso também bloqueia duas vendas legítimas iguais nesse intervalo. Depois dos cinco minutos, o mesmo envio pode gerar uma nova cobrança.</p>
                <p>No boleto, a resposta <code>409</code> com código <code>BOLETO_PENDENTE_EXISTENTE</code> inclui <code>id_cobranca</code> para consulta. Duas cobranças pendentes iguais também ficam bloqueadas enquanto houver uma pendente.</p>
                <p>Não há referência externa persistida nem garantia de envio único por pedido. O sistema integrado deve controlar seus pedidos e guardar os IDs retornados. Uma operação concorrente também pode retornar <code>409</code>; confira o resultado antes de tentar novamente.</p>
              </div>
            </article>
          </section>

          <section id="erros-api" className="secao-documentacao-api" aria-labelledby="titulo-erros-api">
            <p className="rotulo-documentacao-api">RESPOSTAS DE ERRO</p>
            <h2 id="titulo-erros-api">Erros da API</h2>
            <p>Verifique sempre o status HTTP antes de utilizar os dados da resposta.</p>
            <dl className="lista-erros-api">
              <div><dt>400</dt><dd>Requisição inválida.</dd></div>
              <div><dt>401</dt><dd>Credenciais ausentes ou inválidas.</dd></div>
              <div><dt>403</dt><dd>Integração sem permissão ou desativada.</dd></div>
              <div><dt>404</dt><dd>Recurso não encontrado.</dd></div>
              <div><dt>409</dt><dd>Boleto pendente igual, venda semelhante recente ou operação concorrente. Confira o resultado antes de enviar novamente.</dd></div>
              <div><dt>500</dt><dd>Erro interno.</dd></div>
              <div><dt>503</dt><dd>Configuração de liquidação ou regra de parcelas indisponível.</dd></div>
            </dl>
            <h3>Tratamento básico</h3>
            <BlocoCodigo titulo="JavaScript" codigo={exemploErros} />
          </section>

          <section id="boas-praticas" className="secao-documentacao-api" aria-labelledby="titulo-boas-praticas-api">
            <p className="rotulo-documentacao-api">SEGURANÇA</p>
            <h2 id="titulo-boas-praticas-api">Boas práticas</h2>
            <ul className="boas-praticas-api">
              <li>Não exponha o Client Secret no navegador.</li>
              <li>Mantenha as credenciais no servidor do sistema integrado.</li>
              <li>Use HTTPS em todas as comunicações.</li>
              <li>Não coloque credenciais em repositórios públicos.</li>
              <li>Cada integração pertence a uma única conta PJ.</li>
              <li>Guarde os IDs retornados junto ao pedido e confira o recebimento antes de repetir uma cobrança após falha de conexão.</li>
              <li>Não registre CVV, PIN ou dados completos do cartão em logs ou no cadastro de pedidos do seu sistema.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
