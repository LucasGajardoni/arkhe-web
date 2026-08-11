import imagemAplicativo from '../../assets/arkhe-app-preview.png'
import './Hero.css'

export default function Hero({ abrirCadastro, abrirLogin }) {
  return (
    <section className="hero" id="inicio">
      <div className="conteudo grade-hero">
        <div className="conteudo-hero">
          <p className="selo-hero">BANCO DIGITAL COMPLETO</p>
          <h1>O começo da sua <span>nova vida financeira.</span></h1>
          <p className="texto-hero">Conta, pagamentos, cartões e investimentos em uma experiência segura, simples e transparente.</p>
          <div className="acoes-hero">
            <button className="botao botao-principal" type="button" onClick={abrirCadastro}>Abrir minha conta</button>
            <button className="botao botao-secundario" type="button" onClick={abrirLogin}>Acessar conta</button>
          </div>
          <p className="nota-hero">Contas PF e PJ no mesmo ecossistema.</p>
        </div>
        <div className="visual-hero" aria-label="Visão geral dos produtos Banco Arkhé">
          <div className="moldura-aplicativo"><div className="tela-aplicativo"><img src={imagemAplicativo} alt="Visualização do aplicativo Banco Arkhé em um smartphone" /></div></div>
          <div className="resumo-produtos">
            <div><strong>Pix</strong><span>instantâneo</span></div>
            <div><strong>Cartões</strong><span>sob controle</span></div>
            <div><strong>Investimentos</strong><span>em um só lugar</span></div>
          </div>
        </div>
      </div>
    </section>
  )
}
