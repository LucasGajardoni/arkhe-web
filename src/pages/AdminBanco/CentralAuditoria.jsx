import { useCallback, useEffect, useRef, useState } from 'react'
import {
  listarEventosAuditoriaAdmin,
  obterEventoAuditoriaAdmin,
  obterStatusAuditoriaAdmin,
  urlStreamAuditoriaAdmin,
} from '../../services/adminBancoService.js'

const dataHora = (valor) => {
  if (!valor) return '—'
  const data = new Date(String(valor).replace(' ', 'T'))
  return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleString('pt-BR')
}
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const formatarEvento = (valor) => String(valor || '').replaceAll('_', ' ').toLocaleLowerCase('pt-BR')

function DetalheEvento({ evento, fechar }) {
  if (!evento) return null
  const snapshot = (dados) => dados ? JSON.stringify(dados, null, 2) : 'Sem snapshot disponível.'
  return <div className="modal-auditoria-fundo" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) fechar() }}>
    <section className="modal-auditoria" role="dialog" aria-modal="true" aria-labelledby="titulo-detalhe-auditoria">
      <header><div><small>EVENTO #{evento.id_evento}</small><h2 id="titulo-detalhe-auditoria">{formatarEvento(evento.evento)}</h2></div><button type="button" onClick={fechar} aria-label="Fechar detalhes">×</button></header>
      <div className="detalhe-auditoria-grade">
        <p><b>Data e hora</b><span>{dataHora(evento.criado_em)}</span></p>
        <p><b>Resultado</b><span>{evento.resultado || '—'}</span></p>
        <p><b>Operação</b><span>{evento.operacao || '—'} · {evento.tabela_origem || '—'}</span></p>
        <p><b>Registro</b><span>{evento.id_registro ?? '—'}</span></p>
        <p><b>Usuário</b><span>{evento.cadastro?.nome || (evento.id_usuario ? `#${evento.id_usuario}` : 'Não identificado')}{evento.cadastro?.cpf_final ? ` · CPF final ${evento.cadastro.cpf_final}` : ''}{evento.cadastro?.cnpj_final ? ` · CNPJ final ${evento.cadastro.cnpj_final}` : ''}</span></p>
        <p><b>Conta</b><span>{evento.conta ? `${evento.conta.tipo} · conta final ${evento.conta.numero_final || '—'} · #${evento.id_conta}` : (evento.id_conta ? `#${evento.id_conta}` : '—')}</span></p>
        <p><b>Outras contas envolvidas</b><span>{evento.contas_envolvidas?.filter((conta) => conta.id_conta !== evento.id_conta).map((conta) => `${conta.tipo} #${conta.id_conta} · final ${conta.numero_final || '—'} · ${conta.titular || 'titular'}`).join(' · ') || '—'}</span></p>
        <p><b>Outros usuários envolvidos</b><span>{evento.usuarios_envolvidos?.map((usuario) => `${usuario.nome} · ${usuario.cpf_final ? `CPF final ${usuario.cpf_final}` : usuario.cnpj_final ? `CNPJ final ${usuario.cnpj_final}` : `#${usuario.id_usuario}`}`).join(' · ') || '—'}</span></p>
        <p><b>Valor</b><span>{evento.valor == null ? '—' : moeda.format(evento.valor)}</span></p>
        <p><b>Origem</b><span>{evento.origem || '—'}</span></p>
        <p className="detalhe-auditoria-motivo"><b>Motivo</b><span>{evento.motivo || '—'}</span></p>
      </div>
      <div className="snapshots-auditoria"><article><h3>Antes</h3><pre>{snapshot(evento.dados_anteriores)}</pre></article><article><h3>Depois</h3><pre>{snapshot(evento.dados_novos)}</pre></article></div>
      <p className="nota-auditoria-admin">Dados cadastrais são exibidos de forma controlada; segredos de autenticação e códigos de pagamento não fazem parte dos snapshots.</p>
    </section>
  </div>
}

export default function CentralAuditoria() {
  const [eventos, setEventos] = useState([])
  const [status, setStatus] = useState(null)
  const [detalhe, setDetalhe] = useState(null)
  const [filtros, setFiltros] = useState({ evento: '', usuario_id: '', conta_id: '', data_inicio: '', data_fim: '', valor_min: '', valor_max: '', resultado: '', origem: '' })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [aoVivo, setAoVivo] = useState(false)
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null)
  const filtrosRef = useRef(filtros)

  useEffect(() => { filtrosRef.current = filtros }, [filtros])

  const carregarEventos = useCallback(async (filtrosAtuais = filtrosRef.current) => {
    try {
      const [resultado, situacao] = await Promise.all([
        listarEventosAuditoriaAdmin({ ...filtrosAtuais, limite: 100 }),
        obterStatusAuditoriaAdmin().catch((falha) => ({ banco_auditoria: 'indisponivel', redis: 'indisponivel', mensagem: falha.message })),
      ])
      setEventos(resultado.eventos || [])
      setStatus(situacao)
      setErro('')
      setUltimaAtualizacao(new Date())
    } catch (falha) {
      setErro(falha.message || 'Não foi possível consultar a auditoria persistente.')
      setStatus((atual) => atual || { banco_auditoria: 'indisponivel', redis: 'indisponivel' })
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { Promise.resolve().then(() => carregarEventos()) }, [carregarEventos])

  useEffect(() => {
    let origem
    try {
      origem = new EventSource(urlStreamAuditoriaAdmin(), { withCredentials: true })
      origem.onopen = () => setAoVivo(true)
      origem.onerror = () => setAoVivo(false)
      origem.addEventListener('auditoria', () => { carregarEventos() })
    } catch {
      // A atualização periódica continua ativa mesmo se EventSource falhar.
    }
    const recuperacao = window.setInterval(() => carregarEventos(), 30000)
    return () => { origem?.close(); window.clearInterval(recuperacao) }
  }, [carregarEventos])

  async function abrirDetalhe(idEvento) {
    try {
      const resultado = await obterEventoAuditoriaAdmin(idEvento)
      setDetalhe(resultado.evento)
      carregarEventos()
    } catch (falha) {
      setErro(falha.message || 'Não foi possível abrir o detalhe do evento.')
    }
  }

  function atualizar(campo, valor) { setFiltros((atuais) => ({ ...atuais, [campo]: valor })) }

  return <section className="central-auditoria-admin">
    <div className="cabecalho-central-auditoria"><div><small>TRILHA TRANSACIONAL · FIREBIRD + REDIS</small><h2>Central de Auditoria</h2><p>Feed cronológico persistido no Firebird independente, com sinalização ao vivo via Redis.</p></div>
      <div className="estado-live-auditoria"><span className={aoVivo ? 'ponto-live conectado' : 'ponto-live'} />{aoVivo ? 'Ao vivo' : 'Reconectando'}<button type="button" onClick={() => carregarEventos()} disabled={carregando}>Atualizar</button></div>
    </div>
    <div className="indicadores-auditoria">
      <article><small>ARQUIVO DE AUDITORIA</small><strong className={status?.banco_auditoria === 'conectado' ? 'indicador-ok' : 'indicador-erro'}>{status?.banco_auditoria === 'conectado' ? 'Conectado' : 'Indisponível'}</strong><span>Persistência independente</span></article>
      <article><small>REDIS</small><strong className={status?.redis === 'conectado' ? 'indicador-ok' : 'indicador-erro'}>{status?.redis === 'conectado' ? 'Conectado' : 'Indisponível'}</strong><span>Entrega dos avisos em tempo real</span></article>
      <article><small>EVENTOS PERSISTIDOS</small><strong>{status?.eventos_persistidos?.toLocaleString('pt-BR') ?? '—'}</strong><span>Contagem real no banco separado</span></article>
      <article><small>CARREGADOS NESTA CONSULTA</small><strong>{eventos.length.toLocaleString('pt-BR')}</strong><span>{ultimaAtualizacao ? `Atualizado ${ultimaAtualizacao.toLocaleTimeString('pt-BR')}` : 'Aguardando consulta'}</span></article>
    </div>
    {erro && <p className="alerta-admin-banco erro" role="alert">{erro}</p>}
    {status?.banco_auditoria !== 'conectado' && <p className="nota-auditoria-admin">O Firebird de auditoria ainda não está conectado. Os eventos continuam na outbox do banco principal e serão reenviados pelo worker quando a conexão e as variáveis ARKHE_AUDIT_DB_* estiverem configuradas.</p>}
    <form className="filtros-auditoria" onSubmit={(e) => { e.preventDefault(); carregarEventos(filtros) }}>
      <label>Evento<input value={filtros.evento} onChange={(e) => atualizar('evento', e.target.value.toUpperCase())} placeholder="Ex.: MOVIMENTACAO" /></label>
      <label>Usuário ID<input inputMode="numeric" value={filtros.usuario_id} onChange={(e) => atualizar('usuario_id', e.target.value)} /></label>
      <label>Conta ID<input inputMode="numeric" value={filtros.conta_id} onChange={(e) => atualizar('conta_id', e.target.value)} /></label>
      <label>Resultado<select value={filtros.resultado} onChange={(e) => atualizar('resultado', e.target.value)}><option value="">Todos</option><option>CONCLUIDO</option><option>SUCESSO</option><option>RECUSADO</option><option>CANCELADO</option><option>PENDENTE</option></select></label>
      <label>Origem<input value={filtros.origem} onChange={(e) => atualizar('origem', e.target.value)} placeholder="Rota ou canal" /></label>
      <label>De<input type="date" value={filtros.data_inicio} onChange={(e) => atualizar('data_inicio', e.target.value)} /></label>
      <label>Até<input type="date" value={filtros.data_fim} onChange={(e) => atualizar('data_fim', e.target.value)} /></label>
      <label>Valor mínimo<input inputMode="decimal" value={filtros.valor_min} onChange={(e) => atualizar('valor_min', e.target.value)} /></label>
      <label>Valor máximo<input inputMode="decimal" value={filtros.valor_max} onChange={(e) => atualizar('valor_max', e.target.value)} /></label>
      <button type="submit">Aplicar filtros</button>
    </form>
    <div className="feed-auditoria"><div className="feed-auditoria-titulo"><div><h3>Eventos recentes</h3><span>Os registros concluídos só entram no feed depois do commit da transação Firebird.</span></div><span>{eventos.length} registros</span></div>
      {carregando ? <p className="estado-admin-banco">Carregando eventos persistidos…</p> : eventos.length === 0 ? <p className="estado-admin-banco">Nenhum evento encontrado para estes filtros.</p> : <div className="lista-feed-auditoria">{eventos.map((evento) => <button type="button" className="linha-feed-auditoria" key={`${evento.id_evento}-${evento.evento}`} onClick={() => abrirDetalhe(evento.id_evento)}>
        <span className={`marcador-evento ${String(evento.resultado).toLowerCase()}`} />
        <span className="linha-feed-conteudo"><b>{formatarEvento(evento.evento)}</b><small>{evento.id_usuario ? `Usuário #${evento.id_usuario}` : 'Usuário não identificado'}{evento.id_conta ? ` · Conta #${evento.id_conta}` : ''} · {evento.tabela_origem} · {evento.origem || 'origem não informada'}</small></span>
        <span className="linha-feed-valor">{evento.valor == null ? evento.resultado : moeda.format(evento.valor)}</span><time>{dataHora(evento.criado_em)}</time><span className="seta-feed">›</span>
      </button>)}</div>}
    </div>
    <DetalheEvento evento={detalhe} fechar={() => setDetalhe(null)} />
  </section>
}
