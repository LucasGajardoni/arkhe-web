import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CabecalhoDashboard from '../../components/Dashboard/CabecalhoDashboard.jsx'
import Icone from '../../components/Dashboard/Icone.jsx'
import ModalPerfil from '../../components/Dashboard/ModalPerfil.jsx'
import NavegacaoMobile from '../../components/Dashboard/NavegacaoMobile.jsx'
import ModalDetalhesBoleto from '../../components/Boleto/ModalDetalhesBoleto.jsx'
import ModalPagarBoleto from '../../components/Boleto/ModalPagarBoleto.jsx'
import { useMovimentacoes } from '../../hooks/useMovimentacoes.js'
import { useSessao } from '../../hooks/useSessao.js'
import { encerrarSessao } from '../../services/authService.js'
import { formatarDataBrasileira } from '../../utils/formatadores.js'
import '../Dashboard/Dashboard.css'
import './Boletos.css'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function dataLocalHoje() {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function somenteData(valor) {
  return String(valor || '').slice(0, 10)
}

function cobrancaPaga(cobranca) {
  return Number(cobranca.status) === 1
}

function cobrancaVencida(cobranca) {
  const vencimento = somenteData(cobranca.data_vencimento)
  return !cobrancaPaga(cobranca) && Boolean(vencimento) && vencimento < dataLocalHoje()
}

function situacaoCobranca(cobranca) {
  if (cobrancaPaga(cobranca)) return { texto: 'Pago', classe: 'pago' }
  if (cobrancaVencida(cobranca)) return { texto: 'Vencido', classe: 'vencido' }
  return { texto: 'Pendente', classe: 'pendente' }
}

function nomeRelacionado(cobranca, contaPJ) {
  if (contaPJ) {
    const nome = cobranca.nome_pagador
      || cobranca.pagador?.nome_fantasia
      || cobranca.pagador?.razao_social
      || cobranca.pagador?.nome
    if (nome) return nome
    if (cobranca.id_pagador != null) return `Conta pagadora #${cobranca.id_pagador}`
    return 'Pagador não informado pelo backend'
  }

  const nome = cobranca.nome_recebedor
    || cobranca.recebedor?.nome_fantasia
    || cobranca.recebedor?.razao_social
    || cobranca.recebedor?.nome
  if (nome) return nome
  if (cobranca.id_recebedor != null) return `Conta recebedora #${cobranca.id_recebedor}`
  return 'Recebedor não informado pelo backend'
}

export default function Boletos() {
  const navigate = useNavigate()
  const { perfil, atualizarPerfil, limparSessao } = useSessao()
  const dados = useMovimentacoes()
  const [filtro, setFiltro] = useState('todos')
  const [boletoSelecionado, setBoletoSelecionado] = useState(null)
  const [modoPagarBoleto, setModoPagarBoleto] = useState(null)
  const [perfilAberto, setPerfilAberto] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const [erroSessao, setErroSessao] = useState('')
  const contaPJ = perfil.tipoConta === 'PJ'
  const tipoCobranca = contaPJ ? 'receber' : 'pagar'

  const cobrancas = useMemo(() => dados.cobrancas
    .filter((item) => item.tipo === tipoCobranca)
    .sort((a, b) => somenteData(a.data_vencimento).localeCompare(somenteData(b.data_vencimento))),
  [dados.cobrancas, tipoCobranca])

  const resumo = useMemo(() => {
    const pagas = cobrancas.filter(cobrancaPaga)
    const pendentes = cobrancas.filter((item) => !cobrancaPaga(item))
    const somar = (lista) => lista.reduce((total, item) => total + (Number(item.valor) || 0), 0)

    return {
      quantidade: cobrancas.length,
      quantidadePagas: pagas.length,
      quantidadePendentes: pendentes.length,
      totalEmitido: somar(cobrancas),
      totalPago: somar(pagas),
      totalPendente: somar(pendentes),
    }
  }, [cobrancas])

  const lista = useMemo(() => cobrancas.filter((item) => {
    if (filtro === 'todos') return true
    if (filtro === 'pagos') return cobrancaPaga(item)
    if (filtro === 'vencidos') return cobrancaVencida(item)
    if (filtro === 'pendentes' && contaPJ) return !cobrancaPaga(item) && !cobrancaVencida(item)
    if (filtro === 'pendentes') return !cobrancaPaga(item)
    return true
  }), [cobrancas, contaPJ, filtro])

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

  const filtros = contaPJ
    ? [['todos', 'Todos'], ['pendentes', 'Pendentes'], ['pagos', 'Pagos'], ['vencidos', 'Vencidos']]
    : [['pendentes', 'Pendentes'], ['pagos', 'Pagos'], ['todos', 'Todos']]

  return (
    <div className="pagina-dashboard pagina-boletos">
      <CabecalhoDashboard
        usuario={perfil}
        secao="boletos"
        abrirPerfil={() => setPerfilAberto(true)}
        sair={sair}
      />

      <main className="conteudo-dashboard-largo corpo-boletos">
        {erroSessao && <p className="mensagem-sessao-dashboard" role="alert">{erroSessao}</p>}

        <header className="cabecalho-boletos">
          <div>
            <p>{contaPJ ? 'COBRANÇAS EMPRESARIAIS' : 'PAGAMENTOS'}</p>
            <h1>{contaPJ ? 'Boletos emitidos' : 'DDA e Boletos'}</h1>
            <span>
              {contaPJ
                ? 'Acompanhe as cobranças criadas pela sua empresa.'
                : 'Consulte e pague as cobranças vinculadas à sua conta.'}
            </span>
          </div>
          <div className="acoes-cabecalho-boletos">
            <button className="atualizar" type="button" onClick={dados.carregar} disabled={dados.carregando}>
              {dados.carregando ? 'Atualizando...' : 'Atualizar'}
            </button>
            <button className="codigo" type="button" onClick={() => setModoPagarBoleto('entrada')}>
              Digitar código
            </button>
            <button className="pagar" type="button" onClick={() => setModoPagarBoleto('scanner')}>
              Escanear código
            </button>
          </div>
        </header>

        {contaPJ ? (
          <section className="resumo-boletos resumo-pj-boletos">
            <div><small>Total emitido</small><strong>{moeda.format(resumo.totalEmitido)}</strong></div>
            <div><small>Total recebido</small><strong className="recebido">{moeda.format(resumo.totalPago)}</strong></div>
            <div><small>Total pendente</small><strong>{moeda.format(resumo.totalPendente)}</strong></div>
            <div><small>Boletos emitidos</small><strong>{resumo.quantidade}</strong></div>
          </section>
        ) : (
          <section className="resumo-boletos">
            <div><small>Boletos pendentes</small><strong>{resumo.quantidadePendentes}</strong></div>
            <div><small>Total a pagar</small><strong>{moeda.format(resumo.totalPendente)}</strong></div>
            <div><small>Boletos pagos</small><strong className="recebido">{resumo.quantidadePagas}</strong></div>
          </section>
        )}

        <section className="painel-boletos">
          <header>
            <div>
              <p>{contaPJ ? 'ACOMPANHAMENTO' : 'SUAS COBRANÇAS'}</p>
              <h2>{contaPJ ? 'Histórico de emissões' : 'Boletos encontrados'}</h2>
            </div>
            <div className="filtros-boletos">
              {filtros.map(([valor, rotulo]) => (
                <button
                  className={filtro === valor ? 'ativo' : ''}
                  type="button"
                  key={valor}
                  onClick={() => setFiltro(valor)}
                >
                  {rotulo}
                </button>
              ))}
            </div>
          </header>

          {dados.carregando && <p className="estado-boletos">Buscando boletos...</p>}
          {!dados.carregando && dados.erro && <p className="estado-boletos erro" role="alert">{dados.erro}</p>}
          {!dados.carregando && !dados.erro && lista.length === 0 && (
            <p className="estado-boletos">Nenhum boleto encontrado neste filtro.</p>
          )}

          {!dados.carregando && !dados.erro && lista.length > 0 && (
            <div className="lista-boletos">
              {lista.map((boleto) => {
                const situacao = situacaoCobranca(boleto)
                const vencimento = somenteData(boleto.data_vencimento)

                return (
                  <article key={boleto.id_cobranca}>
                    <button type="button" onClick={() => setBoletoSelecionado(boleto)}>
                      <span className="icone-lista-boleto"><Icone nome="boleto" /></span>
                      <span className="identificacao-lista-boleto">
                        <small>{contaPJ ? 'PAGADOR' : 'RECEBEDOR'}</small>
                        <strong>{nomeRelacionado(boleto, contaPJ)}</strong>
                        <em>Cobrança #{boleto.id_cobranca}</em>
                        {contaPJ && boleto.codigo_pagamento && <em>Código {boleto.codigo_pagamento}</em>}
                      </span>
                      <span className="vencimento-lista-boleto">
                        <small>Vencimento</small>
                        <strong>{vencimento ? formatarDataBrasileira(vencimento) : 'Não informado'}</strong>
                      </span>
                      <span className="valor-lista-boleto">{moeda.format(Number(boleto.valor) || 0)}</span>
                      <span className={`status-boleto ${situacao.classe}`}>{situacao.texto}</span>
                      <Icone nome="seta" tamanho={16} />
                    </button>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>

      <NavegacaoMobile secao="boletos" tipoConta={perfil.tipoConta} />

      {perfilAberto && (
        <ModalPerfil
          usuario={perfil}
          fechar={() => setPerfilAberto(false)}
          aoAtualizar={atualizarPerfil}
        />
      )}

      {boletoSelecionado && (
        <ModalDetalhesBoleto
          boleto={boletoSelecionado}
          usuario={perfil}
          contaPJ={contaPJ}
          nomeRelacionado={nomeRelacionado(boletoSelecionado, contaPJ)}
          situacao={situacaoCobranca(boletoSelecionado)}
          fechar={() => setBoletoSelecionado(null)}
          atualizar={dados.carregar}
        />
      )}

      {modoPagarBoleto && (
        <ModalPagarBoleto
          usuario={perfil}
          modoInicial={modoPagarBoleto}
          fechar={() => setModoPagarBoleto(null)}
          atualizar={dados.carregar}
        />
      )}
    </div>
  )
}
