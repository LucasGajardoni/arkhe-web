import logo from '../../assets/arkhe-logo.svg'
import './Footer.css'

const colunasRodape = [
  ['Produtos', [['Conta digital', '#conta'], ['Pix', '#pix'], ['Boletos', '#boletos']]],
  ['Conheça', [['Benefícios', '#beneficios'], ['Segurança', '#seguranca'], ['Contas PF e PJ', '#abrir-conta']]],
  ['Acesso', [['Acessar conta', '/login'], ['Abrir conta', '/cadastro']]],
]

export default function Footer() {
  return (
    <footer className="rodape">
      <div className="conteudo">
        <div className="grade-rodape">
          <div className="sobre-rodape">
            <a className="marca marca-rodape" href="#inicio">
              <img src={logo} alt="" />
              <span>Banco Arkhé</span>
            </a>
            <p>Projeto acadêmico experimental de 2026, criado para estudo de design, tecnologia e serviços financeiros digitais.</p>
          </div>
          {colunasRodape.map(([titulo, links]) => (
            <div className="coluna-rodape" key={titulo}>
              <h2>{titulo}</h2>
              <ul>
                {links.map(([rotulo, destino]) => (
                  <li key={rotulo}>
                    <a href={destino}>{rotulo}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="aviso-legal">Este site faz parte de um projeto acadêmico experimental. Não representa uma instituição financeira real e não realiza operações financeiras reais.</p>
        <div className="base-rodape">
          <p>© 2026 Banco Arkhé</p>
          <nav aria-label="Links legais">
            <a href="#seguranca">Segurança</a>
            <a href="/login">Acessar conta</a>
          </nav>
        </div>
      </div>
    </footer>
  )
}
