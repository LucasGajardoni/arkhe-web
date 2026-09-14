import './EcossistemaProdutos.css'

function IconeSeta() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export default function EcossistemaProdutos() {
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
            <div className="icone-produto">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 9h18M7 15h4" />
              </svg>
            </div>
            <div>
              <p className="rotulo-produto">CONTA DIGITAL</p>
              <h3>Conta Digital Completa</h3>
              <p>Movimente seu capital com facilidade e agilidade. Gestão integrada em um só lugar.</p>
            </div>
            <a className="link-texto" href="#abrir-conta">Explorar agora <IconeSeta /></a>
          </article>
          <article className="cartao-produto cartao-pix" id="pix">
            <div className="marca-pix" aria-hidden="true">
              <span />
              <span />
            </div>
            <div>
              <p className="rotulo-produto">PIX</p>
              <h3>Pix sem complicação</h3>
              <p>Transferências instantâneas a qualquer hora, com segurança e controle.</p>
            </div>
          </article>
          <article className="cartao-produto cartao-extrato">
            <div>
              <p className="rotulo-produto">EXTRATO</p>
              <h3>Cada movimento, com clareza</h3>
              <p>Entradas, saídas e comprovantes organizados para facilitar o acompanhamento da conta.</p>
            </div>
            <div className="visual-extrato-produto" aria-hidden="true">
              <span><i />Pix recebido <b>+</b></span>
              <span><i />Pagamento de boleto <b>−</b></span>
              <span><i />Pix enviado <b>−</b></span>
            </div>
          </article>
          <article className="cartao-produto cartao-boletos" id="boletos">
            <div>
              <p className="rotulo-produto">BOLETOS E COBRANÇAS</p>
              <h3>Uma experiência para cada conta</h3>
              <p>Pague boletos na conta pessoal e emita cobranças para clientes na conta empresarial.</p>
            </div>
            <ul>
              <li>
                <span>DDA</span>
                <small>Boletos da conta PF</small>
              </li>
              <li>
                <span>Scanner</span>
                <small>Leitura de código</small>
              </li>
              <li>
                <span>Cobranças PJ</span>
                <small>Emissão e acompanhamento</small>
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  )
}
