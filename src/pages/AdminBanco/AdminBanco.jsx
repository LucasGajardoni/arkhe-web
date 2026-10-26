import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CabecalhoDashboard from '../../components/Dashboard/CabecalhoDashboard.jsx'
import ModalPerfil from '../../components/Dashboard/ModalPerfil.jsx'
import NavegacaoMobile from '../../components/Dashboard/NavegacaoMobile.jsx'
import { useSessao } from '../../hooks/useSessao.js'
import { encerrarSessao } from '../../services/authService.js'
import {
  buscarUsuariosAdminBanco,
  listarOperacoesAdminBanco,
  obterPermissaoAdminBanco,
  obterDetalheUsuarioAdminBanco,
  obterResumoAdminBanco,
} from '../../services/adminBancoService.js'
import './AdminBanco.css'
import CentralAuditoria from './CentralAuditoria.jsx'
import MauroAdmin from './MauroAdmin.jsx'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dataHora = (valor) => {
  if (!valor) return '—'
  const data = new Date(String(valor).replace(' ', 'T'))
  return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleString('pt-BR')
}
const statusAcesso = { 0: 'Pendente', 1: 'Ativo', 2: 'Bloqueado', 3: 'Revogado' }
const opcoesTipo = [
  ['TODOS', 'Todos os tipos'], ['PIX', 'Pix'], ['TRANSFERENCIA', 'Transferências'],
  ['BOLETO', 'Boletos'], ['COBRANCA', 'Cobranças'], ['CANCELAMENTO', 'Cancelamentos'],
  ['DEVOLUCAO', 'Devoluções'], ['ESTORNO', 'Estornos'], ['AGENDAMENTO', 'Agendamentos'],
  ['RECORRENCIA', 'Recorrências'],
]

function CardMetrica({ titulo, valor, detalhe, tom = '' }) {
  return <article className={`metrica-admin-banco ${tom}`}>
    <span>{titulo}</span><strong>{valor ?? '—'}</strong>{detalhe && <small>{detalhe}</small>}
  </article>
}

function TabelaOperacoes({ itens, vazio = 'Nenhuma operação encontrada.' }) {
  if (!itens?.length) return <p className="estado-admin-banco">{vazio}</p>
  return <div className="tabela-admin-rolagem"><table className="tabela-admin-banco">
    <thead><tr><th>Data</th><th>Tipo</th><th>Conta</th><th>Valor</th><th>Status</th><th>Referência</th></tr></thead>
    <tbody>{itens.map((item) => <tr key={`${item.origem}-${item.id}`}>
      <td>{dataHora(item.data)}</td><td>{item.tipo}</td><td>#{item.conta_id || item.conta_pagador || '—'}</td>
      <td>{moeda.format(Number(item.valor) || 0)}</td><td><span className={`badge-status-admin status-${String(item.status).toLowerCase()}`}>{item.status}</span></td>
      <td>{item.id_cobranca ? `Cobrança #${item.id_cobranca}` : `#${item.id}`}</td>
    </tr>)}</tbody>
  </table></div>
}

