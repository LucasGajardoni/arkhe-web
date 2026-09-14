import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ModalDetalhesBoleto from '../../components/Boleto/ModalDetalhesBoleto.jsx'
import ModalEmissaoBoleto from '../../components/Boleto/ModalEmissaoBoleto.jsx'
import ModalPagarBoleto from '../../components/Boleto/ModalPagarBoleto.jsx'
import CabecalhoDashboard from '../../components/Dashboard/CabecalhoDashboard.jsx'
import Icone from '../../components/Dashboard/Icone.jsx'
import ModalPerfil from '../../components/Dashboard/ModalPerfil.jsx'
import NavegacaoMobile from '../../components/Dashboard/NavegacaoMobile.jsx'
import { useMovimentacoes } from '../../hooks/useMovimentacoes.js'
import { useSessao } from '../../hooks/useSessao.js'
import { encerrarSessao } from '../../services/authService.js'
import { formatarDataBrasileira } from '../../utils/formatadores.js'
import '../Dashboard/Dashboard.css'
import './Boletos.css'

const LIMITE_INICIAL = 12
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
  if (cobrancaPaga(cobranca)) return { texto: 'Pago', classe: 'pago', prioridade: 2 }
  if (cobrancaVencida(cobranca)) return { texto: 'Vencido', classe: 'vencido', prioridade: 1 }
  return { texto: 'Pendente', classe: 'pendente', prioridade: 0 }
}

function ordenarCobrancas(a, b) {
  const situacaoA = situacaoCobranca(a)
  const situacaoB = situacaoCobranca(b)
  if (situacaoA.prioridade !== situacaoB.prioridade) {
    return situacaoA.prioridade - situacaoB.prioridade
  }

  const dataA = somenteData(a.data_vencimento)
  const dataB = somenteData(b.data_vencimento)
  if (situacaoA.classe === 'pago') return dataB.localeCompare(dataA)
  return dataA.localeCompare(dataB)
}

function nomeRelacionado(cobranca, contaPJ) {
  if (contaPJ) {
    return cobranca.nome_pagador
      || cobranca.pagador?.nome_fantasia
      || cobranca.pagador?.razao_social
      || cobranca.pagador?.nome
      || (cobranca.id_pagador != null ? `Conta pagadora #${cobranca.id_pagador}` : 'Pagador não informado')
  }

  return cobranca.nome_recebedor
    || cobranca.recebedor?.nome_fantasia
    || cobranca.recebedor?.razao_social
    || cobranca.recebedor?.nome
    || (cobranca.id_recebedor != null ? `Conta recebedora #${cobranca.id_recebedor}` : 'Beneficiário não informado')
}

