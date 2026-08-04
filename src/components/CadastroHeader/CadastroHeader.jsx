import logo from '../../assets/arkhe-logo.svg'
import './CadastroHeader.css'

function CadastroHeader({ voltarParaHome, textoAviso = 'CADASTRO SIMULADO' }) {
  return (
    <>
      <header className="cabecalho-cadastro">
        <div className="conteudo conteudo-cabecalho-cadastro">
          <button className="marca marca-cadastro" type="button" onClick={voltarParaHome}>
            <img src={logo} alt="" />
            <span>Banco Arkhé</span>
          </button>
          <button className="voltar-inicio" type="button" onClick={voltarParaHome}>← Voltar para o início</button>
        </div>
      </header>
      <div className="aviso-cadastro">AMBIENTE ACADÊMICO <span>•</span> {textoAviso}</div>
    </>
  )
}

export default CadastroHeader
