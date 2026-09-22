import CadastroHeader from '../../components/CadastroHeader/CadastroHeader.jsx'
import ConteudoLogin from '../../components/Login/ConteudoLogin.jsx'
import { useLogin } from '../../hooks/useLogin.js'
import './Login.css'

export default function Login() {
  const login = useLogin()

  return (
    <div className="pagina-login">
      <CadastroHeader voltarParaHome={login.voltarEtapa} textoAviso="ACESSO SEGURO" />
      <main className="conteudo area-login">
        <aside className="lateral-login">
          <p className="rotulo-secao">BANCO ARKHÉ</p>
          <h2>Seu acesso, protegido em cada etapa.</h2>
          <p>O Arkhé reúne seu PIN pessoal e a confirmação facial em uma experiência simples.</p>
          <ul>
            <li>Um único acesso pessoal</li>
            <li>Confirmação facial</li>
            <li>Escolha sua conta após autenticar</li>
            <li>Proteção dos dados</li>
          </ul>
          <small>Recursos apresentados para fins acadêmicos. Sua sessão é mantida pelo cookie seguro do servidor.</small>
        </aside>
        <section className="cartao-login">
          <ConteudoLogin login={login} />
        </section>
      </main>
    </div>
  )
}
