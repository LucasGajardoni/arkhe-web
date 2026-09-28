import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import CabecalhoDashboard from '../../components/Dashboard/CabecalhoDashboard.jsx'
import NavegacaoMobile from '../../components/Dashboard/NavegacaoMobile.jsx'
import ModalPerfil from '../../components/Dashboard/ModalPerfil.jsx'
import Icone from '../../components/Dashboard/Icone.jsx'
import Confirmacao from '../../components/Identidade/Confirmacao.jsx'
import { useSessao } from '../../hooks/useSessao.js'
import { encerrarSessao } from '../../services/authService.js'
import { adicionarFuncionario, alterarStatusFuncionario, buscarFolha, criarFolha, editarFuncionario, listarFuncionarios, pagarFolha, revalidarFolha } from '../../services/folhaService.js'
import Funcionarios from './Funcionarios.jsx'
import PreviaFolha from './PreviaFolha.jsx'
import HistoricoFolhas from './HistoricoFolhas.jsx'
import ModalFuncionario from './ModalFuncionario.jsx'
import ModalConfirmarPagamento from './ModalConfirmarPagamento.jsx'
import { idFolhaValido, mensagemErroPagamento, meses, podePagar } from './folhaUtils.js'
import '../Dashboard/Dashboard.css'
import '../../components/Identidade/Identidade.css'
import './Folha.css'

export default function Folha() {
  const { perfil } = useSessao()
  const [parametros, setParametros] = useSearchParams()
  const location = useLocation()
  const id = parametros.get('folha')
  if (perfil?.tipoConta !== 'PJ') return <Navigate to="/dashboard" replace />
  function selecionarFolha(novoId, existente = false) {
    const proximos = new URLSearchParams(parametros)
    if (novoId) proximos.set('folha', String(novoId))
    else proximos.delete('folha')
    setParametros(proximos, { state: { folhaExistente: existente ? String(novoId) : null } })
  }
  // Cada conta/URL começa com dados e confirmações próprios.
  return <CentralFolha key={`${perfil.idConta}:${id ?? 'nova'}`} id={id} selecionarFolha={selecionarFolha} existente={id !== null && location.state?.folhaExistente === id} />
}

