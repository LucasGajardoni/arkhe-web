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
  ['endpoint-saldo', 'Saldo'],
  ['endpoint-movimentacoes', 'Movimentações'],
  ['endpoint-resumo', 'Resumo financeiro'],
  ['endpoint-criar-cobranca', 'Criar cobrança Pix'],
  ['endpoint-consultar-cobranca', 'Consultar cobrança Pix'],
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
            <p>A API Arkhé permite que sistemas autorizados por uma conta PJ consultem informações financeiras e criem cobranças Pix internas.</p>
            <div className="nota-documentacao-api"><strong>Antes de começar</strong><span>Crie uma integração na conta PJ e salve o Client ID e o Client Secret exibidos.</span></div>
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
              <div><dt>500</dt><dd>Erro interno.</dd></div>
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
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
