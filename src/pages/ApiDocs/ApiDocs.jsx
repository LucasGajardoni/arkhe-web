import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import arkheLogo from '../../assets/arkhe-logo.svg'
import { API_URL } from '../../config/api.js'
import './ApiDocs.css'

const baseUrl = API_URL.replace(/\/+$/, '')

const exemploHeaders = `X-Client-ID: SEU_CLIENT_ID
X-Client-Secret: SEU_CLIENT_SECRET`

const exemploSaldo = `curl -X GET \\
  "${baseUrl}/api/v1/saldo" \\
  -H "X-Client-ID: SEU_CLIENT_ID" \\
  -H "X-Client-Secret: SEU_CLIENT_SECRET"`

const exemploPix = `curl -X POST \\
  "${baseUrl}/api/v1/cobrancas/pix" \\
  -H "Content-Type: application/json" \\
  -H "X-Client-ID: SEU_CLIENT_ID" \\
  -H "X-Client-Secret: SEU_CLIENT_SECRET" \\
  -d '{"valor":80}'`

const exemploJavaScript = `const resposta = await fetch("${baseUrl}/api/v1/saldo", {
  headers: {
    "X-Client-ID": process.env.ARKHE_CLIENT_ID,
    "X-Client-Secret": process.env.ARKHE_CLIENT_SECRET
  }
})

const saldo = await resposta.json()`

const respostaCobranca = `{
  "id_cobranca": 57,
  "valor": 80.0,
  "codigo_pagamento": "ARKHEPIX:...",
  "status": 0,
  "tipo_cobranca": 1
}`

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

export default function ApiDocs() {
  return (
    <div className="pagina-documentacao-api">
      <header className="topo-documentacao-api">
        <div className="conteudo-documentacao-api barra-documentacao-api">
          <Link to="/" className="marca-documentacao-api" aria-label="Banco Arkhé — página inicial">
            <span><img src={arkheLogo} alt="" /></span><strong>ARKHÉ</strong>
          </Link>
          <nav aria-label="Ações da documentação">
            <a href="#endpoints">Endpoints</a>
            <Link to="/login">Acessar conta</Link>
          </nav>
        </div>
      </header>

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
            <a href="#exemplos">Exemplos</a>
            <a href="#boas-praticas">Boas práticas</a>
          </nav>
        </aside>

        <main className="conteudo-principal-documentacao-api">
          <section id="introducao" className="secao-documentacao-api" aria-labelledby="titulo-introducao-api">
            <p className="rotulo-documentacao-api">VISÃO GERAL</p>
            <h2 id="titulo-introducao-api">Integração para contas empresariais</h2>
            <p>A API Arkhé permite que sistemas autorizados por uma conta PJ consultem informações financeiras e criem cobranças Pix internas.</p>
            <div className="nota-documentacao-api"><strong>Antes de começar</strong><span>Crie uma integração na conta PJ e salve o Client ID e o Client Secret exibidos.</span></div>
          </section>

          <section id="autenticacao" className="secao-documentacao-api" aria-labelledby="titulo-autenticacao-api">
            <p className="rotulo-documentacao-api">AUTENTICAÇÃO</p>
            <h2 id="titulo-autenticacao-api">Credenciais em todas as requisições</h2>
            <p>Envie as credenciais da integração nos headers abaixo.</p>
            <BlocoCodigo titulo="Headers" codigo={exemploHeaders} />
            <p className="alerta-seguranca-api"><strong>Nunca exponha o Client Secret no frontend público.</strong> Faça as chamadas à API pelo servidor do sistema integrado.</p>
          </section>

          <section id="endpoints" className="secao-documentacao-api" aria-labelledby="titulo-endpoints-api">
            <p className="rotulo-documentacao-api">REFERÊNCIA</p>
            <h2 id="titulo-endpoints-api">Endpoints disponíveis</h2>

            <article className="endpoint-api">
              <CabecalhoEndpoint metodo="GET" caminho="/api/v1/conta">Retorna informações da conta vinculada à integração.</CabecalhoEndpoint>
            </article>

            <article className="endpoint-api">
              <CabecalhoEndpoint metodo="GET" caminho="/api/v1/saldo">Retorna o saldo atual da conta.</CabecalhoEndpoint>
            </article>

            <article className="endpoint-api">
              <CabecalhoEndpoint metodo="GET" caminho="/api/v1/movimentacoes">Retorna as movimentações da conta.</CabecalhoEndpoint>
              <div className="detalhes-endpoint-api">
                <h3>Parâmetros opcionais</h3>
                <dl>
                  <div><dt>data_inicio</dt><dd>Data inicial no formato AAAA-MM-DD.</dd></div>
                  <div><dt>data_fim</dt><dd>Data final no formato AAAA-MM-DD.</dd></div>
                </dl>
                <code className="exemplo-rota-api">GET /api/v1/movimentacoes?data_inicio=2026-09-01&amp;data_fim=2026-09-30</code>
              </div>
            </article>

            <article className="endpoint-api">
              <CabecalhoEndpoint metodo="POST" caminho="/api/v1/cobrancas/pix">Cria uma cobrança Pix para a conta vinculada.</CabecalhoEndpoint>
              <div className="detalhes-endpoint-api">
                <h3>Body</h3>
                <BlocoCodigo titulo="JSON" codigo={'{\n  "valor": 80\n}'} />
                <h3>Resposta</h3>
                <BlocoCodigo titulo="JSON" codigo={respostaCobranca} />
                <p>O <code>codigo_pagamento</code> identifica a cobrança e pode ser usado pelo sistema integrado para gerar o QR Code do Pix Arkhé.</p>
              </div>
            </article>

            <article className="endpoint-api">
              <CabecalhoEndpoint metodo="GET" caminho="/api/v1/cobrancas/pix/:id_cobranca">Consulta uma cobrança Pix criada pela própria conta.</CabecalhoEndpoint>
              <div className="detalhes-endpoint-api">
                <h3>Resposta pendente</h3>
                <BlocoCodigo titulo="JSON" codigo={respostaCobranca} />
                <div className="status-cobranca-docs"><span><b>0</b> Pendente</span><span><b>1</b> Pago</span></div>
              </div>
            </article>
          </section>

          <section id="exemplos" className="secao-documentacao-api" aria-labelledby="titulo-exemplos-api">
            <p className="rotulo-documentacao-api">EXEMPLOS</p>
            <h2 id="titulo-exemplos-api">Chamadas básicas</h2>
            <h3>Consultar saldo com curl</h3>
            <BlocoCodigo titulo="curl" codigo={exemploSaldo} />
            <h3>Criar cobrança Pix com curl</h3>
            <BlocoCodigo titulo="curl" codigo={exemploPix} />
            <h3>Consultar saldo com JavaScript</h3>
            <BlocoCodigo titulo="JavaScript — execute no servidor" codigo={exemploJavaScript} />
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
        </main>
      </div>

      <footer className="rodape-documentacao-api"><div className="conteudo-documentacao-api"><strong>Banco Arkhé</strong><span>Documentação da API para integrações empresariais.</span></div></footer>
    </div>
  )
}
