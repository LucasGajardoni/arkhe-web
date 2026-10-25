import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CabecalhoDashboard from '../../components/Dashboard/CabecalhoDashboard.jsx'
import ModalPerfil from '../../components/Dashboard/ModalPerfil.jsx'
import NavegacaoMobile from '../../components/Dashboard/NavegacaoMobile.jsx'
import { useSessao } from '../../hooks/useSessao.js'
import { cancelarAgendamento, listarAgendamentos } from '../../services/agendamentosService.js'
import { encerrarSessao } from '../../services/authService.js'
import '../Dashboard/Dashboard.css'
import './Agendamentos.css'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const filtros = [
  ['TODOS', 'Todos'],
  ['AGENDADO', 'Pendentes'],
  ['CONCLUIDO', 'Concluídos'],
  ['CANCELADO', 'Cancelados'],
  ['FALHOU', 'Falharam'],
]
const rotulosTipo = {
  TRANSFERENCIA: 'Pix / transferência',
  PIX_COBRANCA: 'Pagamento Pix',
  BOLETO: 'Pagamento de boleto',
}
const rotulosStatus = {
  AGENDADO: 'Pendente',
  EXECUTANDO: 'Em execução',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
  FALHOU: 'Falhou',
}
const dataHoraSp = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
})

function dataLegivel(valor) {
  if (!valor) return 'Data não disponível'
  const iso = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(valor) ? valor : `${valor}-03:00`
  const data = new Date(iso)
  return Number.isNaN(data.getTime()) ? 'Data não disponível' : dataHoraSp.format(data)
}

