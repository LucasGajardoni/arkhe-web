import { useState } from 'react'
import logo from '../../assets/arkhe-logo.svg'
import './Header.css'

const linksNavegacao = [
  ['Para você', '#inicio'],
  ['Conta', '#conta'],
  ['Cartões', '#cartoes'],
  ['Investimentos', '#investimentos'],
  ['Segurança', '#seguranca'],
]

export default function Header({ abrirCadastro, abrirLogin }) {
  const [menuAberto, setMenuAberto] = useState(false)
  const fecharMenu = () => setMenuAberto(false)
  let textoBotaoMenu = 'Abrir menu'
  let classePainel = 'painel-cabecalho'

  if (menuAberto) {
    textoBotaoMenu = 'Fechar menu'
    classePainel += ' aberto'
  }

  function acessarConta() {
    fecharMenu()
    abrirLogin()
  }

  function cadastrarConta() {
    fecharMenu()
    abrirCadastro()
  }

  return (
    <header className="cabecalho-site">
      <div className="conteudo conteudo-cabecalho">
        <a className="marca" href="#inicio" aria-label="Banco Arkhé — início" onClick={fecharMenu}>
          <img src={logo} alt="" />
          <span>Banco Arkhé</span>
        </a>
        <button
          className="botao-menu"
          type="button"
          aria-label={textoBotaoMenu}
          aria-expanded={menuAberto}
          aria-controls="navegacao-principal"
          onClick={() => setMenuAberto(!menuAberto)}
        >
          <span />
          <span />
          <span />
        </button>
        <div className={classePainel} id="navegacao-principal">
          <nav aria-label="Navegação principal">
            {linksNavegacao.map(([texto, destino], indice) => {
              let classeLink = ''
              if (indice === 0) classeLink = 'ativo'

              return (
                <a key={texto} className={classeLink} href={destino} onClick={fecharMenu}>
                  {texto}
                </a>
              )
            })}
          </nav>
          <div className="acoes-cabecalho">
            <button className="link-acessar" type="button" onClick={acessarConta}>Acessar conta</button>
            <button className="botao botao-principal" type="button" onClick={cadastrarConta}>Abrir minha conta</button>
          </div>
        </div>
      </div>
    </header>
  )
}
