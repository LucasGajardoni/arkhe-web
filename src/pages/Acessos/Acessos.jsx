import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import CabecalhoDashboard from '../../components/Dashboard/CabecalhoDashboard.jsx'
import NavegacaoMobile from '../../components/Dashboard/NavegacaoMobile.jsx'
import ModalPerfil from '../../components/Dashboard/ModalPerfil.jsx'
import Confirmacao from '../../components/Identidade/Confirmacao.jsx'
import ConvidarPessoa from './ConvidarPessoa.jsx'
import { useSessao } from '../../hooks/useSessao.js'
import { encerrarSessao } from '../../services/authService.js'
import { alterarCargo, ativarAcesso, bloquearAcesso, listarAcessos, reenviarConvite, revogarAcesso } from '../../services/acessosService.js'
import { CARGOS, STATUS_ACESSO, proprietarioPJ } from '../../utils/contas.js'
import { mascaraCnpj, mascaraCpf } from '../../utils/formatadores.js'
import '../Dashboard/Dashboard.css'
import '../../components/Identidade/Identidade.css'
import './Acessos.css'

function CartaoAcesso({ acesso, processando, executar, confirmar }) {
  const [cargo, setCargo] = useState(String(acesso.cargo))
  const status = Number(acesso.status)
  return <article className="cartao-identidade">
    <span className={`badge-identidade status-${status}`}>{STATUS_ACESSO[status]}</span>
    <h3>{acesso.nome}</h3><p>{mascaraCpf(acesso.cpf)}</p><p>{acesso.email}</p>
    <p>{CARGOS[acesso.cargo]}</p>
    {acesso.data_convite && <p>Convite: {new Date(acesso.data_convite).toLocaleDateString('pt-BR')}</p>}
    {acesso.data_ativacao && <p>Ativação: {new Date(acesso.data_ativacao).toLocaleDateString('pt-BR')}</p>}
    {status !== 3 && <>
      <div className="campo-identidade"><label htmlFor={`cargo-${acesso.id_acesso}`}>Cargo de {acesso.nome}</label><select id={`cargo-${acesso.id_acesso}`} value={cargo} onChange={(e) => setCargo(e.target.value)} disabled={processando}>{CARGOS.map((nome, i) => <option key={nome} value={i}>{nome}</option>)}</select></div>
      <button type="button" className="botao botao-secundario" disabled={processando || Number(cargo) === Number(acesso.cargo)} onClick={() => executar(() => alterarCargo(acesso.id_acesso, cargo))}>Salvar cargo</button>
      <div className="acoes-identidade">
        {status === 0 && <button type="button" className="botao botao-secundario" disabled={processando} onClick={() => executar(() => reenviarConvite(acesso.id_acesso))}>Reenviar convite</button>}
        {status === 1 && <button type="button" className="botao botao-secundario" disabled={processando} onClick={() => confirmar({ titulo: 'Bloquear acesso?', descricao: `${acesso.nome} deixará de operar esta conta até a reativação.`, acao: () => bloquearAcesso(acesso.id_acesso) })}>Bloquear</button>}
        {status === 2 && <button type="button" className="botao botao-principal" disabled={processando} onClick={() => executar(() => ativarAcesso(acesso.id_acesso))}>Reativar</button>}
        <button type="button" className="botao botao-secundario" disabled={processando} onClick={() => confirmar({ titulo: 'Revogar acesso?', descricao: `O vínculo de ${acesso.nome} será revogado. Para retornar, será necessário um novo convite.`, acao: () => revogarAcesso(acesso.id_acesso) })}>Revogar</button>
      </div>
    </>}
  </article>
}

