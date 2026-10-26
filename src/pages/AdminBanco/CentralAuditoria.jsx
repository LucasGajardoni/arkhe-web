import { useCallback, useEffect, useRef, useState } from 'react'
import { useModalAcessivel } from '../../hooks/useModalAcessivel.js'
import { listarEventosAuditoriaAdmin, obterEventoAuditoriaAdmin, urlStreamAuditoriaAdmin } from '../../services/adminBancoService.js'

function dataHora(valor) {
  if (!valor) return '—'
  const data = new Date(String(valor).replace(' ', 'T'))
  return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleString('pt-BR')
}

function texto(valor) {
  if (valor == null) return '—'
  return typeof valor === 'object' ? JSON.stringify(valor) : String(valor)
}

function DetalheLog({ evento, fechar }) {
  const { modalRef, fecharAoClicarFora } = useModalAcessivel(fechar)
  return <div className="modal-auditoria-fundo" role="presentation" onMouseDown={fecharAoClicarFora}>
    <section ref={modalRef} tabIndex={-1} className="modal-auditoria" role="dialog" aria-modal="true" aria-labelledby="titulo-log">
      <header><h2 id="titulo-log">Log #{evento.id_log}</h2><button type="button" onClick={fechar} aria-label="Fechar detalhes">×</button></header>
      <div className="detalhe-auditoria-grade">
        <p><b>Data e hora</b><span>{dataHora(evento.data_hora)}</span></p>
        <p><b>Usuário</b><span>{evento.usuario || 'Não identificado'}</span></p>
        <p><b>Tabela</b><span>{evento.tabela}</span></p>
        <p><b>ID do registro</b><span>{evento.id_registro ?? '—'}</span></p>
        <p><b>Ação</b><span>{evento.acao}</span></p>
      </div>
      <div className="snapshots-auditoria">{[['Valor anterior', evento.valor_anterior], ['Valor novo', evento.valor_novo]].map(([titulo, valor]) =>
        <article key={titulo}><h3>{titulo}</h3><pre>{valor == null ? '—' : typeof valor === 'object' ? JSON.stringify(valor, null, 2) : String(valor)}</pre></article>)}</div>
    </section>
  </div>
}