export default function Agendamentos() {
  const navigate = useNavigate()
  const { perfil, atualizarPerfil, limparSessao, tratarErroSessao } = useSessao()
  const [novoAberto, setNovoAberto] = useState(false)
  const [itens, setItens] = useState([])
  const [filtro, setFiltro] = useState('TODOS')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [cancelando, setCancelando] = useState(null)
  const [confirmarCancelamento, setConfirmarCancelamento] = useState(null)
  const [perfilAberto, setPerfilAberto] = useState(false)
  const [saindo, setSaindo] = useState(false)

  const carregar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarregando(true)
    setErro('')
    try {
      const resposta = await listarAgendamentos()
      setItens(Array.isArray(resposta.agendamentos) ? resposta.agendamentos : [])
    } catch (falha) {
      if (falha.status === 401 || falha.status === 403) {
        tratarErroSessao?.(falha)
      }
      setErro(falha.message || 'Não foi possível carregar os agendamentos.')
    } finally {
      if (!silencioso) setCarregando(false)
    }
  }, [tratarErroSessao])

  useEffect(() => {
    carregar()
    const intervalo = window.setInterval(() => carregar(true), 30000)
    return () => window.clearInterval(intervalo)
  }, [carregar])

  const visiveis = useMemo(() => (
    filtro === 'TODOS' ? itens : itens.filter((item) => item.status === filtro)
  ), [filtro, itens])

  async function sair() {
    if (saindo) return
    setSaindo(true)
    try {
      await encerrarSessao()
      limparSessao()
      navigate('/login', { replace: true })
    } catch (falha) {
      setErro(falha.message || 'Não foi possível encerrar a sessão.')
    } finally {
      setSaindo(false)
    }
  }

  async function cancelar(item) {
    setCancelando(item.id_agendamento)
    setErro('')
    setSucesso('')
    try {
      await cancelarAgendamento(item.id_agendamento)
      setSucesso('Agendamento cancelado. Nenhum valor foi movimentado.')
      setConfirmarCancelamento(null)
      await carregar(true)
    } catch (falha) {
      setErro(falha.message || 'Não foi possível cancelar o agendamento.')
    } finally {
      setCancelando(null)
    }
  }

  return (
    <div className="pagina-dashboard pagina-agendamentos">
      <CabecalhoDashboard usuario={perfil} secao="agendamentos" abrirPerfil={() => setPerfilAberto(true)} sair={sair} />
      <main className="corpo-agendamentos conteudo-dashboard-largo">
        <header className="cabecalho-agendamentos">
          <div>
            <p>OPERAÇÕES PROGRAMADAS</p>
            <h1>Agendamentos</h1>
            <span>Confira o que está programado para sua conta.</span>
          </div>
          <div className="acoes-cabecalho-agendamentos">
            <button
              className="botao-novo-agendamento"
              type="button"
              aria-expanded={novoAberto}
              aria-controls="opcoes-novo-agendamento"
              onClick={() => setNovoAberto((aberto) => !aberto)}
            >
              <span aria-hidden="true">＋</span> Novo agendamento
            </button>
            <button type="button" onClick={() => carregar()} disabled={carregando}>Atualizar</button>
          </div>
        </header>

        {novoAberto && (
          <section className="opcoes-novo-agendamento" id="opcoes-novo-agendamento" aria-label="Escolha o tipo de agendamento">
            <button
              type="button"
              onClick={() => navigate('/dashboard/pix', { state: { iniciarAgendamento: true } })}
            >
              <span className="opcao-agendamento-icone" aria-hidden="true">↗</span>
              <span><strong>Pix</strong><small>Agende um Pix ou transferência</small></span>
              <span aria-hidden="true">›</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/boletos', { state: { iniciarAgendamento: true } })}
            >
              <span className="opcao-agendamento-icone" aria-hidden="true">▤</span>
              <span><strong>Boleto</strong><small>Informe o código no fluxo de pagamento</small></span>
              <span aria-hidden="true">›</span>
            </button>
          </section>
        )}

        <section className="aviso-agendamentos">
          <strong>Sem débito antecipado</strong>
          <p>Saldo, permissões e limites são verificados novamente na data programada. Horários em São Paulo.</p>
        </section>

        <nav className="filtros-agendamentos" aria-label="Filtrar agendamentos">
          {filtros.map(([valor, rotulo]) => (
            <button key={valor} type="button" className={filtro === valor ? 'ativo' : ''} aria-pressed={filtro === valor} onClick={() => setFiltro(valor)}>{rotulo}</button>
          ))}
        </nav>

        {erro && <p className="mensagem-agendamentos erro" role="alert">{erro}</p>}
        {sucesso && <p className="mensagem-agendamentos sucesso" role="status">{sucesso}</p>}

        {carregando ? <div className="estado-agendamentos">Carregando agendamentos…</div>
          : visiveis.length === 0 ? (
            <div className="estado-agendamentos">
              <span aria-hidden="true">◷</span>
              <strong>Nenhum agendamento {filtro === 'TODOS' ? 'ainda' : 'nesta situação'}</strong>
              <p>Quando você programar um Pix ou pagamento, ele aparecerá aqui.</p>
            </div>
          ) : (
            <section className="lista-agendamentos" aria-label="Agendamentos da conta">
              {visiveis.map((item) => (
                <article className={`cartao-agendamento status-${item.status.toLowerCase()}`} key={item.id_agendamento}>
                  <div className="cartao-agendamento-icone" aria-hidden="true">◷</div>
                  <div className="cartao-agendamento-conteudo">
                    <div className="cartao-agendamento-titulo">
                      <div><small>{rotulosTipo[item.tipo_operacao] || 'Operação'}</small><h2>{item.destinatario || 'Destinatário'}</h2></div>
                      <span className={`selo-agendamento status-${item.status.toLowerCase()}`}>{rotulosStatus[item.status] || item.status}</span>
                    </div>
                    <dl>
                      <div><dt>Valor</dt><dd>{moeda.format(Number(item.valor) || 0)}</dd></div>
                      <div><dt>Data e hora · São Paulo</dt><dd>{dataLegivel(item.data_agendada)}</dd></div>
                      {item.codigo_pagamento && <div><dt>Código</dt><dd>{item.codigo_pagamento}</dd></div>}
                    </dl>
                    {item.motivo_falha && <p className="motivo-falha-agendamento">{item.motivo_falha}</p>}
                    {item.status === 'AGENDADO' && (
                      confirmarCancelamento === item.id_agendamento ? (
                        <div className="confirmar-cancelar-agendamento" role="group" aria-label="Confirmar cancelamento">
                          <span>Cancelar este agendamento?</span>
                          <button type="button" onClick={() => setConfirmarCancelamento(null)} disabled={cancelando === item.id_agendamento}>Manter</button>
                          <button className="perigo" type="button" onClick={() => cancelar(item)} disabled={cancelando === item.id_agendamento}>{cancelando === item.id_agendamento ? 'Cancelando…' : 'Confirmar cancelamento'}</button>
                        </div>
                      ) : (
                        <button className="botao-cancelar-agendamento" type="button" onClick={() => setConfirmarCancelamento(item.id_agendamento)}>Cancelar agendamento</button>
                      )
                    )}
                  </div>
                </article>
              ))}
            </section>
          )}
      </main>
      <NavegacaoMobile secao="agendamentos" tipoConta={perfil?.tipoConta} />
      {perfilAberto && <ModalPerfil usuario={perfil} fechar={() => setPerfilAberto(false)} aoAtualizar={atualizarPerfil} />}
    </div>
  )
}
