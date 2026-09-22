import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { obterContasDisponiveis } from '../../services/authService.js'
import { useSessao } from '../../hooks/useSessao.js'
import { possuiContaPropria } from '../../utils/contas.js'
import LayoutIdentidade from '../Identidade/LayoutIdentidade.jsx'

export default function AberturaAutenticada({ tipoConta, children }) {
  const navigate = useNavigate()
  const { tratarErroSessao } = useSessao()
  const [contas, setContas] = useState(null)
  const [erro, setErro] = useState('')
  const [revisao, setRevisao] = useState(0)
  useEffect(() => {
    let ativo = true
    obterContasDisponiveis().then((dados) => { if (ativo) setContas(dados.contas || []) })
      .catch((falha) => { if (ativo) { setErro(falha.message); tratarErroSessao(falha) } })
    return () => { ativo = false }
  }, [tratarErroSessao, revisao])
  if (contas && tipoConta) {
    if (possuiContaPropria(contas, tipoConta)) return <Navigate to="/cadastro" replace />
    return children
  }
  return <LayoutIdentidade titulo="Abra sua própria conta" descricao="Use seu cadastro e seu PIN pessoal para abrir uma conta no Arkhé.">
    {erro ? <div className="mensagem-identidade erro" role="alert">{erro} <button type="button" onClick={() => { setErro(''); setRevisao((atual) => atual + 1) }}>Tentar novamente</button></div> : !contas ? <p role="status">Consultando suas contas...</p> : <>
      <div className="grade-identidade">{['PF', 'PJ'].filter((tipo) => !possuiContaPropria(contas, tipo)).map((tipo) => <section className="cartao-identidade" key={tipo}>
        <span className="badge-identidade">{tipo}</span><h2>{tipo === 'PF' ? 'Conta pessoal' : 'Conta empresarial'}</h2>
        <p>{tipo === 'PF' ? 'Uma conta para sua vida financeira.' : 'Uma conta para a empresa de que você é proprietário.'}</p>
        <div className="acoes-identidade"><button type="button" className="botao botao-principal" onClick={() => navigate(`/cadastro/${tipo.toLowerCase()}`)}>Abrir conta {tipo}</button></div>
      </section>)}</div>
      {possuiContaPropria(contas, 'PF') && possuiContaPropria(contas, 'PJ') && <p className="vazio-identidade">Você já possui conta pessoal e empresarial próprias.</p>}
    </>}
    <div className="acoes-identidade"><button type="button" className="botao botao-secundario" onClick={() => navigate('/selecionar-conta')}>Voltar às minhas contas</button></div>
  </LayoutIdentidade>
}
