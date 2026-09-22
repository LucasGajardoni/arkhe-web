import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LayoutIdentidade from '../../components/Identidade/LayoutIdentidade.jsx'
import Confirmacao from '../../components/Identidade/Confirmacao.jsx'
import Icone from '../../components/Dashboard/Icone.jsx'
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
  return <LayoutIdentidade variante="pagina-selecionar-conta" ocupado={processando} titulo="Escolha sua conta" descricao="Seu acesso é único. Você decide qual conta pessoal ou empresarial deseja operar.">
    {erro && <div className="mensagem-identidade erro" role="alert">{erro} <button type="button" disabled={processando || carregando} onClick={tentarNovamente}>Tentar novamente</button></div>}
    {sucesso && <p className="mensagem-identidade" role="status">{sucesso}</p>}
    {carregando ? <div className="carregamento-contas" role="status" aria-label="Carregando contas e convites">
      <span>Preparando seus acessos...</span>
      <div className="grade-identidade grade-contas-identidade" aria-hidden="true">
        <i /><i />
      </div>
    </div> : <>
      {dados.convites.length > 0 && <section className="secao-identidade" aria-labelledby="titulo-convites">
        <div className="cabecalho-secao-identidade"><div><h2 id="titulo-convites">Convites pendentes</h2><p>Empresas que convidaram você para colaborar.</p></div><strong>{dados.convites.length}</strong></div>
        <div className="grade-identidade grade-contas-identidade">{dados.convites.map((convite) => <article className="cartao-identidade cartao-conta-identidade cartao-convite-identidade" key={convite.id_acesso}>
          <div className="topo-cartao-conta"><span className="icone-tipo-conta"><Icone nome="convite" tamanho={25} /></span><span className="badge-identidade status-0">Convite pendente</span></div>
          <div className="corpo-cartao-conta"><p className="rotulo-cartao-conta">ACESSO EMPRESARIAL</p>
            <h3>{convite.nome_fantasia || convite.razao_social || convite.empresa}</h3>
            <p className="descricao-vinculo-conta">{convite.cargo_nome || CARGOS[convite.cargo]}</p>
            <div className="metadados-convite">
              {convite.cnpj && <span>CNPJ {mascaraCnpj(convite.cnpj)}</span>}
              {convite.data_convite && <span>Convidado em {new Date(convite.data_convite).toLocaleDateString('pt-BR')}</span>}
            </div>
          </div>
          <div className="acoes-identidade">
            <button type="button" className="botao botao-principal" disabled={processando} onClick={() => responderConvite(convite.id_acesso, true)}>Aceitar</button>
            <button type="button" className="botao botao-secundario" disabled={processando} onClick={() => { setErro(''); setRecusa(convite) }}>Recusar</button>
          </div>
        </article>)}</div>
      </section>}
      <section className="secao-identidade" aria-labelledby="titulo-contas">
        <div className="cabecalho-secao-identidade"><div><h2 id="titulo-contas">Contas disponíveis</h2><p>Escolha o contexto que deseja acessar agora.</p></div>{dados.contas.length > 0 && <strong>{dados.contas.length}</strong>}</div>
        {!erro && dados.contas.length === 0 && <p className="vazio-identidade">{dados.convites.length ? 'Aceite um convite para acessar uma conta empresarial, ou abra sua própria conta.' : 'Você ainda não possui uma conta própria nem acessos ativos.'}</p>}
        <div className="grade-identidade grade-contas-identidade">{dados.contas.map((conta) => {
          const empresarial = Number(conta.tipo_conta) === 1
          const acesso = conta.vinculo === 'acesso'
          return <article className={`cartao-identidade cartao-conta-identidade ${empresarial ? 'conta-empresarial' : 'conta-pessoal'}`} key={conta.id_conta}>
            <div className="topo-cartao-conta"><span className="icone-tipo-conta"><Icone nome={empresarial ? 'empresa' : 'pessoa'} tamanho={25} /></span><span className="badge-identidade">{conta.vinculo === 'titular' ? 'Titular' : conta.vinculo === 'proprietario' ? 'Proprietário' : 'Acesso autorizado'}</span></div>
            <div className="corpo-cartao-conta"><p className="rotulo-cartao-conta">{empresarial ? 'CONTA EMPRESARIAL' : 'CONTA PESSOAL'}</p>
              <h3>{empresarial ? conta.nome_fantasia || conta.razao_social || 'Conta empresarial' : 'Conta pessoal'}</h3>
              <p className="descricao-vinculo-conta">{empresarial ? (acesso ? CARGOS[conta.cargo] : 'Minha empresa') : 'Uso pessoal'}</p>
              {conta.cnpj && <p className="documento-conta">CNPJ {mascaraCnpj(conta.cnpj)}</p>}
            </div>
            <dl className="dados-conta-identidade"><div><dt>Agência</dt><dd>{conta.agencia}</dd></div><div><dt>Conta</dt><dd>{conta.numero_conta}</dd></div></dl>
            <button type="button" className="botao botao-principal" disabled={processando} onClick={() => entrar(conta.id_conta)}>Entrar nesta conta <span aria-hidden="true">→</span></button>
          </article>
        })}</div>
      </section>
      {!erro && podeAbrir && <section className="cartao-identidade chamada-nova-conta"><span className="icone-tipo-conta"><Icone nome="mais" tamanho={24} /></span><div><h2>Uma conta para chamar de sua</h2><p>Abra sua conta pessoal ou a conta da sua empresa usando seu acesso Arkhé.</p></div>
        <div className="acoes-identidade"><button type="button" className="botao botao-secundario" disabled={processando} onClick={() => navigate('/cadastro')}>Abrir minha conta</button></div>
      </section>}
    </>}
    {recusa && <Confirmacao titulo="Recusar convite?" descricao={`Você não terá acesso à empresa ${recusa.nome_fantasia || recusa.razao_social || recusa.empresa}.`} processando={processando} erro={erro} fechar={() => setRecusa(null)} confirmar={() => responderConvite(recusa.id_acesso, false)} />}
  </LayoutIdentidade>
}
