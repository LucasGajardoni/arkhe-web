import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CabecalhoDashboard from '../../components/Dashboard/CabecalhoDashboard.jsx'
import ModalPerfil from '../../components/Dashboard/ModalPerfil.jsx'
import NavegacaoMobile from '../../components/Dashboard/NavegacaoMobile.jsx'
import { useSessao } from '../../hooks/useSessao.js'
import { encerrarSessao } from '../../services/authService.js'
import {
  atualizarRecorrencia,
  cancelarRecorrencia,
  listarRecorrencias,
  pausarRecorrencia,
  reativarRecorrencia,
} from '../../services/recorrenciasService.js'
import '../Dashboard/Dashboard.css'
import './Recorrencias.css'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dataHoraSp = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })
const frequencias = { SEMANAL: 'Semanal', QUINZENAL: 'Quinzenal', MENSAL: 'Mensal' }
const tipos = { TRANSFERENCIA: 'Pix / transferência', PIX_COBRANCA: 'Pagamento Pix', BOLETO: 'Pagamento de boleto' }
const status = { ATIVA: 'Ativa', PAUSADA: 'Pausada', CANCELADA: 'Cancelada', FINALIZADA: 'Finalizada', AGENDADO: 'Agendada', EXECUTANDO: 'Em execução', CONCLUIDO: 'Concluída', FALHOU: 'Recusada', CANCELADO: 'Cancelada' }

function formatarData(valor) {
  if (!valor) return 'Sem próximas execuções'
  const texto = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(valor) ? valor : `${valor}-03:00`
  const data = new Date(texto)
  return Number.isNaN(data.getTime()) ? 'Data indisponível' : dataHoraSp.format(data)
}

function inputLocal(valor) {
  if (!valor) return ''
  return String(valor).slice(0, 16)
}

