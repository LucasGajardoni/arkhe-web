import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LayoutIdentidade from '../../components/Identidade/LayoutIdentidade.jsx'
import Confirmacao from '../../components/Identidade/Confirmacao.jsx'
import { useSessao } from '../../hooks/useSessao.js'
import { obterContasDisponiveis } from '../../services/authService.js'
import { aceitarConvite, listarConvitesPendentes, recusarConvite } from '../../services/acessosService.js'
import { CARGOS, possuiContaPropria } from '../../utils/contas.js'
import { mascaraCnpj } from '../../utils/formatadores.js'

export default function SelecionarConta() {
  const navigate = useNavigate()
  const { selecionarConta, tratarErroSessao } = useSessao()
  const [dados, setDados] = useState({ contas: [], convites: [] })
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [recusa, setRecusa] = useState(null)
  const [revisao, setRevisao] = useState(0)
  const buscar = useCallback(async () => {
    const [contas, convites] = await Promise.all([obterContasDisponiveis(), listarConvitesPendentes()])
    return { contas: contas.contas || [], convites: convites.convites || [] }
  }, [])
  useEffect(() => {
    let ativo = true
    buscar().then((resultado) => { if (ativo) setDados(resultado) })
      .catch((falha) => { if (ativo) { setErro(falha.message); tratarErroSessao(falha) } })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [buscar, tratarErroSessao, revisao])

  async function entrar(id) {
    if (processando) return
    setProcessando(true); setErro(''); setSucesso('')
    try { await selecionarConta(id); navigate('/dashboard', { replace: true }) }
    catch (falha) { setErro(falha.message); tratarErroSessao(falha) }
    finally { setProcessando(false) }
  }
  async function responderConvite(id, aceitar) {
    if (processando) return
    setProcessando(true); setErro(''); setSucesso('')
    try {
      await (aceitar ? aceitarConvite(id) : recusarConvite(id))
      setRecusa(null)
      setSucesso(aceitar ? 'Convite aceito. Escolha a conta empresarial para entrar.' : 'Convite recusado.')
      setCarregando(true)
      setDados(await buscar())
    } catch (falha) { setErro(falha.message); tratarErroSessao(falha) }
    finally { setProcessando(false); setCarregando(false) }
  }
  function tentarNovamente() {
    setErro(''); setCarregando(true); setRevisao((atual) => atual + 1)
  }
  const podeAbrir = !possuiContaPropria(dados.contas, 'PF') || !possuiContaPropria(dados.contas, 'PJ')
  return <LayoutIdentidade ocupado={processando} titulo="Escolha sua conta" descricao="Seu acesso é único. Você decide qual conta pessoal ou empresarial deseja operar.">
    {erro && <div className="mensagem-identidade erro" role="alert">{erro} <button type="button" disabled={processando || carregando} onClick={tentarNovamente}>Tentar novamente</button></div>}
    {sucesso && <p className="mensagem-identidade" role="status">{sucesso}</p>}
    {carregando ? <p role="status">Carregando contas e convites...</p> : <>
      {dados.convites.length > 0 && <section className="secao-identidade" aria-labelledby="titulo-convites">
        <h2 id="titulo-convites">Convites pendentes</h2>
        <div className="grade-identidade">{dados.convites.map((convite) => <article className="cartao-identidade" key={convite.id_acesso}>
          <span className="badge-identidade status-0">Convite pendente</span>
          <h3>{convite.nome_fantasia || convite.razao_social || convite.empresa}</h3>
          <p>{convite.cargo_nome || CARGOS[convite.cargo]}</p>
          {convite.cnpj && <p>CNPJ {mascaraCnpj(convite.cnpj)}</p>}
          {convite.data_convite && <p>Convidado em {new Date(convite.data_convite).toLocaleDateString('pt-BR')}</p>}
          <div className="acoes-identidade">
            <button type="button" className="botao botao-principal" disabled={processando} onClick={() => responderConvite(convite.id_acesso, true)}>Aceitar</button>
            <button type="button" className="botao botao-secundario" disabled={processando} onClick={() => { setErro(''); setRecusa(convite) }}>Recusar</button>
          </div>
        </article>)}</div>
      </section>}
      <section className="secao-identidade" aria-labelledby="titulo-contas">
        <h2 id="titulo-contas">Contas disponíveis</h2>
        {!erro && dados.contas.length === 0 && <p className="vazio-identidade">{dados.convites.length ? 'Aceite um convite para acessar uma conta empresarial, ou abra sua própria conta.' : 'Você ainda não possui uma conta própria nem acessos ativos.'}</p>}
        <div className="grade-identidade">{dados.contas.map((conta) => <article className="cartao-identidade" key={conta.id_conta}>
          <span className="badge-identidade">{conta.vinculo === 'titular' ? 'Conta pessoal' : conta.vinculo === 'proprietario' ? 'Proprietário' : 'Você possui acesso'}</span>
          <h3>{Number(conta.tipo_conta) === 0 ? 'Conta pessoal' : conta.nome_fantasia || conta.razao_social || 'Conta empresarial'}</h3>
          {conta.cnpj && <p>CNPJ {mascaraCnpj(conta.cnpj)}</p>}
          {conta.vinculo === 'acesso' && <p>{CARGOS[conta.cargo]}</p>}
          <dl><div><dt>Agência</dt><dd>{conta.agencia}</dd></div><div><dt>Conta</dt><dd>{conta.numero_conta}</dd></div></dl>
          <button type="button" className="botao botao-principal" disabled={processando} onClick={() => entrar(conta.id_conta)}>Entrar nesta conta</button>
        </article>)}</div>
      </section>
      {!erro && podeAbrir && <section className="cartao-identidade"><h2>Uma conta para chamar de sua</h2><p>Abra sua conta pessoal ou a conta da sua empresa usando seu acesso Arkhé.</p>
        <div className="acoes-identidade"><button type="button" className="botao botao-secundario" disabled={processando} onClick={() => navigate('/cadastro')}>Abrir minha conta</button></div>
      </section>}
    </>}
    {recusa && <Confirmacao titulo="Recusar convite?" descricao={`Você não terá acesso à empresa ${recusa.nome_fantasia || recusa.razao_social || recusa.empresa}.`} processando={processando} erro={erro} fechar={() => setRecusa(null)} confirmar={() => responderConvite(recusa.id_acesso, false)} />}
  </LayoutIdentidade>
}
