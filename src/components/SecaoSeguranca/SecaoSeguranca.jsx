import imagemSeguranca from '../../assets/digital-security.png'
import './SecaoSeguranca.css'

const itensSeguranca = [
  'PIN e confirmação facial no acesso',
  'Sessão mantida com segurança pelo servidor',
  'Revisão antes de confirmar pagamentos',
]

export default function SecaoSeguranca() {
  return (
    <section className="seguranca" id="seguranca" aria-labelledby="titulo-seguranca">
      <div className="conteudo grade-seguranca">
        <div className="conteudo-seguranca">
          <p className="rotulo-secao">PROTEÇÃO EM CADA MOVIMENTO</p>
          <h2 className="titulo-secao" id="titulo-seguranca">Segurança presente em cada etapa</h2>
          <p className="texto-secao">Acesso protegido, sessão autenticada e confirmação clara antes das operações da sua conta.</p>
          <ul>
            {itensSeguranca.map((item) => (
              <li key={item}>
                <span>
                  <svg viewBox="0 0 24 24"><path d="m7 12 3 3 7-7" /></svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="imagem-seguranca">
          <img src={imagemSeguranca} alt="Ilustração de segurança digital e proteção bancária" />
        </div>
      </div>
    </section>
  )
}