export default function CentralAuditoria() {
  const [eventos, setEventos] = useState([])
  const [detalhe, setDetalhe] = useState(null)
  const [filtros, setFiltros] = useState({ usuario: '', tabela: '', acao: '', data_inicio: '', data_fim: '', historico: '' })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [aoVivo, setAoVivo] = useState(false)
  const filtrosRef = useRef(filtros)
  const consultaRef = useRef({ numero: 0 })
  const historico = filtros.historico === '1'

  const carregar = useCallback(async (atuais = filtrosRef.current) => {
    const consulta = ++consultaRef.current.numero
    try {
      const resultado = await listarEventosAuditoriaAdmin({ ...atuais, limite: 100 })
      if (consulta !== consultaRef.current.numero) return
      setEventos(resultado.eventos || [])
      setErro('')
    } catch (falha) {
      if (consulta === consultaRef.current.numero) setErro(falha.message || 'Não foi possível consultar o log.')
    } finally {
      if (consulta === consultaRef.current.numero) setCarregando(false)
    }
  }, [])

  useEffect(() => {
    let origem
    const consultas = consultaRef.current
    Promise.resolve().then(() => carregar())
    try {
      origem = new EventSource(urlStreamAuditoriaAdmin(), { withCredentials: true })
      origem.onopen = () => setAoVivo(true)
      origem.onerror = () => setAoVivo(false)
      origem.addEventListener('auditoria', () => carregar())
    } catch { /* A consulta periódica continua disponível. */ }
    const intervalo = window.setInterval(() => carregar(), 30000)
    return () => { ++consultas.numero; origem?.close(); window.clearInterval(intervalo) }
  }, [carregar])

  function atualizar(campo, valor) {
    const novos = { ...filtrosRef.current, [campo]: valor }
    filtrosRef.current = novos
    setFiltros(novos)
    return novos
  }

  function trocarHistorico() {
    setDetalhe(null)
    setEventos([])
    setCarregando(true)
    carregar(atualizar('historico', historico ? '' : '1'))
  }

  async function abrirDetalhe(id) {
    const modo = filtrosRef.current.historico
    try {
      const resultado = await obterEventoAuditoriaAdmin(id, modo === '1')
      if (modo === filtrosRef.current.historico) setDetalhe(resultado.evento)
    } catch (falha) { setErro(falha.message || 'Não foi possível abrir o log.') }
  }

  return <section className="central-auditoria-admin">
    <div className="cabecalho-central-auditoria"><div><small>ADMINISTRAÇÃO</small><h2>Log do sistema</h2><p>Ações de usuários, IA e integrações.</p></div>
      <div className="estado-live-auditoria"><span className={aoVivo ? 'ponto-live conectado' : 'ponto-live'} />{aoVivo ? 'Ao vivo' : 'Atualização periódica'}<button type="button" onClick={() => carregar()} disabled={carregando}>Atualizar</button></div>
    </div>
    <div className="modo-log-admin"><strong>{historico ? 'Histórico anterior' : 'Registros atuais'}</strong><button type="button" onClick={trocarHistorico}>{historico ? 'Ver log atual' : 'Ver histórico anterior'}</button></div>
    {erro && <p className="alerta-admin-banco erro" role="alert">{erro}</p>}
    <form className="filtros-auditoria filtros-log-simples" onSubmit={(e) => { e.preventDefault(); carregar() }}>
      <label>Usuário<input value={filtros.usuario} onChange={(e) => atualizar('usuario', e.target.value)} placeholder="ID ou integração" /></label>
      <label>Tabela<input value={filtros.tabela} onChange={(e) => atualizar('tabela', e.target.value.toUpperCase())} /></label>
      <label>Ação<input value={filtros.acao} onChange={(e) => atualizar('acao', e.target.value.toUpperCase())} /></label>
      <label>De<input type="date" value={filtros.data_inicio} onChange={(e) => atualizar('data_inicio', e.target.value)} /></label>
      <label>Até<input type="date" value={filtros.data_fim} onChange={(e) => atualizar('data_fim', e.target.value)} /></label>
      <button type="submit">Filtrar</button>
    </form>
    <div className="feed-auditoria">
      <div className="feed-auditoria-titulo"><h3>{historico ? 'Histórico preservado' : 'Últimos registros'}</h3><span>{eventos.length} registros</span></div>
      {carregando ? <p className="estado-admin-banco" role="status">Carregando…</p> : eventos.length === 0 ? <p className="estado-admin-banco">Nenhum registro encontrado.</p> :
        <div className="rolagem-log-admin"><table className="tabela-log-admin"><thead><tr>{['ID log', 'Data e hora', 'Usuário', 'Tabela', 'ID registro', 'Ação', 'Valor anterior', 'Valor novo'].map((titulo) => <th key={titulo} scope="col">{titulo}</th>)}</tr></thead>
          <tbody>{eventos.map((evento) => <tr key={evento.id_log}>
            <td><button type="button" className="abrir-log-admin" onClick={() => abrirDetalhe(evento.id_log)} aria-label={`Abrir log ${evento.id_log}`}>{evento.id_log}</button></td>
            <td>{dataHora(evento.data_hora)}</td><td>{evento.usuario || '—'}</td><td>{evento.tabela}</td><td>{evento.id_registro ?? '—'}</td><td>{evento.acao}</td>
            <td><span title={texto(evento.valor_anterior)}>{texto(evento.valor_anterior)}</span></td><td><span title={texto(evento.valor_novo)}>{texto(evento.valor_novo)}</span></td>
          </tr>)}</tbody></table></div>}
    </div>
    {detalhe && <DetalheLog evento={detalhe} fechar={() => setDetalhe(null)} />}
  </section>
}
