import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CabecalhoDashboard from '../../components/Dashboard/CabecalhoDashboard.jsx'
import Icone from '../../components/Dashboard/Icone.jsx'
import ModalPerfil from '../../components/Dashboard/ModalPerfil.jsx'
import NavegacaoMobile from '../../components/Dashboard/NavegacaoMobile.jsx'
import { useSessao } from '../../hooks/useSessao.js'
import { encerrarSessao } from '../../services/authService.js'
import {
  atualizarPoliticasLimites,
  listarHistoricoLimites,
  listarPoliticasLimites,
  obterLimitesConta,
} from '../../services/limitesService.js'
import '../Dashboard/Dashboard.css'
import './Limites.css'

const OPERACOES = ['TRANSFERENCIA', 'PAGAMENTO']
const PERIODOS = ['DIURNO', 'NOTURNO']
const TIPOS = ['PF', 'PJ']
const PERIODOS_LABEL = {
  DIURNO: 'Diurno · 06h–21h59',
  NOTURNO: 'Noturno · 22h–05h59',
}
const OPERACAO_LABEL = {
  TRANSFERENCIA: 'Transferências e Pix',
  PAGAMENTO: 'Pagamentos e cartões',
}
const moeda = (valor) => valor == null
  ? 'Sem limite adicional'
  : Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function montarFormulario(politicas, tipoConta, periodo) {
  return {
    operacoes: Object.fromEntries(OPERACOES.map((operacao) => {
      const regra = politicas.operacoes?.find((item) =>
        item.tipo_conta === tipoConta && item.periodo === periodo && item.operacao === operacao,
      )
      return [operacao, {
        ativo: regra?.ativo || false,
        limite_por_operacao: regra?.limite_por_operacao == null ? '' : String(regra.limite_por_operacao),
        favorito_ativo: regra?.favorito_ativo || false,
        limite_por_operacao_favorito: regra?.limite_por_operacao_favorito == null ? '' : String(regra.limite_por_operacao_favorito),
      }]
    })),
    acumulado: politicas.periodos?.find((item) =>
      item.tipo_conta === tipoConta && item.periodo === periodo,
    ),
  }
}

