import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CadastroHeader from '../CadastroHeader/CadastroHeader.jsx'
import { encerrarSessao } from '../../services/authService.js'
import { useSessao } from '../../hooks/useSessao.js'
import './Identidade.css'

export default function LayoutIdentidade({ titulo, descricao, children, ocupado = false, variante = '' }) {
  const navigate = useNavigate()
  const { usuarioIdentidade, limparSessao } = useSessao()
  const [saindo, setSaindo] = useState(false)
  const [erro, setErro] = useState('')
  async function sair() {
    if (saindo || ocupado) return
    setSaindo(true)
    setErro('')
    try {
      await encerrarSessao()
      limparSessao()
      navigate('/login', { replace: true })
    } catch (falha) { setErro(falha.message) }
    finally { setSaindo(false) }
  }
  return <div className={`pagina-identidade ${variante}`.trim()}>
    <CadastroHeader voltarParaHome={() => navigate('/')} textoAviso="ACESSO PESSOAL" />
    <main className="conteudo central-identidade">
      <header className="topo-identidade">
        <div><p className="rotulo-secao">OLÁ, {usuarioIdentidade?.nome?.split(' ')[0] || 'CLIENTE'}</p>
          <h1>{titulo}</h1><p>{descricao}</p></div>
        <button type="button" className="botao botao-secundario" disabled={saindo || ocupado} onClick={sair}>{saindo ? 'Saindo...' : 'Sair'}</button>
      </header>
      {erro && <p className="mensagem-identidade erro" role="alert">{erro}</p>}
      {children}
    </main>
  </div>
}
