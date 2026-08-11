import { useState } from 'react'
import logo from '../../assets/arkhe-logo.svg'
import './Header.css'

const linksNavegacao = [
  ['Para você', '#inicio'], ['Conta', '#conta'], ['Cartões', '#cartoes'],
  ['Investimentos', '#investimentos'], ['Segurança', '#seguranca'],
]

export default function Header({ abrirCadastro, abrirLogin }) {
  const [menuAberto, setMenuAberto] = useState(false)
  const fecharMenu = () => setMenuAberto(false)

  return (
    <header className="cabecalho-site">
      <div className="conteudo conteudo-cabecalho">
        <a className="marca" href="#inicio" aria-label="Banco Arkhé — início" onClick={fecharMenu}>
          <img src={logo} alt="" /><span>Banco Arkhé</span>
        </a>
        <button className="botao-menu" type="button" aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuAberto} aria-controls="navegacao-principal" onClick={() => setMenuAberto(!menuAberto)}>
          <span /><span /><span />
        </button>
        <div className={`painel-cabecalho${menuAberto ? ' aberto' : ''}`} id="navegacao-principal">
          <nav aria-label="Navegação principal">
            {linksNavegacao.map(([texto, destino], indice) => <a key={texto} className={indice === 0 ? 'ativo' : ''} href={destino} onClick={fecharMenu}>{texto}</a>)}
          </nav>
          <div className="acoes-cabecalho">
            <button className="link-acessar" type="button" onClick={() => { fecharMenu(); abrirLogin() }}>Acessar conta</button>
            <button className="botao botao-principal" type="button" onClick={() => { fecharMenu(); abrirCadastro() }}>Abrir minha conta</button>
          </div>
        </div>
      </div>
    </header>
  )
}