function novoInputLocal() {
  const data = new Date()
  data.setDate(data.getDate() + 1)
  data.setHours(9, 0, 0, 0)
  const pad = (n) => String(n).padStart(2, '0')
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}T${pad(data.getHours())}:${pad(data.getMinutes())}`
}

export default function Recorrencias() {
  const navigate = useNavigate()
  const { perfil, atualizarPerfil, limparSessao, tratarErroSessao } = useSessao()
  const [itens, setItens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [novaAberta, setNovaAberta] = useState(false)
  const [editar, setEditar] = useState(null)
  const [cancelarId, setCancelarId] = useState(null)
  const [processando, setProcessando] = useState(null)
  const [perfilAberto, setPerfilAberto] = useState(false)
  const [saindo, setSaindo] = useState(false)

  const carregar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarregando(true)
    setErro('')
    try {
      const resposta = await listarRecorrencias()
      setItens(Array.isArray(resposta.recorrencias) ? resposta.recorrencias : [])
    } catch (falha) {
      if (falha.status === 401 || falha.status === 403) tratarErroSessao?.(falha)
      setErro(falha.message || 'Não foi possível carregar os pagamentos recorrentes.')
    } finally {
      if (!silencioso) setCarregando(false)
    }
  }, [tratarErroSessao])

  useEffect(() => {
    const inicial = window.setTimeout(() => carregar(), 0)
    const intervalo = window.setInterval(() => carregar(true), 30000)
    return () => {
      window.clearTimeout(inicial)
      window.clearInterval(intervalo)
    }
  }, [carregar])

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

  async function executarAcao(id, acao, operacao) {
    setProcessando(id)
    setErro('')
    setSucesso('')
    try {
      const resposta = await operacao(id)
      setSucesso(resposta.mensagem || 'Recorrência atualizada.')
      setCancelarId(null)
      await carregar(true)
    } catch (falha) {
      setErro(falha.message || `Não foi possível ${acao} a recorrência.`)
    } finally {
      setProcessando(null)
    }
  }

  async function salvarAlteracao(evento) {
    evento.preventDefault()
    if (!editar || processando) return
    const formulario = new FormData(evento.currentTarget)
    const dados = {
      confirmado: formulario.get('confirmado') === 'on',
      frequencia: formulario.get('frequencia'),
      proxima_execucao: formulario.get('proxima_execucao'),
      data_final: formulario.get('tipo_termino') === 'data' ? formulario.get('data_final') : null,
      limite_execucoes: formulario.get('tipo_termino') === 'quantidade' ? Number(formulario.get('limite_execucoes')) : null,
    }
    if (editar.tipo_operacao !== 'BOLETO') dados.valor = formulario.get('valor')
    const novaChave = String(formulario.get('chave_pix') || '').trim()
    if (novaChave) {
      dados.tipo_chave = formulario.get('tipo_chave')
      dados.chave_pix = novaChave
    }
    setProcessando(editar.id_recorrencia)
    setErro('')
    try {
      const resposta = await atualizarRecorrencia(editar.id_recorrencia, dados)
      setSucesso(resposta.mensagem || 'Alterações salvas.')
      setEditar(null)
      await carregar(true)
    } catch (falha) {
      setErro(falha.message || 'Não foi possível alterar a recorrência.')
    } finally {
      setProcessando(null)
    }
  }

  function abrirEdicao(item) {
    setErro('')
    setEditar({
      ...item,
      proxima_execucao_input: inputLocal(item.proxima_execucao) || novoInputLocal(),
      tipo_termino: item.data_final ? 'data' : item.limite_execucoes ? 'quantidade' : 'nunca',
      limite_execucoes: item.limite_execucoes || Math.max(1, Number(item.execucoes_criadas || 0) + 12),
    })
  }

  const ativas = itens.filter((item) => item.status === 'ATIVA' || item.status === 'PAUSADA').length

  return (
    <div className="pagina-dashboard pagina-recorrencias">
      <CabecalhoDashboard usuario={perfil} secao="recorrencias" abrirPerfil={() => setPerfilAberto(true)} sair={sair} />
      <main className="corpo-recorrencias conteudo-dashboard-largo">
        <header className="cabecalho-recorrencias">
          <div>
            <p>OPERAÇÕES AUTOMÁTICAS</p>
            <h1>Pagamentos recorrentes</h1>
            <span>Gerencie autorizações futuras e acompanhe cada parcela.</span>
          </div>
          <div className="acoes-recorrencias">
            <button type="button" className="botao-nova-recorrencia" aria-expanded={novaAberta} onClick={() => setNovaAberta((aberto) => !aberto)}>
              <span aria-hidden="true">＋</span> Nova recorrência
            </button>
            <button type="button" onClick={() => carregar()} disabled={carregando}>Atualizar</button>
          </div>
        </header>

        {novaAberta && (
          <section className="opcoes-nova-recorrencia" aria-label="Escolha um fluxo para criar recorrência">
            <button type="button" onClick={() => navigate('/dashboard/pix', { state: { iniciarRecorrencia: true } })}>
              <strong>Pix ou transferência</strong><small>Escolha a chave e configure as próximas execuções.</small><span aria-hidden="true">›</span>
            </button>
            <button type="button" className="opcao-recorrencia-indisponivel" disabled aria-describedby="aviso-boleto-recorrencia-indisponivel">
              <strong>Pagamento de boleto · indisponível</strong><small id="aviso-boleto-recorrencia-indisponivel">Cada parcela exige uma nova cobrança válida. O boleto atual é de uso único.</small><span aria-hidden="true">×</span>
            </button>
          </section>
        )}

        <section className="resumo-recorrencias">
          <div><small>Regras ativas ou pausadas</small><strong>{carregando ? '…' : ativas}</strong></div>
          <p>Nenhum saldo é movimentado ao criar ou editar uma regra. Cada parcela usa novamente as validações bancárias atuais.</p>
        </section>

        {erro && <p className="mensagem-recorrencias erro" role="alert">{erro}</p>}
        {sucesso && <p className="mensagem-recorrencias sucesso" role="status">{sucesso}</p>}

        {carregando ? <div className="estado-recorrencias">Carregando recorrências…</div>
          : itens.length === 0 ? (
            <div className="estado-recorrencias">
              <span aria-hidden="true">⟳</span>
              <strong>Nenhum pagamento recorrente</strong>
              <p>Crie uma regra a partir de um Pix ou transferência. Recorrência de boleto está indisponível.</p>
              <button type="button" className="botao-nova-recorrencia" onClick={() => setNovaAberta(true)}>Nova recorrência</button>
            </div>
          ) : (
            <section className="lista-recorrencias" aria-label="Regras recorrentes da conta">
              {itens.map((item) => (
                <article className={`cartao-recorrencia status-${item.status.toLowerCase()}`} key={item.id_recorrencia}>
                  <div className="cabecalho-cartao-recorrencia">
                    <div><small>{tipos[item.tipo_operacao] || 'Operação'}</small><h2>{item.destinatario}</h2></div>
                    <span className={`selo-recorrencia status-${item.status.toLowerCase()}`}>{status[item.status] || item.status}</span>
                  </div>
                  <dl className="detalhes-recorrencia">
                    <div><dt>Valor por execução</dt><dd>{moeda.format(Number(item.valor) || 0)}</dd></div>
                    <div><dt>Frequência</dt><dd>{frequencias[item.frequencia] || item.frequencia}</dd></div>
                    <div><dt>Próxima execução</dt><dd>{item.status === 'ATIVA' ? formatarData(item.proxima_execucao) : item.proxima_execucao ? formatarData(item.proxima_execucao) : '—'}</dd></div>
                    <div><dt>Execuções criadas</dt><dd>{item.execucoes_criadas}{item.limite_execucoes ? ` de ${item.limite_execucoes}` : ''}</dd></div>
                    {item.data_final && <div><dt>Data final</dt><dd>{new Date(`${item.data_final}T12:00:00-03:00`).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</dd></div>}
                  </dl>
                  {item.tipo_operacao === 'BOLETO' && <p className="nota-dia-mensal">A modalidade foi desativada. Regras antigas serão pausadas automaticamente e não poderão ser reativadas. Cancele esta regra para encerrar.</p>}
                  {item.frequencia === 'MENSAL' && <p className="nota-dia-mensal">No dia 29, 30 ou 31, meses mais curtos usam o último dia do mês.</p>}

                  <div className="acoes-cartao-recorrencia">
                    {item.tipo_operacao !== 'BOLETO' && (item.status === 'ATIVA' || item.status === 'PAUSADA') && item.proxima_execucao && <button type="button" onClick={() => abrirEdicao(item)}>Editar próximas</button>}
                    {item.status === 'ATIVA' && <button type="button" disabled={processando === item.id_recorrencia} onClick={() => executarAcao(item.id_recorrencia, 'pausar', pausarRecorrencia)}>{processando === item.id_recorrencia ? 'Salvando…' : 'Pausar'}</button>}
                    {item.tipo_operacao !== 'BOLETO' && item.status === 'PAUSADA' && item.proxima_execucao && <button type="button" disabled={processando === item.id_recorrencia} onClick={() => executarAcao(item.id_recorrencia, 'reativar', reativarRecorrencia)}>{processando === item.id_recorrencia ? 'Salvando…' : 'Reativar'}</button>}
                    {(item.status === 'ATIVA' || item.status === 'PAUSADA') && (
                      cancelarId === item.id_recorrencia ? (
                        <div className="confirmar-cancelamento-recorrencia" role="group" aria-label="Confirmar cancelamento da recorrência">
                          <span>Não haverá novas execuções. Cancelar?</span>
                          <button type="button" onClick={() => setCancelarId(null)}>Manter</button>
                          <button className="perigo" type="button" disabled={processando === item.id_recorrencia} onClick={() => executarAcao(item.id_recorrencia, 'cancelar', cancelarRecorrencia)}>{processando === item.id_recorrencia ? 'Cancelando…' : 'Confirmar cancelamento'}</button>
                        </div>
                      ) : <button className="cancelar-recorrencia" type="button" onClick={() => setCancelarId(item.id_recorrencia)}>Cancelar recorrência</button>
                    )}
                  </div>

                  <details className="historico-recorrencia">
                    <summary>Histórico das execuções ({item.execucoes?.length || 0})</summary>
                    {item.execucoes?.length ? (
                      <ol>
                        {item.execucoes.map((execucao) => (
                          <li key={execucao.id_agendamento}>
                            <div><strong>Execução {execucao.numero}</strong><span>{formatarData(execucao.data_prevista)}</span></div>
                            <div><b>{moeda.format(Number(execucao.valor) || 0)}</b><span className={`status-historico status-${String(execucao.status).toLowerCase()}`}>{status[execucao.status] || execucao.status}</span></div>
                            {execucao.motivo_falha && <p>{execucao.motivo_falha}</p>}
                          </li>
                        ))}
                      </ol>
                    ) : <p>Nenhuma parcela foi executada ainda.</p>}
                  </details>
                </article>
              ))}
            </section>
          )}
      </main>

      {editar && (
        <div className="fundo-modal-recorrencia" role="presentation">
          <section className="modal-editar-recorrencia" role="dialog" aria-modal="true" aria-labelledby="titulo-editar-recorrencia">
            <header><div><p>ALTERAÇÃO FUTURA</p><h2 id="titulo-editar-recorrencia">Editar recorrência</h2><span>As parcelas concluídas permanecem iguais.</span></div><button type="button" aria-label="Fechar" onClick={() => setEditar(null)}>×</button></header>
            <form onSubmit={salvarAlteracao}>
              <label>Frequência<select name="frequencia" defaultValue={editar.frequencia}><option value="SEMANAL">Semanal</option><option value="QUINZENAL">Quinzenal</option><option value="MENSAL">Mensal</option></select></label>
              <label>Próxima execução · São Paulo<input name="proxima_execucao" type="datetime-local" min={novoInputLocal()} defaultValue={editar.proxima_execucao_input} required /></label>
              {editar.tipo_operacao === 'TRANSFERENCIA' && <div className="campos-chave-edicao"><label>Tipo da nova chave Pix<select name="tipo_chave" defaultValue="cpf"><option value="cpf">CPF</option><option value="cnpj">CNPJ</option><option value="email">E-mail</option><option value="telefone">Telefone</option><option value="aleatoria">Aleatória</option></select></label><label>Nova chave Pix <small>(deixe em branco para manter)</small><input name="chave_pix" maxLength="160" /></label></div>}
              <label>Valor por execução<input name="valor" type="number" min="0.01" step="0.01" defaultValue={Number(editar.valor).toFixed(2)} disabled={editar.tipo_operacao === 'BOLETO'} required={editar.tipo_operacao !== 'BOLETO'} /></label>
              <fieldset>
                <legend>Encerramento</legend>
                <label><input type="radio" name="tipo_termino" value="nunca" checked={editar.tipo_termino === 'nunca'} onChange={() => setEditar((atual) => ({ ...atual, tipo_termino: 'nunca' }))} /> Sem data final</label>
                <label><input type="radio" name="tipo_termino" value="data" checked={editar.tipo_termino === 'data'} onChange={() => setEditar((atual) => ({ ...atual, tipo_termino: 'data' }))} /> Em uma data</label>
                <input aria-label="Data final" name="data_final" type="date" min={editar.proxima_execucao_input.slice(0, 10)} required={editar.tipo_termino === 'data'} defaultValue={editar.data_final || ''} />
                <label><input type="radio" name="tipo_termino" value="quantidade" checked={editar.tipo_termino === 'quantidade'} onChange={() => setEditar((atual) => ({ ...atual, tipo_termino: 'quantidade' }))} /> Após execuções totais</label>
                <input aria-label="Quantidade total de execuções" name="limite_execucoes" type="number" min={Number(editar.execucoes_criadas || 0) + 1} max="1200" required={editar.tipo_termino === 'quantidade'} defaultValue={editar.limite_execucoes} />
              </fieldset>
              {editar.frequencia === 'MENSAL' && <p className="nota-dia-mensal">Dia 29, 30 ou 31 será ajustado ao último dia dos meses mais curtos.</p>}
              {erro && <p className="mensagem-recorrencias erro" role="alert">{erro}</p>}
              <label className="confirmacao-alteracao-recorrencia"><input type="checkbox" name="confirmado" required /> Autorizo estas alterações para as próximas execuções.</label>
              <footer><button type="button" onClick={() => setEditar(null)} disabled={Boolean(processando)}>Voltar</button><button type="submit" className="botao-nova-recorrencia" disabled={Boolean(processando)}>{processando ? 'Salvando…' : 'Salvar alterações'}</button></footer>
            </form>
          </section>
        </div>
      )}

      <NavegacaoMobile secao="recorrencias" tipoConta={perfil?.tipoConta} />
      {perfilAberto && <ModalPerfil usuario={perfil} fechar={() => setPerfilAberto(false)} aoAtualizar={atualizarPerfil} />}
    </div>
  )
}