export default function AdminBanco() {
  const navigate = useNavigate()
  const { perfil, atualizarPerfil, limparSessao } = useSessao()
  const [resumo, setResumo] = useState(null)
  const [operacoes, setOperacoes] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [detalhe, setDetalhe] = useState(null)
  const [aba, setAba] = useState('visao')
  const [termo, setTermo] = useState('')
  const [filtros, setFiltros] = useState({ conta_id: '', tipo: 'TODOS', status: '', data_inicio: '', data_fim: '' })
  const [carregando, setCarregando] = useState(true)
  const [adminAutorizado, setAdminAutorizado] = useState(null)
  const [buscando, setBuscando] = useState(false)
  const [erro, setErro] = useState('')
  const [perfilAberto, setPerfilAberto] = useState(false)

  const carregarPainel = useCallback(async () => {
    setErro('')
    setCarregando(true)
    try {
      const permissao = await obterPermissaoAdminBanco()
      if (!permissao.autorizado) {
        setAdminAutorizado(false)
        setErro('Esta área é exclusiva para administradores bancários autorizados.')
        return
      }
      setAdminAutorizado(true)
      const [dados, recentes] = await Promise.all([
        obterResumoAdminBanco(),
        listarOperacoesAdminBanco({ limite: 12 }),
      ])
      setResumo(dados)
      setOperacoes(recentes.operacoes || [])
    } catch (falha) {
      setAdminAutorizado(falha.status === 401 || falha.status === 403 ? false : null)
      setErro(falha.message || 'Não foi possível carregar os dados administrativos.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { Promise.resolve().then(carregarPainel) }, [carregarPainel])

  async function sair() {
    try {
      await encerrarSessao()
      limparSessao()
      navigate('/login', { replace: true })
    } catch (falha) {
      setErro(falha.message || 'Não foi possível encerrar a sessão.')
    }
  }

  async function pesquisar(evento) {
    evento.preventDefault()
    if (termo.trim().length < 2) {
      setErro('Digite pelo menos 2 caracteres para pesquisar.')
      return
    }
    setErro('')
    setBuscando(true)
    setDetalhe(null)
    try {
      const resultado = await buscarUsuariosAdminBanco(termo.trim())
      setUsuarios(resultado.usuarios || [])
    } catch (falha) {
      setErro(falha.message || 'Não foi possível pesquisar usuários.')
    } finally {
      setBuscando(false)
    }
  }

  async function abrirUsuario(idUsuario) {
    setErro('')
    setBuscando(true)
    try {
      setDetalhe(await obterDetalheUsuarioAdminBanco(idUsuario))
    } catch (falha) {
      setErro(falha.message || 'Não foi possível consultar esta conta.')
    } finally {
      setBuscando(false)
    }
  }

  async function filtrarOperacoes(evento) {
    evento.preventDefault()
    setErro('')
    setBuscando(true)
    try {
      const resultado = await listarOperacoesAdminBanco({ ...filtros, limite: 100 })
      setOperacoes(resultado.operacoes || [])
    } catch (falha) {
      setErro(falha.message || 'Não foi possível filtrar operações.')
    } finally {
      setBuscando(false)
    }
  }

  const statusConta = resumo?.contas?.status_proprio
  if (!carregando && adminAutorizado !== true) return <div className="pagina-dashboard pagina-admin-banco">
    <main className="conteudo-dashboard-largo conteudo-admin-banco">
      <section className="cartao-admin-banco"><small>ÁREA RESTRITA</small><h1>{adminAutorizado === false ? 'Acesso administrativo necessário' : 'Autorização não confirmada'}</h1>
        <p>O MAURO Administração e os dados bancários gerais só podem ser acessados por administradores bancários autorizados no backend.</p>
        {erro && <p className="alerta-admin-banco erro" role="alert">{erro}</p>}
      </section>
    </main>
  </div>
  return <div className="pagina-dashboard pagina-admin-banco">
    <CabecalhoDashboard usuario={perfil} secao="admin" abrirPerfil={() => setPerfilAberto(true)} sair={sair} />
    <main className="conteudo-dashboard-largo conteudo-admin-banco">
      <header className="topo-admin-banco">
        <div><p>CONTROLE INTERNO · BANCO ARKHÉ</p><h1>Painel administrativo</h1>
          <span>Indicadores e operações consultados diretamente no Firebird.</span></div>
        <div className="acoes-topo-admin"><span>Usuário administrador #{perfil?.idUsuario || '—'}</span>
          <button className="botao-atualizar-admin" type="button" onClick={carregarPainel} disabled={carregando}>{carregando ? 'Atualizando…' : 'Atualizar dados'}</button></div>
      </header>

      <nav className="abas-admin-banco" aria-label="Seções administrativas">
        <button className={aba === 'visao' ? 'ativo' : ''} onClick={() => setAba('visao')} type="button">Visão geral</button>
        <button className={aba === 'usuarios' ? 'ativo' : ''} onClick={() => setAba('usuarios')} type="button">Usuários e contas</button>
        <button className={aba === 'operacoes' ? 'ativo' : ''} onClick={() => setAba('operacoes')} type="button">Operações</button>
        <button className={aba === 'mauro' ? 'ativo aba-mauro-admin' : 'aba-mauro-admin'} onClick={() => setAba('mauro')} type="button">MAURO Administração</button>
        <button className={aba === 'auditoria' ? 'ativo aba-auditoria-principal' : 'aba-auditoria-principal'} onClick={() => setAba('auditoria')} type="button">Central de Auditoria</button>
      </nav>

      {erro && <p className="alerta-admin-banco erro" role="alert">{erro}</p>}
      {carregando && <p className="estado-admin-banco" role="status">Consultando dados reais do banco…</p>}
      <MauroAdmin ativo={aba === 'mauro'} />

      {!carregando && resumo && aba === 'visao' && <>
        <section className="grade-metricas-admin" aria-label="Indicadores do banco">
          <CardMetrica titulo="Usuários cadastrados" valor={resumo.usuarios.total.toLocaleString('pt-BR')} detalhe={`${resumo.usuarios.ativos_status_1.toLocaleString('pt-BR')} com STATUS 1`} />
          <CardMetrica titulo="Contas PF" valor={resumo.contas.pf.toLocaleString('pt-BR')} detalhe="Tipo de conta 0" />
          <CardMetrica titulo="Contas PJ" valor={resumo.contas.pj.toLocaleString('pt-BR')} detalhe="Tipo de conta 1" />
          <CardMetrica titulo="Movimentações" valor={resumo.movimentacoes.quantidade.toLocaleString('pt-BR')} detalhe={`Volume bruto ${moeda.format(resumo.movimentacoes.volume_bruto)}`} tom="destaque" />
          <CardMetrica titulo="Cobranças pendentes" valor={(resumo.cobrancas.pendentes || 0).toLocaleString('pt-BR')} detalhe={`${resumo.cobrancas.concluidas || 0} concluídas · ${resumo.cobrancas.canceladas || 0} canceladas`} />
          <CardMetrica titulo="Outros status de usuário" valor={resumo.usuarios.outros_status.toLocaleString('pt-BR')} detalhe="Status diferente de 1; códigos abaixo" />
        </section>

        <section className="faixa-status-admin">
          <div><strong>Status das contas no esquema</strong><p>{statusConta?.disponivel
            ? `Distribuição real do campo CONTA.STATUS: ${statusConta.distribuicao.map((item) => `${item.codigo ?? 'NULL'} (${item.quantidade})`).join(' · ') || 'sem registros'}`
            : 'A tabela CONTA não possui campo STATUS; não há bloqueio geral de conta implementado.'}</p></div>
          <div><strong>Usuários por código de status</strong><p>{resumo.usuarios.distribuicao_status.map((item) => `${item.codigo ?? 'NULL'} (${item.quantidade})`).join(' · ') || 'Sem usuários'}</p></div>
        </section>

        <section className="grade-painel-admin">
          <article className="cartao-admin-banco bloco-operacoes-admin"><header><div><small>ATIVIDADE DO BANCO</small><h2>Operações recentes</h2></div><button type="button" onClick={() => setAba('operacoes')}>Ver todas</button></header>
            <TabelaOperacoes itens={operacoes} /></article>
          <article className="cartao-admin-banco bloco-alertas-admin"><small>ATENÇÃO</small><h2>Alertas e auditoria existente</h2>
            <p><strong>{resumo.alertas_seguranca_critica_7d ?? '—'}</strong> alertas críticos nos últimos 7 dias <span>(contagem agregada, sem expor conteúdo pessoal)</span></p>
            <ul>{(resumo.alertas_limites || []).slice(0, 5).map((item) => <li key={item.id}><b>{item.evento === 'OPERACAO_RECUSADA' ? 'Recusa por limite' : 'Política de limite alterada'}</b><span>Conta #{item.id_conta || '—'} · {item.mensagem}</span><small>{dataHora(item.data)}</small></li>)}</ul>
          </article>
        </section>

        <section className="atalhos-config-admin"><h2>Controles já disponíveis</h2>
          <button type="button" onClick={() => navigate('/dashboard/limites')}>Limites diurnos e noturnos <span>Configurações PF/PJ e histórico</span></button>
          <button type="button" onClick={() => navigate('/dashboard/estornos')}>Cancelamentos e estornos <span>Histórico, motivos e responsáveis</span></button>
          <button type="button" onClick={() => navigate('/dashboard/agendamentos')}>Agendamentos <span>Acompanhamento de operações futuras</span></button>
          <button type="button" onClick={() => navigate('/dashboard/recorrencias')}>Recorrências <span>Configuração e execuções</span></button>
        </section>
        <button className="atalho-central-auditoria" type="button" onClick={() => setAba('auditoria')}><span>Central de Auditoria</span><small>Feed cronológico, trilha financeira e alertas em tempo real</small><b>Abrir central →</b></button>
      </>}

      {!carregando && resumo && aba === 'usuarios' && <section className="cartao-admin-banco secao-usuarios-admin">
        <header><div><small>CONSULTA RESTRITA</small><h2>Pesquisar usuários e contas</h2><p>A pesquisa exibe dados básicos, contas titulares e vínculos de acesso PJ.</p></div></header>
        <form className="busca-usuario-admin" onSubmit={pesquisar}><label htmlFor="busca-usuario-admin">Nome, e-mail ou CPF</label><div><input id="busca-usuario-admin" value={termo} onChange={(event) => setTermo(event.target.value)} placeholder="Digite ao menos 2 caracteres" autoComplete="off" /><button type="submit" disabled={buscando}>{buscando ? 'Buscando…' : 'Pesquisar'}</button></div></form>
        {usuarios.length > 0 && <div className="lista-usuarios-admin">{usuarios.map((usuario) => <button type="button" key={usuario.id_usuario} onClick={() => abrirUsuario(usuario.id_usuario)}>
          <span><strong>{usuario.nome}</strong><small>{usuario.email} · CPF final {usuario.cpf_final || '—'}</small></span>
          <span>{usuario.contas_proprias} contas · {usuario.acessos_pj_ativos} acessos PJ ativos · status {usuario.status}</span>
        </button>)}</div>}
        {usuarios.length === 0 && <p className="estado-admin-banco">Pesquise um usuário para consultar os vínculos.</p>}
        {detalhe && <article className="detalhe-usuario-admin"><header><div><small>USUÁRIO #{detalhe.usuario.id_usuario} · STATUS {detalhe.usuario.status}</small><h3>{detalhe.usuario.nome}</h3><p>{detalhe.usuario.email} · CPF final {detalhe.usuario.cpf_final || '—'}</p></div><button type="button" onClick={() => setDetalhe(null)}>Fechar</button></header>
          <h4>Contas titulares e movimentações</h4>{detalhe.contas.length ? <div className="cards-contas-admin">{detalhe.contas.map((conta) => <div key={conta.id_conta}><b>Conta #{conta.id_conta} · {conta.tipo}</b><span>{conta.nome_fantasia || conta.razao_social || `Agência ${conta.agencia} · Conta ${conta.numero_conta}`}</span><small>{conta.movimentacoes} movimentos · débitos {moeda.format(conta.volume_debito_bruto)} · créditos {moeda.format(conta.volume_credito_bruto)}</small></div>)}</div> : <p>Sem contas titulares cadastradas.</p>}
          <h4>Acessos a contas PJ</h4>{detalhe.acessos_pj.length ? <div className="tabela-admin-rolagem"><table className="tabela-admin-banco"><thead><tr><th>Conta</th><th>Empresa</th><th>Cargo</th><th>Status do vínculo</th></tr></thead><tbody>{detalhe.acessos_pj.map((acesso) => <tr key={acesso.id_acesso}><td>#{acesso.id_conta}</td><td>{acesso.empresa}</td><td>{acesso.cargo || '—'}</td><td>{statusAcesso[acesso.status] || `Código ${acesso.status}`}</td></tr>)}</tbody></table></div> : <p>Este usuário não possui vínculo de acesso PJ.</p>}
          <p className="nota-auditoria-admin">Bloqueio ou reativação geral não disponível: o sistema não possui uma rota administrativa bancária segura para alterar o status de usuário ou conta.</p>
        </article>}
      </section>}

      {!carregando && resumo && aba === 'operacoes' && <section className="cartao-admin-banco secao-operacoes-admin">
        <header><div><small>CONSULTA FINANCEIRA</small><h2>Operações</h2><p>Pix, transferências, cobranças, pagamentos, cancelamentos, devoluções, agendamentos e recorrências.</p></div></header>
        <form className="filtros-operacoes-admin" onSubmit={filtrarOperacoes}>
          <label>Conta ID<input inputMode="numeric" value={filtros.conta_id} onChange={(event) => setFiltros({ ...filtros, conta_id: event.target.value })} placeholder="Todas" /></label>
          <label>Tipo<select value={filtros.tipo} onChange={(event) => setFiltros({ ...filtros, tipo: event.target.value })}>{opcoesTipo.map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}</select></label>
          <label>Status<input value={filtros.status} onChange={(event) => setFiltros({ ...filtros, status: event.target.value.toUpperCase() })} placeholder="Ex.: PENDENTE" /></label>
          <label>De<input type="date" value={filtros.data_inicio} onChange={(event) => setFiltros({ ...filtros, data_inicio: event.target.value })} /></label>
          <label>Até<input type="date" value={filtros.data_fim} onChange={(event) => setFiltros({ ...filtros, data_fim: event.target.value })} /></label>
          <button type="submit" disabled={buscando}>{buscando ? 'Filtrando…' : 'Aplicar filtros'}</button>
        </form>
        <TabelaOperacoes itens={operacoes} />
        <div className="links-operacoes-admin"><button type="button" onClick={() => navigate('/dashboard/estornos')}>Abrir histórico administrativo de cancelamentos e estornos</button></div>
      </section>}
      {!carregando && resumo && aba === 'auditoria' && <CentralAuditoria />}
    </main>
    <NavegacaoMobile secao="admin" tipoConta={perfil?.tipoConta} />
    {perfilAberto && <ModalPerfil usuario={perfil} fechar={() => setPerfilAberto(false)} aoAtualizar={atualizarPerfil} />}
  </div>
}
