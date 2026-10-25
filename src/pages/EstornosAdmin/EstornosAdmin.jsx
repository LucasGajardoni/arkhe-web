import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CabecalhoDashboard from '../../components/Dashboard/CabecalhoDashboard.jsx'
import ModalPerfil from '../../components/Dashboard/ModalPerfil.jsx'
import NavegacaoMobile from '../../components/Dashboard/NavegacaoMobile.jsx'
import { useSessao } from '../../hooks/useSessao.js'
import { encerrarSessao } from '../../services/authService.js'
import { consultarMigracaoEstornos, instalarMigracaoEstornos, listarEstornosAdmin } from '../../services/movimentacoesService.js'
import '../Dashboard/Dashboard.css'
import './EstornosAdmin.css'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const tipo = {
  CANCELAMENTO_COBRANCA: 'Cancelamento de cobrança',
  DEVOLUCAO_PIX_TRANSFERENCIA: 'Devolução Pix / transferência',
  ESTORNO_BOLETO: 'Estorno de boleto',
}
const status = { CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado', RECUSADO: 'Recusado' }

function dataLocal(valor) {
  if (!valor) return 'Data indisponível'
  const data = new Date(String(valor).replace(' ', 'T'))
  return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleString('pt-BR')
}

export default function EstornosAdmin() {
  const navigate = useNavigate()
  const { perfil, atualizarPerfil, limparSessao } = useSessao()
  const [historico, setHistorico] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [migracaoInstalada, setMigracaoInstalada] = useState(null)
  const [instalandoMigracao, setInstalandoMigracao] = useState(false)
  const [confirmacaoMigracao, setConfirmacaoMigracao] = useState(false)
  const [backupCriado, setBackupCriado] = useState('')
  const [erro, setErro] = useState('')
  const [perfilAberto, setPerfilAberto] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const migracao = await consultarMigracaoEstornos()
      setMigracaoInstalada(Boolean(migracao.instalada))
      if (migracao.instalada) {
        const dados = await listarEstornosAdmin()
        setHistorico(Array.isArray(dados.historico) ? dados.historico : [])
      } else {
        setHistorico([])
      }
    } catch (falha) {
      setErro(falha.message || 'Não foi possível carregar o histórico.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    Promise.resolve().then(carregar)
  }, [carregar])

  async function instalarEstrutura() {
    setInstalandoMigracao(true)
    setErro('')
    setBackupCriado('')
    try {
      const resultado = await instalarMigracaoEstornos()
      setBackupCriado(resultado.arquivo_backup || '')
      setConfirmacaoMigracao(false)
      await carregar()
    } catch (falha) {
      setErro(falha.message || 'Não foi possível instalar a estrutura de estornos.')
      if (falha.dados?.arquivo_backup) setBackupCriado(falha.dados.arquivo_backup)
    } finally {
      setInstalandoMigracao(false)
    }
  }

  async function sair() {
    try {
      await encerrarSessao()
      limparSessao()
      navigate('/login', { replace: true })
    } catch (falha) {
      setErro(falha.message || 'Não foi possível encerrar a sessão.')
    }
  }

  return (
    <div className="pagina-dashboard">
      <CabecalhoDashboard usuario={perfil} secao="limites" abrirPerfil={() => setPerfilAberto(true)} sair={sair} />
      <main className="conteudo-dashboard-largo corpo-estornos-admin">
        <header className="cabecalho-estornos-admin">
          <div><p>ADMINISTRAÇÃO BANCÁRIA</p><h1>Estornos e cancelamentos</h1><span>Histórico de operações, responsáveis, datas e motivos.</span></div>
          <div><button className="atualizar" type="button" onClick={carregar} disabled={carregando}>{carregando ? 'Atualizando…' : 'Atualizar'}</button><button className="botao botao-secundario" type="button" onClick={() => navigate('/dashboard/limites')}>Voltar aos limites</button></div>
        </header>
        {erro && <p className="estado-estornos-admin erro" role="alert">{erro}</p>}
        {migracaoInstalada === false && <section className="cartao-migracao-estornos" aria-labelledby="titulo-migracao-estornos">
          <h2 id="titulo-migracao-estornos">Preparar estrutura no Firebird</h2>
          <p>A migração cria apenas a tabela de auditoria de cancelamentos e devoluções. O backend fará um backup do banco antes de aplicar as alterações.</p>
          {!confirmacaoMigracao ? <button className="botao botao-primario" type="button" onClick={() => setConfirmacaoMigracao(true)} disabled={instalandoMigracao || carregando}>
            Criar backup e instalar estrutura
          </button> : <div className="confirmacao-migracao-estornos" role="group" aria-label="Confirmar instalação da migração">
            <p>Confirme para criar o backup no servidor Firebird e aplicar a migração aditiva. Nenhuma movimentação financeira será alterada.</p>
            <button className="botao botao-secundario" type="button" onClick={() => setConfirmacaoMigracao(false)} disabled={instalandoMigracao}>Voltar</button>
            <button className="botao botao-primario" type="button" onClick={instalarEstrutura} disabled={instalandoMigracao}>
              {instalandoMigracao ? 'Criando backup e instalando…' : 'Confirmar backup e instalação'}
            </button>
          </div>}
          {backupCriado && <p role="status">Backup concluído: <code>{backupCriado}</code></p>}
        </section>}
        {migracaoInstalada === true && backupCriado && <p className="estado-estornos-admin" role="status">Estrutura instalada. Backup: <code>{backupCriado}</code></p>}
        {carregando && <p className="estado-estornos-admin" role="status">Carregando histórico…</p>}
        {!carregando && !erro && historico.length === 0 && <p className="estado-estornos-admin">Nenhum estorno ou cancelamento registrado.</p>}
        {!carregando && !erro && historico.length > 0 && <section className="lista-estornos-admin" aria-label="Histórico de estornos">
          {historico.map((item) => (
            <article key={item.id_estorno}>
              <header><div><small>REGISTRO #{item.id_estorno}</small><h2>{tipo[item.tipo_operacao] || item.tipo_operacao}</h2></div><span className={`status-estorno-admin ${String(item.status).toLowerCase()}`}>{status[item.status] || item.status}</span></header>
              <dl>
                <div><dt>Valor</dt><dd>{moeda.format(Number(item.valor) || 0)}</dd></div>
                <div><dt>Conta solicitante</dt><dd>#{item.id_conta_solicitante}</dd></div>
                <div><dt>Responsável</dt><dd>Usuário #{item.id_usuario_responsavel}</dd></div>
                {item.id_cobranca && <div><dt>Cobrança</dt><dd>#{item.id_cobranca}</dd></div>}
                {item.id_movimentacao_original && <div><dt>Movimentação original</dt><dd>#{item.id_movimentacao_original}</dd></div>}
                {item.id_movimentacao_reversa && <div><dt>Movimentação inversa</dt><dd>#{item.id_movimentacao_reversa}</dd></div>}
                <div><dt>Data</dt><dd>{dataLocal(item.criado_em)}</dd></div>
              </dl>
              <p><strong>Motivo:</strong> {item.motivo}</p>
            </article>
          ))}
        </section>}
      </main>
      <NavegacaoMobile secao="limites" tipoConta={perfil.tipoConta} />
      {perfilAberto && <ModalPerfil usuario={perfil} fechar={() => setPerfilAberto(false)} aoAtualizar={atualizarPerfil} />}
    </div>
  )
}
