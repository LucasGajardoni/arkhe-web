import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import CabecalhoDashboard from '../../components/Dashboard/CabecalhoDashboard.jsx'
import Icone from '../../components/Dashboard/Icone.jsx'
import ModalPerfil from '../../components/Dashboard/ModalPerfil.jsx'
import NavegacaoMobile from '../../components/Dashboard/NavegacaoMobile.jsx'
import ModalNovaIntegracao from '../../components/Integracoes/ModalNovaIntegracao.jsx'
import { useSessao } from '../../hooks/useSessao.js'
import { encerrarSessao } from '../../services/authService.js'
import { listarIntegracoes } from '../../services/integracoesService.js'
import DocumentacaoApi from '../ApiDocs/ApiDocs.jsx'
import '../Dashboard/Dashboard.css'
import './Integracoes.css'

const exemplos = [
  ['ERP', 'Conecte a gestão financeira da empresa.'],
  ['Sistema de caixa', 'Consulte saldo e movimentações.'],
  ['Sistema de gestão', 'Acompanhe cobranças Pix.'],
  ['E-commerce', 'Crie cobranças Pix pelo servidor.'],
]

const recursos = [
  'Consultar dados da conta e saldo',
  'Consultar movimentações por período',
  'Criar cobranças Pix Arkhé',
  'Consultar o status das cobranças Pix',
]

function extrairIntegracoes(resultado) {
  const lista = [
    resultado,
    resultado?.integracoes,
    resultado?.data,
    resultado?.dados,
    resultado?.data?.integracoes,
    resultado?.dados?.integracoes,
  ].find(Array.isArray) || []

  return lista.filter((integracao) => integracao && typeof integracao === 'object').map((integracao) => ({
    id: integracao.id_integracao ?? integracao.id,
    nome: integracao.nome ?? integracao.nome_integracao,
    client_id: integracao.client_id ?? integracao.clientId,
    status: integracao.status,
    ativo: integracao.ativo,
    ultimo_uso: integracao.ultimo_uso ?? integracao.ultimo_uso_em ?? integracao.data_ultimo_uso,
    criado_em: integracao.criado_em ?? integracao.created_at ?? integracao.data_criacao,
  }))
}

function formatarStatus(integracao) {
  if (integracao.status !== undefined && integracao.status !== null && integracao.status !== '') {
    if (typeof integracao.status === 'boolean') return integracao.status ? 'Ativa' : 'Inativa'
    return String(integracao.status)
  }
  if (integracao.ativo !== undefined && integracao.ativo !== null) return integracao.ativo ? 'Ativa' : 'Inativa'
  return ''
}

function formatarData(valor) {
  if (!valor) return ''
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return String(valor)
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(data)
}

function obterDatas(integracao) {
  return { ultimoUso: formatarData(integracao.ultimo_uso), criacao: formatarData(integracao.criado_em) }
}