export default function Limites() {
  const { perfil, atualizarPerfil, limparSessao, tratarErroSessao } = useSessao()
  const navigate = useNavigate()
  const [resumo, setResumo] = useState(null)
  const [resumoDaConta, setResumoDaConta] = useState(null)
  const [administrador, setAdministrador] = useState(false)
  const [adminDaConta, setAdminDaConta] = useState(null)
  const [politicas, setPoliticas] = useState({ operacoes: [], periodos: [] })
  const [historico, setHistorico] = useState([])
  const [tipoConta, setTipoConta] = useState('PF')
  const [periodo, setPeriodo] = useState('DIURNO')
  const tipoContaRef = useRef('PF')
  const periodoRef = useRef('DIURNO')
  const [formulario, setFormulario] = useState(null)
  const [motivo, setMotivo] = useState('')
  const [carregadaDaConta, setCarregadaDaConta] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [perfilAberto, setPerfilAberto] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [revisao, setRevisao] = useState(0)

  useEffect(() => {
    if (!perfil?.idConta) return undefined
    let ativo = true
    obterLimitesConta().then(async (dados) => {
      if (!ativo) return
      setResumo(dados)
      setResumoDaConta(perfil.idConta)
      if (dados.administrador) {
        const [regras, registros] = await Promise.all([
          listarPoliticasLimites(),
          listarHistoricoLimites(),
        ])
        if (!ativo) return
        setPoliticas(regras)
        setHistorico(registros.historico || [])
        setFormulario(montarFormulario(regras, tipoContaRef.current, periodoRef.current))
      }
      setAdministrador(dados.administrador === true)
      setAdminDaConta(perfil.idConta)
    }).catch((falha) => {
      if (!ativo) return
      setErro(falha.message || 'Não foi possível carregar os limites da conta.')
      tratarErroSessao(falha)
    }).finally(() => { if (ativo) setCarregadaDaConta(perfil.idConta) })
    return () => { ativo = false }
  }, [perfil?.idConta, tratarErroSessao, revisao])

  async function sair() {
    try {
      await encerrarSessao()
      limparSessao()
      navigate('/login', { replace: true })
    } catch (falha) {
      setErro(falha.message || 'Não foi possível encerrar a sessão.')
    }
  }

  function alterarOperacao(operacao, campo, valor) {
    const ajusteFavorito = operacao === 'TRANSFERENCIA' && campo === 'ativo' && valor === false
      ? { favorito_ativo: false, limite_por_operacao_favorito: '' }
      : {}
    setFormulario((atual) => ({
      ...atual,
      operacoes: {
        ...atual.operacoes,
        [operacao]: { ...atual.operacoes[operacao], ...ajusteFavorito, [campo]: valor },
      },
    }))
  }

  async function salvarPolitica(evento) {
    evento.preventDefault()
    setErro('')
    setSucesso('')
    setSalvando(true)
    try {
      await atualizarPoliticasLimites({
        tipo_conta: tipoConta,
        periodo,
        motivo: motivo.trim(),
        operacoes: Object.fromEntries(OPERACOES.map((operacao) => [operacao, {
          ativo: formulario.operacoes[operacao].ativo,
          limite_por_operacao: formulario.operacoes[operacao].limite_por_operacao || null,
          favorito_ativo: operacao === 'TRANSFERENCIA' && formulario.operacoes[operacao].favorito_ativo,
          limite_por_operacao_favorito: operacao === 'TRANSFERENCIA'
            ? (formulario.operacoes[operacao].limite_por_operacao_favorito || null)
            : null,
        }])),
        acumulado_ativo: formulario.acumulado?.ativo || false,
        limite_acumulado: formulario.acumulado?.limite_acumulado ?? null,
      })
      setSucesso('Política de limites atualizada e registrada no histórico.')
      setMotivo('')
      setCarregadaDaConta(null)
      setRevisao((atual) => atual + 1)
    } catch (falha) {
      setErro(falha.message || 'Não foi possível salvar essa política.')
      tratarErroSessao(falha)
    } finally {
      setSalvando(false)
    }
  }

  const atual = resumo?.limites?.[0]
  const contaAtualCarregando = carregadaDaConta !== perfil?.idConta
  const resumoAtual = resumoDaConta === perfil?.idConta ? resumo : null
  const atualDaConta = resumoDaConta === perfil?.idConta ? atual : null
  const administradorAtual = adminDaConta === perfil?.idConta && administrador
  return <div className="pagina-dashboard pagina-limites">
    <CabecalhoDashboard usuario={perfil} secao="limites" abrirPerfil={() => setPerfilAberto(true)} sair={sair} />
    <main className="conteudo-dashboard-largo conteudo-limites">
      <header className="topo-limites">
        <div>
          <p className="rotulo-secao">PROTEÇÃO DA CONTA</p>
          <h1>Limites de movimentação</h1>
          <p>Consulte quanto já foi utilizado e o valor disponível neste período.</p>
        </div>
        {resumoAtual && <span className="tipo-conta-limites">Conta {resumoAtual.tipo_conta}</span>}
      </header>

      {erro && <p className="mensagem-limites erro" role="alert">{erro}</p>}
      {sucesso && <p className="mensagem-limites sucesso" role="status">{sucesso}</p>}

      {contaAtualCarregando ? <div className="estado-limites">Carregando limites da conta…</div> : atualDaConta ? <>
        <section className="resumo-limites" aria-label="Resumo dos limites atuais">
          <div className="resumo-limites-titulo">
            <span className="icone-limites"><Icone nome="transferir" tamanho={22} /></span>
            <div><p>PERÍODO ATUAL</p><h2>{PERIODOS_LABEL[atualDaConta.periodo]}</h2></div>
          </div>
          <div className="metricas-limites">
            <article><span>Utilizado</span><strong>{moeda(atualDaConta.utilizado)}</strong></article>
            <article><span>Disponível no período</span><strong>{moeda(atualDaConta.disponivel_periodo)}</strong></article>
          </div>
          <small>Horário de São Paulo · Período válido até {new Date(`${atualDaConta.fim}-03:00`).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>
        </section>

        <section className="operacoes-limites" aria-label="Limites por tipo de operação">
          {atualDaConta.operacoes?.map((item) => <article className="cartao-operacao-limite" key={item.operacao}>
            <div className="titulo-operacao-limite"><span><Icone nome={item.operacao === 'TRANSFERENCIA' ? 'transferir' : 'cartao'} tamanho={19} /></span><h2>{OPERACAO_LABEL[item.operacao]}</h2></div>
            <dl>
              <div><dt>Máximo por operação</dt><dd>{moeda(item.limite_por_operacao)}</dd></div>
              <div><dt>Disponível agora</dt><dd>{moeda(item.disponivel_agora)}</dd></div>
              {item.operacao === 'TRANSFERENCIA' && item.limite_por_operacao_favorito != null && (
                <>
                  <div><dt>Máximo para destinatários favoritos</dt><dd>{moeda(item.limite_por_operacao_favorito)}</dd></div>
                  <div><dt>Disponível agora para favoritos</dt><dd>{moeda(item.disponivel_favorito_agora)}</dd></div>
                </>
              )}
            </dl>
            {!item.configurado && <p>Não há um teto adicional configurado para este período.</p>}
          </article>)}
        </section>
      </> : !erro && <div className="estado-limites">Não foi possível encontrar a conta ativa.</div>}

      {administradorAtual && formulario && <section className="admin-limites">
        <header className="admin-limites-cabecalho">
          <div><p className="rotulo-secao">ADMINISTRAÇÃO BANCÁRIA</p><h2>Configurar políticas</h2><p>A autorização é validada pelo backend e é independente do papel de uma conta PJ.</p></div>
          <button className="botao botao-secundario" type="button" onClick={() => navigate('/dashboard/estornos')}>Histórico de estornos</button>
        </header>
        <form onSubmit={salvarPolitica}>
          <div className="filtros-limites">
            <label>Tipo de conta<select value={tipoConta} onChange={(event) => { const valor = event.target.value; tipoContaRef.current = valor; setTipoConta(valor); setFormulario(montarFormulario(politicas, valor, periodo)) }}>{TIPOS.map((tipo) => <option key={tipo}>{tipo}</option>)}</select></label>
            <label>Período<select value={periodo} onChange={(event) => { const valor = event.target.value; periodoRef.current = valor; setPeriodo(valor); setFormulario(montarFormulario(politicas, tipoConta, valor)) }}>{PERIODOS.map((nome) => <option key={nome} value={nome}>{PERIODOS_LABEL[nome]}</option>)}</select></label>
          </div>
          <div className="grade-politicas-limites">
            {OPERACOES.map((operacao) => <fieldset className="politica-limite" key={operacao}>
              <legend>{OPERACAO_LABEL[operacao]}</legend>
              <label className="ativar-limite"><input type="checkbox" checked={formulario.operacoes[operacao].ativo} onChange={(event) => alterarOperacao(operacao, 'ativo', event.target.checked)} /> Ativar limite por operação</label>
              <label>Valor máximo por operação (R$)<input type="number" min="0.01" step="0.01" inputMode="decimal" value={formulario.operacoes[operacao].limite_por_operacao} onChange={(event) => alterarOperacao(operacao, 'limite_por_operacao', event.target.value)} disabled={!formulario.operacoes[operacao].ativo} required={formulario.operacoes[operacao].ativo} placeholder="Ex.: 2.000,00" /></label>
              {operacao === 'TRANSFERENCIA' && <>
                <label className="ativar-limite"><input type="checkbox" checked={formulario.operacoes[operacao].favorito_ativo} disabled={!formulario.operacoes[operacao].ativo} onChange={(event) => alterarOperacao(operacao, 'favorito_ativo', event.target.checked)} /> Ativar limite maior para Pix favoritos</label>
                <label>Máximo por operação para favoritos (R$)<input type="number" min="0.01" step="0.01" inputMode="decimal" value={formulario.operacoes[operacao].limite_por_operacao_favorito} onChange={(event) => alterarOperacao(operacao, 'limite_por_operacao_favorito', event.target.value)} disabled={!formulario.operacoes[operacao].favorito_ativo} required={formulario.operacoes[operacao].favorito_ativo} placeholder="Ex.: 5.000,00" /></label>
                <small>Aplicado somente a chaves Pix salvas nos favoritos deste usuário e conta.</small>
              </>}
            </fieldset>)}
            <fieldset className="politica-limite acumulado">
              <legend>Acumulado do período</legend>
              <label className="ativar-limite"><input type="checkbox" checked={Boolean(formulario.acumulado?.ativo)} onChange={(event) => setFormulario((atualForm) => ({ ...atualForm, acumulado: { ...atualForm.acumulado, ativo: event.target.checked } }))} /> Ativar teto acumulado</label>
              <label>Valor máximo total (R$)<input type="number" min="0.01" step="0.01" inputMode="decimal" value={formulario.acumulado?.limite_acumulado ?? ''} onChange={(event) => setFormulario((atualForm) => ({ ...atualForm, acumulado: { ...atualForm.acumulado, limite_acumulado: event.target.value } }))} disabled={!formulario.acumulado?.ativo} required={Boolean(formulario.acumulado?.ativo)} placeholder="Ex.: 8.000,00" /></label>
              <small>O acumulado considera transferências e pagamentos combinados nesta janela.</small>
            </fieldset>
          </div>
          <label className="motivo-limites">Motivo da alteração<textarea minLength="5" maxLength="250" value={motivo} onChange={(event) => setMotivo(event.target.value)} required placeholder="Registre por que esta política está sendo alterada." /></label>
          <button className="botao botao-principal salvar-politica-limites" type="submit" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar política'}</button>
        </form>
        <section className="historico-limites"><h3>Alterações recentes</h3>
          {historico.length ? <div>{historico.slice(0, 8).map((registro) => <article key={registro.id}>
            <span>{registro.evento === 'POLITICA_ATUALIZADA' ? `${registro.tipo_conta} · ${PERIODOS_LABEL[registro.periodo] || registro.periodo}` : `Conta ${registro.id_conta} · ${registro.operacao}`}</span>
            <strong>{registro.motivo}</strong><small>{registro.criado_em ? new Date(registro.criado_em).toLocaleString('pt-BR') : 'Data indisponível'}{registro.id_administrador ? ` · Admin ${registro.id_administrador}` : ''}</small>
          </article>)}</div> : <p>Nenhuma alteração registrada.</p>}
        </section>
      </section>}
    </main>
    <NavegacaoMobile secao="limites" tipoConta={perfil?.tipoConta} />
    {perfilAberto && <ModalPerfil usuario={perfil} fechar={() => setPerfilAberto(false)} aoAtualizar={atualizarPerfil} />}
  </div>
}
