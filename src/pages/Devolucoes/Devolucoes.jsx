import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CabecalhoDashboard from '../../components/Dashboard/CabecalhoDashboard.jsx'
import NavegacaoMobile from '../../components/Dashboard/NavegacaoMobile.jsx'
import ModalPerfil from '../../components/Dashboard/ModalPerfil.jsx'
import { useSessao } from '../../hooks/useSessao.js'
import { encerrarSessao } from '../../services/authService.js'
import { consultarHistoricoEstornosConta } from '../../services/movimentacoesService.js'
import '../Dashboard/Dashboard.css'
import './Devolucoes.css'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const tipos = {
  CANCELAMENTO_COBRANCA: 'Cobrança cancelada',
  DEVOLUCAO_PIX_TRANSFERENCIA: 'Pix ou transferência devolvida',
  ESTORNO_BOLETO: 'Boleto estornado pelo banco',
}
const estados = { CONCLUIDO: 'Devolução concluída', CANCELADO: 'Cobrança cancelada', RECUSADO: 'Operação recusada' }

function formatarData(valor) {
  if (!valor) return 'Data não informada'
  const data = new Date(String(valor).replace(' ', 'T'))
  return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleString('pt-BR')
}

export default function Devolucoes() {
  const navigate = useNavigate()
  const { perfil, atualizarPerfil, limparSessao } = useSessao()
  const [perfilAberto, setPerfilAberto] = useState(false)
  const [historico, setHistorico] = useState([])
  const [instalada, setInstalada] = useState(true)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [revisao, setRevisao] = useState(0)

  const carregar = useCallback(() => setRevisao((anterior) => anterior + 1), [])

  useEffect(() => {
    let ativo = true
    Promise.resolve().then(async () => {
      setCarregando(true)
      setErro('')
      setHistorico([])
      try {
        const dados = await consultarHistoricoEstornosConta()
        if (!ativo) return
        setInstalada(dados.instalada !== false)
        setHistorico(Array.isArray(dados.historico) ? dados.historico : [])
      } catch (falha) {
        if (ativo) setErro(falha.message || 'Não foi possível consultar as devoluções da conta.')
      } finally {
        if (ativo) setCarregando(false)
      }
    })
    return () => { ativo = false }
  }, [perfil?.idConta, revisao])

  async function sair() {
    try {
      await encerrarSessao()
      limparSessao()
      navigate('/login', { replace: true })
    } catch (falha) {
      setErro(falha.message || 'Não foi possível encerrar a sessão.')
    }
  }

  return <div className="pagina-dashboard pagina-devolucoes">
    <CabecalhoDashboard usuario={perfil} secao="extrato" abrirPerfil={() => setPerfilAberto(true)} sair={sair} />
    <main className="conteudo-dashboard-largo corpo-devolucoes">
      <header className="topo-devolucoes">
        <div>
          <p>PROTEÇÃO FINANCEIRA · CONTA {perfil?.tipoConta || 'ATIVA'}</p>
          <h1>Devoluções e cancelamentos</h1>
          <span>Entenda quando cada ação é possível e acompanhe somente os registros desta conta.</span>
        </div>
        <button className="botao botao-secundario" type="button" onClick={carregar} disabled={carregando}>
          {carregando ? 'Atualizando…' : 'Atualizar histórico'}
        </button>
      </header>

      <section className="explicacao-devolucoes" aria-label="Como funcionam devoluções e cancelamentos">
        <article>
          <small>01 · PAGAMENTO RECEBIDO</small>
          <h2>Recebeu um Pix ou transferência?</h2>
          <p>Se a operação for elegível, você pode devolver o valor integral pelo <strong>Extrato → entrada recebida → Devolver valor</strong>. O saldo e os limites da sua conta precisam permitir a saída.</p>
          <button type="button" onClick={() => navigate('/dashboard/extrato')}>Abrir meu extrato</button>
        </article>
        <article>
          <small>02 · COBRANÇA PENDENTE</small>
          <h2>Emitiu um boleto e ainda não foi pago?</h2>
          <p>O emissor pode cancelar uma cobrança pendente em <strong>Boletos → cobrança → Cancelar cobrança</strong>. Isso impede um novo pagamento, mas não devolve dinheiro porque nada foi pago.</p>
          <button type="button" onClick={() => navigate('/dashboard/boletos')}>Ver minhas cobranças</button>
        </article>
        <article>
          <small>03 · PAGAMENTO JÁ ENVIADO</small>
          <h2>Você pagou e quer o dinheiro de volta?</h2>
          <p>O pagador não pode retirar dinheiro da conta recebedora sozinho. Para Pix, solicite a devolução ao recebedor; boletos pagos exigem estorno pelo administrador bancário. Compras com cartão e folha de pagamento não aceitam essa devolução nesta versão.</p>
        </article>
      </section>

      <section className="historico-devolucoes" aria-labelledby="titulo-meu-historico">
        <header>
          <div><p>APENAS ESTA CONTA</p><h2 id="titulo-meu-historico">Meu histórico de devoluções</h2></div>
          <small>Separado por conta PF/PJ; não é o histórico geral do banco.</small>
        </header>
        {carregando && <p className="estado-devolucoes" role="status">Consultando o Firebird…</p>}
        {!carregando && erro && <p className="estado-devolucoes erro" role="alert">{erro}</p>}
        {!carregando && !erro && !instalada && <p className="estado-devolucoes">O histórico de devoluções ainda não está disponível neste ambiente. Nenhuma alteração financeira foi feita.</p>}
        {!carregando && !erro && instalada && historico.length === 0 && <p className="estado-devolucoes">Esta conta ainda não possui devoluções ou cancelamentos registrados.</p>}
        {!carregando && !erro && instalada && historico.map((item) => <article className="registro-devolucoes" key={item.id_estorno}>
          <div className="registro-devolucoes-topo">
            <div><small>Registro #{item.id_estorno} · {formatarData(item.criado_em)}</small><h3>{tipos[item.tipo_operacao] || 'Operação de devolução'}</h3></div>
            <strong>{moeda.format(Number(item.valor) || 0)}</strong>
          </div>
          <div className="registro-devolucoes-status"><span>{estados[item.status] || item.status}</span>
            <small>{item.tipo_operacao === 'CANCELAMENTO_COBRANCA' ? (item.participacao === 'recebedor_original' ? 'Esta conta emitiu a cobrança' : 'Esta conta era a pagadora da cobrança') : item.participacao === 'recebedor_original' ? 'Esta conta recebeu o pagamento original' : 'Esta conta enviou o pagamento original'}</small>
          </div>
          <p>{item.motivo || 'Motivo não informado.'}</p>
          <small>{item.id_movimentacao_original ? `Movimentação original #${item.id_movimentacao_original}` : item.id_cobranca ? `Cobrança #${item.id_cobranca}` : ''}</small>
        </article>)}
      </section>
    </main>
    <NavegacaoMobile secao="extrato" tipoConta={perfil?.tipoConta} />
    {perfilAberto && <ModalPerfil usuario={perfil} fechar={() => setPerfilAberto(false)} aoAtualizar={atualizarPerfil} />}
  </div>
}