export default function Integracoes() {
  const navigate = useNavigate()
  const { perfil, atualizarPerfil, limparSessao } = useSessao()
  const [modalAberto, setModalAberto] = useState(false)
  const [perfilAberto, setPerfilAberto] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const [erroSessao, setErroSessao] = useState('')
  const [integracoes, setIntegracoes] = useState([])
  const [carregandoIntegracoes, setCarregandoIntegracoes] = useState(true)
  const [erroIntegracoes, setErroIntegracoes] = useState('')
  const [clientIdCopiado, setClientIdCopiado] = useState('')
  const [erroCopia, setErroCopia] = useState('')
  const temporizadorCopiaRef = useRef(null)

  const carregarIntegracoes = useCallback(async () => {
    setCarregandoIntegracoes(true)
    setErroIntegracoes('')
    try {
      const resultado = await listarIntegracoes()
      setIntegracoes(extrairIntegracoes(resultado))
    } catch (erro) {
      setErroIntegracoes(erro.message || 'Não foi possível carregar as integrações.')
    } finally {
      setCarregandoIntegracoes(false)
    }
  }, [])

  useEffect(() => {
    if (perfil.tipoConta !== 'PJ') return undefined
    let paginaAtiva = true

    listarIntegracoes()
      .then((resultado) => {
        if (paginaAtiva) setIntegracoes(extrairIntegracoes(resultado))
      })
      .catch((erro) => {
        if (paginaAtiva) setErroIntegracoes(erro.message || 'Não foi possível carregar as integrações.')
      })
      .finally(() => {
        if (paginaAtiva) setCarregandoIntegracoes(false)
      })

    return () => { paginaAtiva = false }
  }, [perfil.tipoConta])

  useEffect(() => () => {
    if (temporizadorCopiaRef.current) clearTimeout(temporizadorCopiaRef.current)
  }, [])

  if (perfil.tipoConta !== 'PJ') return <Navigate to="/dashboard" replace />

  async function sair() {
    if (saindo) return
    setSaindo(true)
    setErroSessao('')
    try {
      await encerrarSessao()
      limparSessao()
      navigate('/login', { replace: true })
    } catch (erro) {
      setErroSessao(erro.message || 'Não foi possível sair da conta.')
    } finally {
      setSaindo(false)
    }
  }

  async function copiarClientId(clientId) {
    try {
      await navigator.clipboard.writeText(clientId)
      setErroCopia('')
      setClientIdCopiado(clientId)
      if (temporizadorCopiaRef.current) clearTimeout(temporizadorCopiaRef.current)
      temporizadorCopiaRef.current = setTimeout(() => setClientIdCopiado(''), 1800)
    } catch {
      setErroCopia('Não foi possível copiar o Client ID. Selecione o texto e copie manualmente.')
    }
  }

  return (
    <div className="pagina-dashboard pagina-integracoes">
      <CabecalhoDashboard usuario={perfil} secao="integracoes" abrirPerfil={() => setPerfilAberto(true)} sair={sair} />

      <main>
        {erroSessao && <p className="mensagem-sessao-dashboard" role="alert">{erroSessao}</p>}

        <section className="hero-integracoes">
          <div className="orbita-dashboard orbita-um" />
          <div className="conteudo-dashboard-largo hero-integracoes-conteudo">
            <div>
              <p>CONTA EMPRESARIAL</p>
              <h1>Integrações e API</h1>
              <span>Conecte sistemas externos à sua conta Arkhé com credenciais próprias.</span>
            </div>
            <button className="botao botao-principal" type="button" onClick={() => setModalAberto(true)}>
              <Icone nome="mais" tamanho={18} /> Nova integração
            </button>
          </div>
        </section>

        <div className="conteudo-dashboard-largo corpo-integracoes">
          <section className="introducao-integracoes" aria-labelledby="titulo-conectar-sistemas">
            <div>
              <p>API ARKHÉ</p>
              <h2 id="titulo-conectar-sistemas">Conecte as ferramentas da sua empresa</h2>
              <span>Autorize sistemas a consultar informações da conta e criar cobranças Pix usando a API Arkhé.</span>
            </div>
            <button type="button" onClick={() => document.getElementById('documentacao-api')?.scrollIntoView({ behavior: 'smooth' })}>
              Ver documentação da API <Icone nome="seta" tamanho={16} />
            </button>
          </section>

          <section className="integracoes-autorizadas" aria-labelledby="titulo-integracoes-autorizadas">
            <header>
              <div>
                <p>INTEGRAÇÕES AUTORIZADAS</p>
                <h2 id="titulo-integracoes-autorizadas">Integrações existentes</h2>
              </div>
              {integracoes.length > 0 && <span>{integracoes.length} {integracoes.length === 1 ? 'integração' : 'integrações'}</span>}
            </header>

            {carregandoIntegracoes && integracoes.length === 0 && <p className="estado-integracoes">Carregando integrações...</p>}

            {!carregandoIntegracoes && erroIntegracoes && (
              <div className="estado-integracoes erro" role="alert">
                <span>{erroIntegracoes}</span>
                <button type="button" onClick={carregarIntegracoes}>Tentar novamente</button>
              </div>
            )}

            {!carregandoIntegracoes && !erroIntegracoes && integracoes.length === 0 && (
              <p className="estado-integracoes">Nenhuma integração autorizada nesta conta.</p>
            )}

            {erroCopia && <p className="erro-copia-integracao" role="alert">{erroCopia}</p>}

            {integracoes.length > 0 && (
              <div className="lista-integracoes">
                {integracoes.map((integracao, indice) => {
                  const clientId = String(integracao.client_id || '')
                  const status = formatarStatus(integracao)
                  const { ultimoUso, criacao } = obterDatas(integracao)
                  const chave = integracao.id ?? clientId

                  return (
                    <article className="cartao-integracao" key={chave || indice}>
                      <header>
                        <div>
                          <small>NOME DA INTEGRAÇÃO</small>
                          <h3>{integracao.nome || 'Integração sem nome'}</h3>
                        </div>
                        {status && <span className="status-integracao">{status}</span>}
                      </header>

                      <div className="client-id-integracao-existente">
                        <div><small>CLIENT ID</small><code>{clientId || 'Não informado'}</code></div>
                        {clientId && (
                          <button type="button" onClick={() => copiarClientId(clientId)}>
                            {clientIdCopiado === clientId ? 'Copiado' : 'Copiar Client ID'}
                          </button>
                        )}
                      </div>

                      <div className="secret-integracao-existente">
                        <div><small>CLIENT SECRET</small><code aria-label="Client Secret oculto">••••••••••••••••</code></div>
                        <span>Por segurança, o secret não pode ser visualizado novamente.</span>
                      </div>

                      {(ultimoUso || criacao) && (
                        <dl className="datas-integracao">
                          {ultimoUso && <div><dt>Último uso</dt><dd>{ultimoUso}</dd></div>}
                          {criacao && <div><dt>Criada em</dt><dd>{criacao}</dd></div>}
                        </dl>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          <section className="exemplos-integracoes" aria-label="Exemplos de sistemas integrados">
            {exemplos.map(([nome, descricao]) => (
              <article key={nome}>
                <span><Icone nome="api" tamanho={21} /></span>
                <div><strong>{nome}</strong><small>{descricao}</small></div>
              </article>
            ))}
          </section>

          <div className="grade-integracoes">
            <section className="recursos-api-integracoes">
              <header><p>RECURSOS ATUAIS</p><h2>O que a integração pode fazer</h2></header>
              <ul>{recursos.map((recurso) => <li key={recurso}>{recurso}</li>)}</ul>
              <p className="nota-recursos-integracoes">As permissões são definidas pela API atual e não podem ser personalizadas nesta versão.</p>
            </section>

            <aside className="seguranca-integracoes">
              <span><Icone nome="chave" tamanho={26} /></span>
              <p>CLIENT SECRET</p>
              <h2>Guarde a credencial com segurança</h2>
              <span>O Client Secret aparece somente ao criar a integração. Ele não será armazenado pelo frontend nem poderá ser consultado novamente.</span>
              <button type="button" onClick={() => setModalAberto(true)}>Autorizar um sistema <Icone nome="seta" tamanho={15} /></button>
            </aside>
          </div>
        </div>

        <DocumentacaoApi />
      </main>

      <NavegacaoMobile secao="integracoes" tipoConta={perfil.tipoConta} />
      {perfilAberto && <ModalPerfil usuario={perfil} fechar={() => setPerfilAberto(false)} aoAtualizar={atualizarPerfil} />}
      {modalAberto && <ModalNovaIntegracao fechar={() => setModalAberto(false)} aoCriar={carregarIntegracoes} />}
    </div>
  )
}
