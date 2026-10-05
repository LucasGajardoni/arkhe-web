import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CadastroHeader from '../../components/CadastroHeader/CadastroHeader.jsx'
import { confirmarEmailPix } from '../../services/pixService.js'
import '../Login/Login.css'

export default function ConfirmarChavePix() {
  const navigate = useNavigate()
  const [token] = useState(() => window.location.hash.replace('#token=', '').trim())
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true

    if (!token) {
      setErro('Este link de confirmação é inválido.')
      setCarregando(false)
      return () => { ativo = false }
    }

    confirmarEmailPix(token)
      .then((resultado) => {
        if (ativo) {
          setMensagem(resultado.mensagem || 'Chave Pix confirmada com sucesso.')
          window.location.hash = ''
        }
      })
      .catch((falha) => {
        if (ativo) setErro(falha.message || 'Não foi possível confirmar esta chave Pix.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => { ativo = false }
  }, [token])

  return (
    <div className="pagina-login">
      <CadastroHeader voltarParaHome={() => navigate('/login')} textoAviso="CONFIRMAÇÃO PIX" />
      <main className="conteudo area-login">
        <aside className="lateral-login">
          <p className="rotulo-secao">BANCO ARKHÉ</p>
          <h2>Confirmação de chave Pix.</h2>
          <p>O e-mail só vira uma chave Pix depois que o titular confirma o link recebido.</p>
          <ul>
            <li>Confirmação de posse</li>
            <li>Link temporário</li>
            <li>Cadastro somente após validação</li>
          </ul>
        </aside>

        <section className="cartao-login">
          <div className="cabecalho-login">
            <p className="rotulo-secao">CHAVE PIX</p>
            <h1>Confirmando seu e-mail</h1>
            <p>Estamos validando o link que você recebeu.</p>
          </div>

          {carregando && <p className="mensagem-login" role="status">Confirmando chave Pix...</p>}
          {!carregando && mensagem && <p className="mensagem-login" role="status">{mensagem}</p>}
          {!carregando && erro && <p className="mensagem-login erro-recuperacao" role="alert">{erro}</p>}

          {!carregando && (
            <button className="botao botao-principal botao-largo" type="button" onClick={() => navigate('/login')}>
              Ir para o Banco Arkhé
            </button>
          )}
        </section>
      </main>
    </div>
  )
}