function CentralFolha({ id, selecionarFolha, existente }) {
  const { perfil, atualizarPerfil, limparSessao, tratarErroSessao } = useSessao()
  const navigate = useNavigate()
  const [aba, setAba] = useState('folha')
  const [funcionarios, setFuncionarios] = useState([])
  const [carregandoEquipe, setCarregandoEquipe] = useState(true)
  const [erroEquipe, setErroEquipe] = useState('')
  const [folha, setFolha] = useState(null)
  const [carregandoFolha, setCarregandoFolha] = useState(id !== null && idFolhaValido(id))
  const [erroFolha, setErroFolha] = useState(id !== null && !idFolhaValido(id) ? 'O link da folha é inválido. Selecione outra competência para continuar.' : '')
  const [operacao, setOperacao] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(existente ? 'Essa competência já possui uma folha. Abrimos a folha existente.' : '')
  const [revisaoHistorico, setRevisaoHistorico] = useState(0)
  const [modal, setModal] = useState(null)
  const [perfilAberto, setPerfilAberto] = useState(false)
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState(new Date().getFullYear())
  const trava = useRef(false)
  const montado = useRef(false)
  const bloqueado = Boolean(operacao)

  useEffect(() => {
    montado.current = true
    let ativo = true
    listarFuncionarios().then((dados) => { if (ativo) setFuncionarios(dados) })
      .catch((falha) => { if (ativo) { setErroEquipe(falha.message); tratarErroSessao(falha) } })
      .finally(() => { if (ativo) setCarregandoEquipe(false) })
    if (id !== null && idFolhaValido(id)) {
      buscarFolha(id).then((dados) => { if (ativo) setFolha(dados) })
        .catch((falha) => { if (ativo) { setErroFolha(falha.message); tratarErroSessao(falha) } })
        .finally(() => { if (ativo) setCarregandoFolha(false) })
    }
    return () => { ativo = false; montado.current = false }
  }, [id, tratarErroSessao])

  async function atualizarEquipe() {
    setCarregandoEquipe(true)
    setErroEquipe('')
    try { const dados = await listarFuncionarios(); if (montado.current) setFuncionarios(dados) }
    catch (falha) { if (montado.current) { setErroEquipe(falha.message); tratarErroSessao(falha) } }
    finally { if (montado.current) setCarregandoEquipe(false) }
  }

  async function atualizarFolha() {
    setCarregandoFolha(true)
    setErroFolha('')
    try {
      const dados = await buscarFolha(id)
      if (montado.current) setFolha(dados)
      return dados
    } catch (falha) {
      if (montado.current) {
        setErroFolha('Não foi possível atualizar a folha. Atualize a situação antes de realizar outro pagamento. ' + falha.message)
        tratarErroSessao(falha)
      }
      return null
    } finally { if (montado.current) setCarregandoFolha(false) }
  }

  async function executar(nome, acao) {
    if (trava.current) return
    trava.current = true
    setOperacao(nome); setErro(''); setSucesso('')
    try { await acao() }
    catch (falha) {
      if (montado.current) {
        setErro(nome === 'pagamento' ? mensagemErroPagamento(falha) : falha.message || 'Não foi possível concluir a solicitação.')
        tratarErroSessao(falha)
        // Mesmo com falha de conexão, o backend pode ter concluído o débito.
        if (nome === 'pagamento') {
          setModal(null)
          setRevisaoHistorico((atual) => atual + 1)
          await atualizarFolha()
        }
      }
    } finally {
      trava.current = false
      if (montado.current) setOperacao('')
    }
  }

  function abrirModal(valor) { if (!trava.current) { setErro(''); setModal(valor) } }
  function fecharModal() { if (!trava.current) setModal(null) }
  function salvarFuncionario(dados) {
    return executar('funcionario', async () => {
      const resultado = await (modal.funcionario ? editarFuncionario(dados) : adicionarFuncionario(dados))
      if (!montado.current) return
      setModal(null); setAba('funcionarios')
      setSucesso(resultado.mensagem || 'Funcionário salvo com sucesso.')
      await atualizarEquipe()
    })
  }
  function mudarStatus(funcionario) {
    return executar('status', async () => {
      const resultado = await alterarStatusFuncionario(funcionario.id_funcionario, Number(funcionario.status) === 1 ? 0 : 1)
      if (!montado.current) return
      setModal(null); setSucesso(resultado.mensagem || 'Status do funcionário atualizado.')
      await atualizarEquipe()
    })
  }
  function gerar(evento) {
    evento.preventDefault()
    if (!Number.isInteger(Number(ano)) || Number(ano) < 1 || Number(ano) > 9999) return
    executar('criacao', async () => {
      let resultado
      let existente = false
      try { resultado = await criarFolha(mes, ano) }
      catch (falha) {
        if (falha.status === 409 && idFolhaValido(falha.dados?.id_folha)) {
          resultado = falha.dados
          existente = true
        }
        else throw falha
      }
      if (!idFolhaValido(resultado.id_folha)) throw new Error('Não foi possível abrir a prévia da folha. Tente novamente.')
      // A nova URL remonta a central e consulta a prévia e o histórico atualizado.
      if (montado.current) selecionarFolha(resultado.id_folha, existente)
    })
  }
  function revalidar() {
    if (!folha || [2, 3].includes(Number(folha.status)) || carregandoFolha || erroFolha) return
    executar('revalidacao', async () => {
      const resultado = await revalidarFolha(id)
      if (!montado.current) return
      const quantidade = Number(resultado.revalidados)
      if (quantidade > 0) setRevisaoHistorico((atual) => atual + 1)
      setSucesso(quantidade > 0
        ? quantidade === 1 ? '1 funcionário foi atualizado.' : `${quantidade} funcionários foram atualizados.`
        : 'Os funcionários pendentes ainda não possuem uma conta PF Arkhé.')
      await atualizarFolha()
    })
  }
  function pagar() {
    if (!podePagar(folha) || carregandoFolha || erroFolha) return
    executar('pagamento', async () => {
      const resultado = await pagarFolha(id)
      if (!montado.current) return
      setRevisaoHistorico((atual) => atual + 1)
      setModal(null)
      const atualizada = await atualizarFolha()
      if (!montado.current) return
      const status = Number(atualizada?.status ?? resultado.status)
      setSucesso(status === 3 ? 'Folha paga com sucesso.' : status === 4
        ? 'Os pagamentos disponíveis foram concluídos. Confira os funcionários restantes na prévia.'
        : resultado.mensagem || 'Solicitação de pagamento recebida. Confira a situação da folha.')
    })
  }
  function sair() {
    executar('saida', async () => { await encerrarSessao(); limparSessao(); navigate('/login', { replace: true }) })
  }

  return <div className="pagina-dashboard pagina-folha">
    <CabecalhoDashboard usuario={perfil} secao="folha" abrirPerfil={() => { if (!trava.current) setPerfilAberto(true) }} sair={sair} />
    <main className="conteudo-dashboard-largo folha-conteudo">
      <header className="folha-cabecalho"><div><p className="rotulo-secao">EMPRESA</p><h1>Folha de pagamento</h1><p>Gerencie sua equipe e processe os pagamentos mensais da empresa.</p></div><button type="button" className="botao botao-principal" disabled={bloqueado || carregandoEquipe} onClick={() => abrirModal({ tipo: 'funcionario' })}><Icone nome="mais" tamanho={18} />Adicionar funcionário</button></header>
      <div className="folha-abas" role="group" aria-label="Áreas da folha de pagamento">
        {[['folha', 'Folha do mês'], ['funcionarios', 'Funcionários']].map(([valor, texto]) => <button type="button" key={valor} aria-pressed={aba === valor} onClick={() => setAba(valor)} disabled={bloqueado}>{texto}</button>)}
      </div>
      {erro && !modal && <div className="mensagem-identidade erro" role="alert">{erro}{!id && <p>Confira a equipe na área Funcionários antes de gerar a folha.</p>}</div>}
      {sucesso && <p className="mensagem-identidade" role="status">{sucesso}</p>}
      {bloqueado && operacao !== 'pagamento' && <p role="status">{operacao === 'revalidacao' ? 'Verificando funcionários pendentes...' : 'Aguarde, concluindo solicitação...'}</p>}
      {aba === 'funcionarios' ? <Funcionarios funcionarios={funcionarios} carregando={carregandoEquipe} erro={erroEquipe} atualizar={atualizarEquipe} bloqueado={bloqueado || carregandoEquipe} editar={(funcionario) => abrirModal({ tipo: 'funcionario', funcionario })} alterarStatus={(funcionario) => Number(funcionario.status) === 1 ? abrirModal({ tipo: 'status', funcionario }) : mudarStatus(funcionario)} /> : <>
        {id === null && <section className="bloco-dashboard folha-gerar"><div className="folha-icone"><Icone nome="folha" tamanho={30} /></div><h2>Prepare a folha do mês</h2><p>Selecione a competência para conferir os funcionários e valores antes de pagar.</p><form onSubmit={gerar}><fieldset disabled={bloqueado}><legend>Competência</legend><div className="folha-competencia"><div className="campo-identidade"><label htmlFor="folha-mes">Mês</label><select id="folha-mes" value={mes} onChange={(e) => setMes(e.target.value)}>{meses.map((nome, indice) => <option value={indice + 1} key={nome}>{nome}</option>)}</select></div><div className="campo-identidade"><label htmlFor="folha-ano">Ano</label><input id="folha-ano" type="number" inputMode="numeric" min="1" max="9999" step="1" value={ano} onChange={(e) => setAno(e.target.value)} required /></div></div><button className="botao botao-principal" type="submit" disabled={bloqueado}>{operacao === 'criacao' ? 'Gerando prévia...' : 'Gerar prévia da folha'}</button></fieldset></form><p className="folha-ajuda">Uma folha por competência. Apenas funcionários ativos serão incluídos.</p></section>}
        {carregandoFolha && <p className="folha-estado" role="status">Carregando folha de pagamento...</p>}
        {erroFolha && <div className="mensagem-identidade erro" role="alert"><p>{erroFolha}</p><div className="folha-acoes">{idFolhaValido(id) && <button className="botao botao-secundario" type="button" onClick={atualizarFolha} disabled={bloqueado || carregandoFolha}>Tentar novamente</button>}<button className="botao botao-secundario" type="button" disabled={bloqueado} onClick={() => selecionarFolha(null)}>Outra competência</button></div></div>}
        {folha && <PreviaFolha folha={folha} bloqueado={bloqueado || carregandoFolha || Boolean(erroFolha)} pagar={() => abrirModal({ tipo: 'pagamento' })} revalidar={revalidar} atualizar={atualizarFolha} outraCompetencia={() => selecionarFolha(null)} />}
      </>}
      <HistoricoFolhas revisao={revisaoHistorico} bloqueado={bloqueado || carregandoFolha} visivel={aba === 'folha'} abrir={(novoId) => {
        if (trava.current) return
        if (String(novoId) === id) atualizarFolha()
        else selecionarFolha(novoId)
      }} />
    </main>
    <NavegacaoMobile secao="folha" tipoConta={perfil.tipoConta} />
    {perfilAberto && <ModalPerfil usuario={perfil} fechar={() => setPerfilAberto(false)} aoAtualizar={atualizarPerfil} />}
    {modal?.tipo === 'funcionario' && <ModalFuncionario funcionario={modal.funcionario} fechar={fecharModal} salvar={salvarFuncionario} processando={bloqueado} erro={erro} />}
    {modal?.tipo === 'status' && <Confirmacao titulo={`Desativar ${modal.funcionario.nome}?`} descricao="Ele não será incluído nas próximas folhas de pagamento. Folhas anteriores não serão alteradas." fechar={fecharModal} confirmar={() => mudarStatus(modal.funcionario)} processando={bloqueado} erro={erro} />}
    {modal?.tipo === 'pagamento' && folha && <ModalConfirmarPagamento folha={folha} fechar={fecharModal} confirmar={pagar} processando={bloqueado} bloqueado={carregandoFolha || Boolean(erroFolha) || !podePagar(folha)} erro={erro} />}
  </div>
}
