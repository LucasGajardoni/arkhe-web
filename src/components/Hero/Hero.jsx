import logo from '../../assets/arkhe-logo.svg'
import './Hero.css'

export default function Hero({ abrirCadastro, abrirLogin }) {
  return (
    <section className="hero" id="inicio">
      <div className="conteudo grade-hero">
        <div className="conteudo-hero">
          <p className="selo-hero">CONTA DIGITAL PF E PJ</p>
          <h1>
            O começo da sua <span>nova vida financeira.</span>
          </h1>
          <p className="texto-hero">Pix, extrato, boletos e cobranças em uma experiência segura, simples e transparente.</p>
          <div className="acoes-hero">
            <button className="botao botao-principal" type="button" onClick={abrirCadastro}>
              Abrir minha conta
            </button>
            <button className="botao botao-secundario" type="button" onClick={abrirLogin}>
              Acessar conta
            </button>
          </div>
          <p className="nota-hero">Contas PF e PJ no mesmo ecossistema.</p>
        </div>
        <div className="visual-hero" aria-label="Recursos disponíveis no Banco Arkhé">
          <div className="moldura-aplicativo">
            <div className="tela-aplicativo">
              <header>
                <span><img src={logo} alt="" /></span>
                <div><small>BANCO ARKHÉ</small><strong>Sua conta em um só lugar</strong></div>
              </header>
              <div className="recursos-aplicativo">
                <article><span>◆</span><div><strong>Pix</strong><small>Envie e receba</small></div></article>
                <article><span>▤</span><div><strong>Boletos</strong><small>Pague ou emita cobranças</small></div></article>
                <article><span>↕</span><div><strong>Extrato</strong><small>Acompanhe cada movimentação</small></div></article>
              </div>
              <p>Informações reais da sua conta, sem simulações.</p>
            </div>
          </div>
          <div className="resumo-produtos">
            <div>
              <strong>Pix</strong>
              <span>instantâneo</span>
            </div>
            <div>
              <strong>Boletos</strong>
              <span>pagamentos e cobranças</span>
            </div>
            <div>
              <strong>Extrato</strong>
              <span>movimentações reais</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
