import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CabecalhoDashboard from '../../components/Dashboard/CabecalhoDashboard.jsx'
import Icone from '../../components/Dashboard/Icone.jsx'
import CampoMoeda from '../../components/Dashboard/CampoMoeda.jsx'
import ModalPerfil from '../../components/Dashboard/ModalPerfil.jsx'
import NavegacaoMobile from '../../components/Dashboard/NavegacaoMobile.jsx'
import { useSessao } from '../../hooks/useSessao.js'
import { encerrarSessao } from '../../services/authService.js'
import {
  atualizarPoliticasLimites,
  atualizarConfiguracaoLimitesConta,
  atualizarLimiteCreditoCartao,
  listarHistoricoLimites,
  listarHistoricoLimitesCartoes,
  listarPoliticasLimites,
  listarCartoesLimitesAdmin,
  obterConfiguracaoLimitesConta,
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
  PAGAMENTO: 'Pagamentos',
}
const moeda = (valor) => valor == null
  ? 'Sem teto configurado'
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

function montarFormularioConta(configuracao, periodo) {
  const regra = configuracao?.periodos?.find((item) => item.periodo === periodo)
  return {
    limite_acumulado: regra?.limite_acumulado_conta == null ? '' : String(regra.limite_acumulado_conta),
    operacoes: Object.fromEntries(OPERACOES.map((operacao) => {
      const valores = regra?.operacoes?.[operacao]
      return [operacao, {
        limite_por_operacao: valores?.limite_por_operacao_conta == null ? '' : String(valores.limite_por_operacao_conta),
        limite_por_operacao_favorito: valores?.limite_por_operacao_favorito_conta == null ? '' : String(valores.limite_por_operacao_favorito_conta),
      }]
    })),
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
  const [configuracaoConta, setConfiguracaoConta] = useState(null)
  const [formularioConta, setFormularioConta] = useState(null)
  const [periodoConta, setPeriodoConta] = useState('DIURNO')
  const periodoContaRef = useRef('DIURNO')
  const [motivoConta, setMotivoConta] = useState('')
  const [cartoes, setCartoes] = useState([])
  const [historicoCartoes, setHistoricoCartoes] = useState([])
  const [cartaoSelecionado, setCartaoSelecionado] = useState('')
  const cartaoSelecionadoRef = useRef('')
  const [limiteCreditoCartao, setLimiteCreditoCartao] = useState('')
  const [motivoCartao, setMotivoCartao] = useState('')
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
  const [secaoAtiva, setSecaoAtiva] = useState('resumo')
  const [abaAdmin, setAbaAdmin] = useState('politicas')

  useEffect(() => {
    if (!perfil?.idConta) return undefined
    let ativo = true
    obterLimitesConta().then(async (dados) => {
      if (!ativo) return
      setResumo(dados)
      setResumoDaConta(perfil.idConta)
      if (dados.pode_configurar_conta) {
        const configuracao = await obterConfiguracaoLimitesConta()
        if (!ativo) return
        setConfiguracaoConta(configuracao)
        setFormularioConta(montarFormularioConta(configuracao, periodoContaRef.current))
      } else {
        setConfiguracaoConta(null)
        setFormularioConta(null)
      }
      if (dados.administrador) {
        const [regras, registros, listaCartoes, auditoriaCartoes] = await Promise.all([
          listarPoliticasLimites(),
          listarHistoricoLimites(),
          listarCartoesLimitesAdmin(),
          listarHistoricoLimitesCartoes(),
        ])
        if (!ativo) return
        setPoliticas(regras)
        setHistorico(registros.historico || [])
        setCartoes(listaCartoes.cartoes || [])
        setHistoricoCartoes(auditoriaCartoes.historico || [])
        const cartaoAtualizado = listaCartoes.cartoes?.find((item) => String(item.id_cartao) === String(cartaoSelecionadoRef.current))
          || listaCartoes.cartoes?.[0]
        cartaoSelecionadoRef.current = String(cartaoAtualizado?.id_cartao || '')
        setCartaoSelecionado(cartaoSelecionadoRef.current)
        setLimiteCreditoCartao(String(cartaoAtualizado?.limite ?? ''))
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

  function alterarLimiteConta(operacao, campo, valor) {
    setFormularioConta((atualForm) => ({
      ...atualForm,
      operacoes: {
        ...atualForm.operacoes,
        [operacao]: { ...atualForm.operacoes[operacao], [campo]: valor },
      },
    }))
  }

  async function salvarLimitesConta(evento) {
    evento.preventDefault()
    setErro('')
    setSucesso('')
    setSalvando(true)
    try {
      await atualizarConfiguracaoLimitesConta({
        periodo: periodoConta,
        motivo: motivoConta.trim(),
        limite_acumulado: formularioConta.limite_acumulado || null,
        operacoes: Object.fromEntries(OPERACOES.map((operacao) => [operacao, {
          limite_por_operacao: formularioConta.operacoes[operacao].limite_por_operacao || null,
          limite_por_operacao_favorito: operacao === 'TRANSFERENCIA'
            && configuracaoConta?.periodos?.find((item) => item.periodo === periodoConta)?.operacoes?.TRANSFERENCIA?.limite_por_operacao_favorito_banco != null
            ? (formularioConta.operacoes[operacao].limite_por_operacao_favorito || null)
            : null,
        }])),
      })
      setSucesso('Limites desta conta atualizados. As demais contas não foram alteradas.')
      setMotivoConta('')
      setRevisao((atual) => atual + 1)
    } catch (falha) {
      setErro(falha.message || 'Não foi possível salvar os limites desta conta.')
      tratarErroSessao(falha)
    } finally {
      setSalvando(false)
    }
  }

  async function salvarLimiteCreditoCartao(evento) {
    evento.preventDefault()
    setErro('')
    setSucesso('')
    setSalvando(true)
    try {
      await atualizarLimiteCreditoCartao(cartaoSelecionado, {
        limite: limiteCreditoCartao,
        motivo: motivoCartao.trim(),
      })
      setSucesso('Crédito do cartão atualizado em CARTAO.LIMITE e registrado na auditoria.')
      setMotivoCartao('')
      setRevisao((atual) => atual + 1)
    } catch (falha) {
      setErro(falha.message || 'Não foi possível atualizar o crédito deste cartão.')
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
  const configuracaoPeriodoConta = configuracaoConta?.periodos?.find((item) => item.periodo === periodoConta)
  const cartaoAtual = cartoes.find((item) => String(item.id_cartao) === String(cartaoSelecionado))
  return <div className="pagina-dashboard pagina-limites">
    <CabecalhoDashboard usuario={perfil} secao="limites" abrirPerfil={() => setPerfilAberto(true)} sair={sair} />
    <main className="conteudo-dashboard-largo conteudo-limites">
      <header className="topo-limites">
        <div>
          <p className="rotulo-secao">PROTEÇÃO DA CONTA</p>
          <h1>Limites da minha conta</h1>
          <p>Veja seus limites, quanto já utilizou e quanto resta. Ajuste seus valores pessoais sem afetar outras contas.</p>
        </div>
        {resumoAtual && <span className="tipo-conta-limites">Conta {resumoAtual.tipo_conta}</span>}
      </header>

      {erro && <p className="mensagem-limites erro" role="alert">{erro}</p>}
      {sucesso && <p className="mensagem-limites sucesso" role="status">{sucesso}</p>}
      <nav className="abas-limites" aria-label="Seções de limites">
        <button type="button" aria-current={secaoAtiva === 'resumo' ? 'page' : undefined} onClick={() => setSecaoAtiva('resumo')}>Minha situação</button>
        {resumoAtual?.pode_configurar_conta && <button type="button" aria-current={secaoAtiva === 'pessoal' ? 'page' : undefined} onClick={() => setSecaoAtiva('pessoal')}>Ajustar meus limites</button>}
        {administradorAtual && <button type="button" aria-current={secaoAtiva === 'administracao' ? 'page' : undefined} onClick={() => setSecaoAtiva('administracao')}>Administração do banco</button>}
      </nav>

      {secaoAtiva === 'resumo' && (contaAtualCarregando ? <div className="estado-limites">Carregando limites da conta…</div> : atualDaConta ? <>
        <section className="resumo-limites" aria-label="Resumo dos limites atuais">
          <div className="resumo-limites-titulo">
            <span className="icone-limites"><Icone nome="transferir" tamanho={22} /></span>
            <div><p>PERÍODO ATUAL</p><h2>{PERIODOS_LABEL[atualDaConta.periodo]}</h2></div>
          </div>
          <div className="metricas-limites">
            <article><span>Já movimentado no período</span><strong>{moeda(atualDaConta.utilizado)}</strong></article>
            <article><span>Teto total do período</span><strong>{moeda(atualDaConta.limite_acumulado)}</strong></article>
            <article><span>Ainda disponível pelo limite</span><strong>{moeda(atualDaConta.disponivel_periodo)}</strong></article>
          </div>
          {atualDaConta.limite_acumulado == null && <p className="explicacao-sem-teto">Não há teto acumulado configurado neste horário. Isso não significa saldo ilimitado: ainda valem saldo, autenticação e demais regras de segurança.</p>}
          <small>Horário de São Paulo · Período válido até {new Date(`${atualDaConta.fim}-03:00`).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>
        </section>

        <section className="operacoes-limites" aria-label="Limites por tipo de operação">
          {atualDaConta.operacoes?.map((item) => <article className="cartao-operacao-limite" key={item.operacao}>
            <div className="titulo-operacao-limite"><span><Icone nome={item.operacao === 'TRANSFERENCIA' ? 'transferir' : 'boleto'} tamanho={19} /></span><h2>{OPERACAO_LABEL[item.operacao]}</h2></div>
            <dl>
              <div><dt>Teto por operação</dt><dd>{moeda(item.limite_por_operacao)}</dd></div>
              <div><dt>Posso movimentar agora pelo limite</dt><dd>{moeda(item.disponivel_agora)}</dd></div>
              {item.operacao === 'TRANSFERENCIA' && item.limite_por_operacao_favorito != null && (
                <>
                  <div><dt>Máximo para destinatários favoritos</dt><dd>{moeda(item.limite_por_operacao_favorito)}</dd></div>
                  <div><dt>Disponível agora para favoritos</dt><dd>{moeda(item.disponivel_favorito_agora)}</dd></div>
                </>
              )}
            </dl>
            {!item.configurado && <p>Sem teto operacional cadastrado. O titular pode criar uma restrição pessoal nesta conta.</p>}
          </article>)}
        </section>
        {resumoAtual?.pode_configurar_conta && <div className="acoes-resumo-limites"><button type="button" className="botao botao-principal" onClick={() => setSecaoAtiva('pessoal')}>Quero ajustar meus limites</button></div>}
      </> : !erro && <div className="estado-limites">Não foi possível encontrar a conta ativa.</div>)}

      {secaoAtiva === 'pessoal' && resumo?.pode_configurar_conta && configuracaoPeriodoConta && formularioConta && <section className="admin-limites limites-da-conta">
        <header className="admin-limites-cabecalho">
          <div><p className="rotulo-secao">CONTA {configuracaoConta.tipo_conta}</p><h2>Escolha seus limites pessoais</h2><p>Esses valores valem somente para esta conta. Se houver um teto bancário, seu limite não pode ultrapassá-lo.</p></div>
        </header>
        <form onSubmit={salvarLimitesConta} className="form-ajuste-individual">
          <div className="filtros-limites">
            <label>Período que deseja alterar
              <select value={periodoConta} onChange={(event) => { const valor = event.target.value; periodoContaRef.current = valor; setPeriodoConta(valor); setFormularioConta(montarFormularioConta(configuracaoConta, valor)) }}>
                {PERIODOS.map((nome) => <option key={nome} value={nome}>{PERIODOS_LABEL[nome]}</option>)}
              </select>
            </label>
            <div className="aviso-teto-limites">Deixe um campo vazio para usar o teto do banco. Quando não há política específica, o Arkhé aplica o teto de segurança de R$ 5.000,00. Você pode reduzir seus limites, mas não aumentá-los além do autorizado.</div>
          </div>
          <div className="limites-ajustes-rapidos">
            {OPERACOES.map((operacao) => {
              const banco = configuracaoPeriodoConta.operacoes[operacao]
              return <div className="ajuste-limite-linha" key={operacao}>
                <div><strong>{OPERACAO_LABEL[operacao]}</strong><small>Máximo bancário: {moeda(banco.limite_por_operacao_banco)}</small></div>
                <label>Meu máximo por operação (R$)
                  <CampoMoeda minValue={0.01}  maxValue={banco.limite_por_operacao_banco ?? undefined}
                    value={formularioConta.operacoes[operacao].limite_por_operacao}
                    onChange={(valor) => alterarLimiteConta(operacao, 'limite_por_operacao', valor)}
                    placeholder="Usar regra do banco" inputMode="decimal" />
                </label>
                {operacao === 'TRANSFERENCIA' && banco.limite_por_operacao_favorito_banco != null && <label>Meu máximo para Pix favoritos (R$)
                  <CampoMoeda minValue={0.01}  maxValue={banco.limite_por_operacao_favorito_banco}
                    value={formularioConta.operacoes[operacao].limite_por_operacao_favorito}
                    onChange={(valor) => alterarLimiteConta(operacao, 'limite_por_operacao_favorito', valor)}
                    placeholder="Usar limite normal" inputMode="decimal" />
                </label>}
                {operacao === 'TRANSFERENCIA' && banco.limite_por_operacao_favorito_banco == null && <small className="aviso-favorito-limites">O banco não habilitou um teto especial para favoritos. Vale o teto normal de transferências.</small>}
              </div>
            })}
            <div className="limite-padrao-rapido">
              <div><strong>Proteção padrão de R$ 5.000,00</strong><small>O valor é o teto quando o banco não definiu regra própria. Você pode escolher um limite pessoal menor.</small></div>
              <button type="button" onClick={() => setFormularioConta((atualForm) => {
                const teto = (valor) => Math.min(5000, Number(valor ?? 5000)).toFixed(2)
                return {
                  ...atualForm,
                  limite_acumulado: teto(configuracaoPeriodoConta.limite_acumulado_banco),
                  operacoes: Object.fromEntries(OPERACOES.map((item) => [item, {
                    ...atualForm.operacoes[item],
                    limite_por_operacao: teto(configuracaoPeriodoConta.operacoes[item].limite_por_operacao_banco),
                  }])),
                }
              })}>Preencher R$ 5.000</button>
            </div>
            <div className="ajuste-limite-linha">
              <div><strong>Teto total de movimentações no período</strong>
                <small>Máximo bancário: {moeda(configuracaoPeriodoConta.limite_acumulado_banco)}</small></div>
              <label>Meu máximo total no período (R$)
                <CampoMoeda minValue={0.01}  maxValue={configuracaoPeriodoConta.limite_acumulado_banco ?? undefined}
                  value={formularioConta.limite_acumulado}
                  onChange={(valor) => setFormularioConta((atualForm) => ({ ...atualForm, limite_acumulado: valor }))}
                  placeholder="Usar regra do banco" inputMode="decimal" />
              </label>
            </div>
          </div>
          <label className="motivo-limites">Por que deseja alterar?
            <textarea minLength="5" maxLength="250" value={motivoConta} onChange={(event) => setMotivoConta(event.target.value)}
              required placeholder="Ex.: quero limitar minhas transferências por segurança." />
          </label>
          <button className="botao botao-principal salvar-politica-limites" type="submit" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar meus limites'}</button>
        </form>
      </section>}

      {secaoAtiva === 'administracao' && administradorAtual && formulario && <section className="admin-limites">
        <header className="admin-limites-cabecalho">
          <div><p className="rotulo-secao">ADMINISTRAÇÃO BANCÁRIA</p><h2>{abaAdmin === 'politicas' ? 'Políticas gerais PF/PJ' : abaAdmin === 'cartoes' ? 'Crédito por cartão' : 'Histórico das alterações'}</h2><p>{abaAdmin === 'politicas' ? 'Defina os tetos gerais por tipo de conta e horário.' : abaAdmin === 'cartoes' ? 'Crédito não é a mesma coisa que limite de Pix ou pagamentos.' : 'Veja as justificativas e registros das mudanças realizadas.'}</p></div>
        </header>
        <nav className="subabas-limites" aria-label="Áreas administrativas">
          <button type="button" aria-current={abaAdmin === 'politicas' ? 'page' : undefined} onClick={() => setAbaAdmin('politicas')}>Políticas PF/PJ</button>
          <button type="button" aria-current={abaAdmin === 'cartoes' ? 'page' : undefined} onClick={() => setAbaAdmin('cartoes')}>Crédito dos cartões</button>
          <button type="button" aria-current={abaAdmin === 'historico' ? 'page' : undefined} onClick={() => setAbaAdmin('historico')}>Histórico de mudanças</button>
        </nav>
        {abaAdmin === 'politicas' && <form onSubmit={salvarPolitica}>
          <div className="filtros-limites">
            <label>Tipo de conta<select value={tipoConta} onChange={(event) => { const valor = event.target.value; tipoContaRef.current = valor; setTipoConta(valor); setFormulario(montarFormulario(politicas, valor, periodo)) }}>{TIPOS.map((tipo) => <option key={tipo}>{tipo}</option>)}</select></label>
            <label>Período<select value={periodo} onChange={(event) => { const valor = event.target.value; periodoRef.current = valor; setPeriodo(valor); setFormulario(montarFormulario(politicas, tipoConta, valor)) }}>{PERIODOS.map((nome) => <option key={nome} value={nome}>{PERIODOS_LABEL[nome]}</option>)}</select></label>
          </div>
          <div className="grade-politicas-limites">
            {OPERACOES.map((operacao) => <fieldset className="politica-limite" key={operacao}>
              <legend>{OPERACAO_LABEL[operacao]}</legend>
              <label className="ativar-limite"><input type="checkbox" checked={formulario.operacoes[operacao].ativo} onChange={(event) => alterarOperacao(operacao, 'ativo', event.target.checked)} /> Ativar limite por operação</label>
              <label>Valor máximo por operação (R$)<CampoMoeda minValue={0.01}  inputMode="decimal" value={formulario.operacoes[operacao].limite_por_operacao} onChange={(valor) => alterarOperacao(operacao, 'limite_por_operacao', valor)} disabled={!formulario.operacoes[operacao].ativo} required={formulario.operacoes[operacao].ativo} placeholder="Ex.: 2.000,00" /></label>
              {operacao === 'TRANSFERENCIA' && <>
                <label className="ativar-limite"><input type="checkbox" checked={formulario.operacoes[operacao].favorito_ativo} disabled={!formulario.operacoes[operacao].ativo} onChange={(event) => alterarOperacao(operacao, 'favorito_ativo', event.target.checked)} /> Ativar limite maior para Pix favoritos</label>
                <label>Máximo por operação para favoritos (R$)<CampoMoeda minValue={0.01}  inputMode="decimal" value={formulario.operacoes[operacao].limite_por_operacao_favorito} onChange={(valor) => alterarOperacao(operacao, 'limite_por_operacao_favorito', valor)} disabled={!formulario.operacoes[operacao].favorito_ativo} required={formulario.operacoes[operacao].favorito_ativo} placeholder="Ex.: 5.000,00" /></label>
                <small>Aplicado somente a chaves Pix salvas nos favoritos deste usuário e conta.</small>
              </>}
            </fieldset>)}
            <fieldset className="politica-limite acumulado">
              <legend>Acumulado do período</legend>
              <label className="ativar-limite"><input type="checkbox" checked={Boolean(formulario.acumulado?.ativo)} onChange={(event) => setFormulario((atualForm) => ({ ...atualForm, acumulado: { ...atualForm.acumulado, ativo: event.target.checked } }))} /> Ativar teto acumulado</label>
              <label>Valor máximo total (R$)<CampoMoeda minValue={0.01}  inputMode="decimal" value={formulario.acumulado?.limite_acumulado ?? ''} onChange={(valor) => setFormulario((atualForm) => ({ ...atualForm, acumulado: { ...atualForm.acumulado, limite_acumulado: valor } }))} disabled={!formulario.acumulado?.ativo} required={Boolean(formulario.acumulado?.ativo)} placeholder="Ex.: 8.000,00" /></label>
              <small>O acumulado considera transferências e pagamentos combinados nesta janela.</small>
            </fieldset>
          </div>
          <label className="motivo-limites">Motivo da alteração<textarea minLength="5" maxLength="250" value={motivo} onChange={(event) => setMotivo(event.target.value)} required placeholder="Registre por que esta política está sendo alterada." /></label>
          <button className="botao botao-principal salvar-politica-limites" type="submit" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar política'}</button>
        </form>}
        {abaAdmin === 'cartoes' && <section className="credito-cartao-admin" aria-labelledby="titulo-credito-cartao">
          <div className="credito-cartao-cabecalho"><p className="rotulo-secao">CRÉDITO, SEM REGRA DE HORÁRIO</p><h3 id="titulo-credito-cartao">Limite de crédito por cartão</h3><p>Este é o crédito persistido em CARTAO.LIMITE. Não altera os limites operacionais de pagamentos ou transferências. Somente administradores bancários podem alterá-lo.</p></div>
          {cartoes.length ? <>
            <div className="cartoes-limites-lista" aria-label="Cartões e créditos atuais">
              {cartoes.map((cartao) => <article key={cartao.id_cartao}>
                <span>Cartão •••• {cartao.final_cartao} · Conta {cartao.id_conta} ({cartao.tipo_conta})</span>
                <strong>{moeda(cartao.limite)}</strong>
                <small>Utilizado {moeda(cartao.utilizado)} · disponível {moeda(cartao.disponivel)}</small>
              </article>)}
            </div>
            <form className="form-cartao-credito" onSubmit={salvarLimiteCreditoCartao}>
              <label>Cartão<select value={cartaoSelecionado} onChange={(event) => { const valor = event.target.value; cartaoSelecionadoRef.current = valor; setCartaoSelecionado(valor); const encontrado = cartoes.find((item) => String(item.id_cartao) === valor); setLimiteCreditoCartao(String(encontrado?.limite ?? '')) }}>{cartoes.map((item) => <option key={item.id_cartao} value={item.id_cartao}>•••• {item.final_cartao} · Conta {item.id_conta} · {item.tipo_conta}</option>)}</select></label>
              {cartaoAtual && <p>Crédito atual {moeda(cartaoAtual.limite)} · utilizado {moeda(cartaoAtual.utilizado)} · disponível {moeda(cartaoAtual.disponivel)}</p>}
              <label>Novo limite de crédito (R$)<CampoMoeda minValue={cartaoAtual?.utilizado ?? '0.01'}  inputMode="decimal" value={limiteCreditoCartao} onChange={(valor) => setLimiteCreditoCartao(valor)} required /></label>
              <label className="motivo-limites">Motivo da alteração<textarea minLength="5" maxLength="250" value={motivoCartao} onChange={(event) => setMotivoCartao(event.target.value)} required placeholder="Registre a justificativa administrativa." /></label>
              <button className="botao botao-principal salvar-politica-limites" type="submit" disabled={salvando || !cartaoSelecionado}>{salvando ? 'Salvando…' : 'Salvar crédito do cartão'}</button>
            </form>
            <div className="historico-limites"><h3>Auditoria de crédito dos cartões</h3>
              {historicoCartoes.length ? <div>{historicoCartoes.slice(0, 8).map((registro) => <article key={registro.id}><span>Cartão {registro.id_cartao} · Conta {registro.id_conta} · Admin {registro.id_administrador}</span><strong>{moeda(registro.limite_anterior)} → {moeda(registro.limite_novo)} · {registro.motivo}</strong><small>{registro.criado_em ? new Date(registro.criado_em).toLocaleString('pt-BR') : 'Data indisponível'}</small></article>)}</div> : <p>Nenhuma alteração de crédito registrada.</p>}
            </div>
          </> : <p className="aviso-teto-limites">Nenhum cartão encontrado para administrar.</p>}
        </section>}
        {abaAdmin === 'historico' && <section className="historico-limites"><h3>Alterações recentes</h3>
          {historico.length ? <div>{historico.slice(0, 8).map((registro) => <article key={registro.id}>
            <span>{registro.evento === 'POLITICA_ATUALIZADA' ? `${registro.tipo_conta} · ${PERIODOS_LABEL[registro.periodo] || registro.periodo}` : `Conta ${registro.id_conta} · ${registro.operacao}`}</span>
            <strong>{registro.motivo}</strong><small>{registro.criado_em ? new Date(registro.criado_em).toLocaleString('pt-BR') : 'Data indisponível'}{registro.id_administrador ? ` · Admin ${registro.id_administrador}` : ''}</small>
          </article>)}</div> : <p>Nenhuma alteração registrada.</p>}
        </section>}
      </section>}
    </main>
    <NavegacaoMobile secao="limites" tipoConta={perfil?.tipoConta} />
    {perfilAberto && <ModalPerfil usuario={perfil} fechar={() => setPerfilAberto(false)} aoAtualizar={atualizarPerfil} />}
  </div>
}
