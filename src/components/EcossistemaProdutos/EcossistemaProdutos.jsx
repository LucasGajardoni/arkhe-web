import imagemCartao from '../../assets/arkhe-card.png'
import './EcossistemaProdutos.css'

function IconeSeta() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
}

function EcossistemaProdutos() {
  return (
    <section className="ecossistema" id="conta" aria-labelledby="titulo-ecossistema">
      <div className="conteudo">
        <div className="cabecalho-secao centralizado">
          <p className="rotulo-secao">UM BANCO, TODAS AS POSSIBILIDADES</p>
          <h2 className="titulo-secao" id="titulo-ecossistema">O ecossistema completo para sua vida financeira</h2>
          <p className="texto-secao">Inovação digital com a solidez que você merece.</p>
        </div>
        <div className="grade-produtos">
          <article className="cartao-produto cartao-conta">
            <div className="icone-produto"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M7 15h4"/></svg></div>
            <div><p className="rotulo-produto">CONTA DIGITAL</p><h3>Conta Digital Completa</h3><p>Movimente seu capital com facilidade e agilidade. Gestão integrada em um só lugar.</p></div>
            <a className="link-texto" href="#abrir-conta">Explorar agora <IconeSeta /></a>
          </article>
          <article className="cartao-produto cartao-pix">
            <div className="marca-pix" aria-hidden="true"><span /><span /></div>
            <div><p className="rotulo-produto">PIX</p><h3>Pix sem complicação</h3><p>Transferências instantâneas a qualquer hora, com segurança e controle.</p></div>
          </article>
          <article className="cartao-produto cartao-cartao" id="cartoes">
            <div><p className="rotulo-produto">CARTÃO ARKHÉ</p><h3>Seu cartão, do seu jeito</h3><p>Design moderno, benefícios exclusivos e controle completo para o seu dia a dia.</p></div>
            <img src={imagemCartao} alt="Cartão de crédito Banco Arkhé com design exclusivo" />
          </article>
          <article className="cartao-produto cartao-investimentos" id="investimentos">
            <div><p className="rotulo-produto">INVESTIMENTOS</p><h3>Patrimônio com propósito</h3><p>Opções para diferentes objetivos, com acompanhamento claro da evolução do seu patrimônio.</p></div>
            <ul>
              <li><span>Renda fixa</span><small>CDBs e títulos</small></li>
              <li><span>Renda variável</span><small>Ações e FIIs</small></li>
              <li><span>Futuro</span><small>Planejamento financeiro</small></li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  )
}

export default EcossistemaProdutos