export default function Acessos() {
  const { perfil, atualizarPerfil, limparSessao, tratarErroSessao } = useSessao()
  const navigate = useNavigate()
  const permitido = proprietarioPJ(perfil)
  const [dados, setDados] = useState({ empresa: {}, acessos: [] })
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [convidando, setConvidando] = useState(false)
  const [perfilAberto, setPerfilAberto] = useState(false)
  const [confirmacao, setConfirmacao] = useState(null)
  const [revisao, setRevisao] = useState(0)
  useEffect(() => {
    if (!permitido) return
    let ativo = true
    listarAcessos().then((resultado) => { if (ativo) setDados(resultado) })
      .catch((falha) => { if (ativo) { setErro(falha.message); tratarErroSessao(falha) } })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [permitido, perfil.idConta, tratarErroSessao, revisao])

  async function executar(acao) {
    if (processando) return
    setProcessando(true); setErro(''); setSucesso('')
    try {
      const resultado = await acao()
      setConfirmacao(null)
      setSucesso(resultado.mensagem || 'Acesso atualizado com sucesso.')
      setCarregando(true)
      setDados(await listarAcessos())
    } catch (falha) { setErro(falha.message); tratarErroSessao(falha) }
    finally { setProcessando(false); setCarregando(false) }
  }
  async function sair() {
    if (processando) return
    setProcessando(true)
    try { await encerrarSessao(); limparSessao(); navigate('/login', { replace: true }) }
    catch (falha) { setErro(falha.message) }
    finally { setProcessando(false) }
  }
  function recarregar() { setCarregando(true); setErro(''); setRevisao((atual) => atual + 1) }
  if (!permitido) return <Navigate to="/dashboard" replace />
  return <div className="pagina-dashboard pagina-acessos">
    <CabecalhoDashboard usuario={perfil} secao="acessos" abrirPerfil={() => setPerfilAberto(true)} sair={sair} />
    <main className="conteudo-dashboard-largo central-identidade">
      <header className="topo-identidade"><div><p className="rotulo-secao">SUA EMPRESA</p><h1>Equipe e acessos</h1><p>Gerencie quem pode operar esta conta empresarial.</p></div>
        <button type="button" className="botao botao-principal" disabled={processando || carregando} onClick={() => setConvidando(true)}>Adicionar pessoa</button>
      </header>
      <section className="empresa-acessos"><h2>{dados.empresa?.nome_fantasia || dados.empresa?.razao_social || perfil.nomeFantasia || perfil.razaoSocial}</h2><p>CNPJ {mascaraCnpj(dados.empresa?.cnpj || perfil.cnpj)}</p></section>
      {erro && <div className="mensagem-identidade erro" role="alert">{erro} <button type="button" onClick={recarregar} disabled={processando || carregando}>Tentar novamente</button></div>}
      {sucesso && <p className="mensagem-identidade" role="status">{sucesso}</p>}
      {carregando ? <p role="status">Carregando equipe...</p> : <>
        {!erro && dados.acessos.length === 0 && <p className="vazio-identidade">Sua equipe ainda não possui acessos. Adicione uma pessoa para enviar o primeiro convite.</p>}
        <div className="grade-identidade">{dados.acessos.map((acesso) => <CartaoAcesso key={`${acesso.id_acesso}-${acesso.cargo}-${acesso.status}`} acesso={acesso} processando={processando} executar={executar} confirmar={(valor) => { setErro(''); setConfirmacao(valor) }} />)}</div>
      </>}
    </main>
    <NavegacaoMobile secao="acessos" tipoConta={perfil.tipoConta} />
    {perfilAberto && <ModalPerfil usuario={perfil} fechar={() => setPerfilAberto(false)} aoAtualizar={atualizarPerfil} />}
    {convidando && <ConvidarPessoa fechar={() => setConvidando(false)} tratarErroSessao={tratarErroSessao} aoConcluir={(mensagem) => { setConvidando(false); setSucesso(mensagem); recarregar() }} />}
    {confirmacao && <Confirmacao {...confirmacao} erro={erro} processando={processando} fechar={() => setConfirmacao(null)} confirmar={() => executar(confirmacao.acao)} />}
  </div>
}