export default function Boletos() {
  const navigate = useNavigate()
  const { perfil, atualizarPerfil, limparSessao } = useSessao()
  const contaPJ = perfil.tipoConta === 'PJ'
  const dados = useMovimentacoes()
  const [filtro, setFiltro] = useState(contaPJ ? 'todos' : 'pendentes')
  const [limite, setLimite] = useState(LIMITE_INICIAL)
  const [boletoSelecionado, setBoletoSelecionado] = useState(null)
  const [pagamentoAberto, setPagamentoAberto] = useState(false)
  const [emissaoAberta, setEmissaoAberta] = useState(false)
  const [perfilAberto, setPerfilAberto] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const [erroSessao, setErroSessao] = useState('')
  const tipoCobranca = contaPJ ? 'receber' : 'pagar'

  const cobrancas = useMemo(() => dados.cobrancas
    .filter((item) => item.tipo === tipoCobranca)
    .sort(ordenarCobrancas), [dados.cobrancas, tipoCobranca])

  const resumo = useMemo(() => {
    const pagas = cobrancas.filter(cobrancaPaga)
    const pendentes = cobrancas.filter((item) => !cobrancaPaga(item))
    const vencidas = cobrancas.filter(cobrancaVencida)
    const somar = (lista) => lista.reduce((total, item) => total + (Number(item.valor) || 0), 0)

    return {
      quantidade: cobrancas.length,
      quantidadePagas: pagas.length,
      quantidadePendentes: pendentes.length,
      quantidadeVencidas: vencidas.length,
      totalEmitido: somar(cobrancas),
      totalPago: somar(pagas),
      totalPendente: somar(pendentes),
    }
  }, [cobrancas])

  const lista = useMemo(() => cobrancas.filter((item) => {
    if (filtro === 'todos') return true
    if (filtro === 'pagos') return cobrancaPaga(item)
    if (filtro === 'vencidos') return cobrancaVencida(item)
    if (filtro === 'pendentes') return !cobrancaPaga(item) && !cobrancaVencida(item)
    return true
  }), [cobrancas, filtro])
  const listaVisivel = lista.slice(0, limite)
  const restantes = Math.max(0, lista.length - listaVisivel.length)
  const dadosDisponiveis = !dados.carregando && !dados.erro

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

  function valorResumo(valor) {
    return dadosDisponiveis ? moeda.format(valor) : '—'
  }

  const filtros = [['todos', 'Todos'], ['pendentes', 'Pendentes'], ['vencidos', 'Vencidos'], ['pagos', contaPJ ? 'Recebidos' : 'Pagos']]

  return (
    <div className="pagina-dashboard pagina-boletos">
      <CabecalhoDashboard usuario={perfil} secao="boletos" abrirPerfil={() => setPerfilAberto(true)} sair={sair} />

      <main className="conteudo-dashboard-largo corpo-boletos">
        {erroSessao && <p className="mensagem-sessao-dashboard" role="alert">{erroSessao}</p>}

        <header className="cabecalho-boletos">
          <div>
            <p>{contaPJ ? 'COBRANÇAS EMPRESARIAIS' : 'PAGAMENTOS'}</p>
            <h1>{contaPJ ? 'Cobranças emitidas' : 'Boletos a pagar'}</h1>
            <span>
              {contaPJ
                ? 'Emita boletos e acompanhe o que sua empresa tem a receber.'
                : 'Veja os boletos vinculados à sua conta ou pague outro pelo código.'}
            </span>
          </div>
          <div className="acoes-cabecalho-boletos">
            <button className="atualizar" type="button" onClick={dados.carregar} disabled={dados.carregando}>
              {dados.carregando ? 'Atualizando...' : 'Atualizar'}
            </button>
            <button
              className="pagar"
              type="button"
              onClick={() => (contaPJ ? setEmissaoAberta(true) : setPagamentoAberto(true))}
            >
              <Icone nome={contaPJ ? 'mais' : 'boleto'} tamanho={17} />
              {contaPJ ? 'Emitir boleto' : 'Pagar boleto'}
            </button>
          </div>
        </header>

        {contaPJ ? (
          <section className="resumo-boletos resumo-pj-boletos" aria-label="Resumo das cobranças" aria-busy={dados.carregando}>
            <div><small>Total emitido</small><strong>{valorResumo(resumo.totalEmitido)}</strong></div>
            <div><small>Total recebido</small><strong className="recebido">{valorResumo(resumo.totalPago)}</strong></div>
            <div><small>Total pendente</small><strong>{valorResumo(resumo.totalPendente)}</strong></div>
            <div><small>Boletos emitidos</small><strong>{dadosDisponiveis ? resumo.quantidade : '—'}</strong></div>
          </section>
        ) : (
          <section className="resumo-boletos" aria-label="Resumo dos boletos" aria-busy={dados.carregando}>
            <div><small>Boletos pendentes</small><strong>{dadosDisponiveis ? resumo.quantidadePendentes : '—'}</strong></div>
            <div><small>Total a pagar</small><strong>{valorResumo(resumo.totalPendente)}</strong></div>
            <div><small>Boletos vencidos</small><strong className={resumo.quantidadeVencidas ? 'vencido' : ''}>{dadosDisponiveis ? resumo.quantidadeVencidas : '—'}</strong></div>
          </section>
        )}

        <section className="painel-boletos" aria-busy={dados.carregando}>
          <header>
            <div>
              <p>{contaPJ ? 'ACOMPANHAMENTO' : 'DDA'}</p>
              <h2>{contaPJ ? 'Histórico de emissões' : 'Boletos encontrados'}</h2>
            </div>
            <div className="filtros-boletos" aria-label="Filtrar boletos">
              {filtros.map(([valor, rotulo]) => (
                <button
                  className={filtro === valor ? 'ativo' : ''}
                  type="button"
                  key={valor}
                  aria-pressed={filtro === valor}
                  onClick={() => {
                    setFiltro(valor)
                    setLimite(LIMITE_INICIAL)
                  }}
                >
                  {rotulo}
                </button>
              ))}
            </div>
          </header>

          {dados.carregando && <p className="estado-boletos" role="status">Buscando boletos...</p>}
          {!dados.carregando && dados.erro && (
            <div className="estado-boletos erro" role="alert">
              <p>{dados.erro}</p>
              <button type="button" onClick={dados.carregar}>Tentar novamente</button>
            </div>
          )}
          {dadosDisponiveis && lista.length === 0 && (
            <div className="estado-boletos">
              <p>Nenhum boleto encontrado neste filtro.</p>
              {!contaPJ && filtro !== 'pendentes' && (
                <button type="button" onClick={() => setFiltro('pendentes')}>Ver pendentes</button>
              )}
            </div>
          )}

          {dadosDisponiveis && listaVisivel.length > 0 && (
            <div className="lista-boletos">
              {listaVisivel.map((boleto, indice) => {
                const situacao = situacaoCobranca(boleto)
                const vencimento = somenteData(boleto.data_vencimento)
                const relacionado = nomeRelacionado(boleto, contaPJ)
                const rotuloSituacao = contaPJ && situacao.classe === 'pago' ? 'Recebido' : situacao.texto

                return (
                  <article className={situacao.classe} key={boleto.id_cobranca || `${vencimento}-${indice}`}>
                    <button
                      type="button"
                      onClick={() => setBoletoSelecionado(boleto)}
                      aria-label={`${relacionado}, ${moeda.format(Number(boleto.valor) || 0)}, vencimento ${vencimento ? formatarDataBrasileira(vencimento) : 'não informado'}, ${rotuloSituacao}`}
                    >
                      <span className="icone-lista-boleto"><Icone nome="boleto" /></span>
                      <span className="identificacao-lista-boleto">
                        <small>{contaPJ ? 'PAGADOR' : 'BENEFICIÁRIO'}</small>
                        <strong>{relacionado}</strong>
                        <em>Cobrança #{boleto.id_cobranca}</em>
                      </span>
                      <span className="vencimento-lista-boleto">
                        <small>Vencimento</small>
                        <strong>{vencimento ? formatarDataBrasileira(vencimento) : 'Não informado'}</strong>
                      </span>
                      <span className="valor-lista-boleto">{moeda.format(Number(boleto.valor) || 0)}</span>
                      <span className={`status-boleto ${situacao.classe}`}>{rotuloSituacao}</span>
                      <Icone nome="seta" tamanho={16} />
                    </button>
                  </article>
                )
              })}
            </div>
          )}

          {dadosDisponiveis && restantes > 0 && (
            <button className="mostrar-mais-boletos" type="button" onClick={() => setLimite((atual) => atual + LIMITE_INICIAL)}>
              Mostrar mais {Math.min(restantes, LIMITE_INICIAL)} boletos
            </button>
          )}
        </section>
      </main>

      <NavegacaoMobile secao="boletos" tipoConta={perfil.tipoConta} />

      {perfilAberto && <ModalPerfil usuario={perfil} fechar={() => setPerfilAberto(false)} aoAtualizar={atualizarPerfil} />}

      {boletoSelecionado && (
        <ModalDetalhesBoleto
          boleto={boletoSelecionado}
          usuario={perfil}
          contaPJ={contaPJ}
          nomeRelacionado={nomeRelacionado(boletoSelecionado, contaPJ)}
          situacao={situacaoCobranca(boletoSelecionado)}
          idMovimentacao={dados.movimentacoes.find((item) => (
            item.tipo === 'saida'
            && item.origem === 'cobranca'
            && Number(item.id_cobranca) === Number(boletoSelecionado.id_cobranca)
          ))?.id_movimentacao}
          fechar={() => setBoletoSelecionado(null)}
          atualizar={dados.carregar}
        />
      )}

      {!contaPJ && pagamentoAberto && (
        <ModalPagarBoleto usuario={perfil} fechar={() => setPagamentoAberto(false)} atualizar={dados.carregar} />
      )}

      {contaPJ && emissaoAberta && (
        <ModalEmissaoBoleto
          usuario={perfil}
          fechar={() => setEmissaoAberta(false)}
          aoConcluir={dados.carregar}
        />
      )}
    </div>
  )
}
