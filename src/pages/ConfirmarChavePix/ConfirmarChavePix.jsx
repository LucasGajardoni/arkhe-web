import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CadastroHeader from '../../components/CadastroHeader/CadastroHeader.jsx'
import { confirmarEmailPix } from '../../services/pixService.js'
import '../Login/Login.css'
import '../RedefinirPin/RedefinirPin.css'

export default function ConfirmarChavePix() {
  const navigate = useNavigate()
  const token = useMemo(() => new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token') || '', [])
  const [carregando, setCarregando] = useState(Boolean(token))
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState(token ? '' : 'Este link de confirmação é inválido.')

  useEffect(() => {
    let ativo = true

    if (!token) return () => { ativo = false }

    confirmarEmailPix(token)
      .then((resultado) => {
        if (!ativo) return
        setSucesso(resultado.mensagem || 'Chave Pix confirmada com sucesso.')
        window.history.replaceState(null, '', '/confirmar-chave-pix')
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
      <main className="conteudo redefinir-pin-area">
        <section className="cartao-login redefinir-pin-cartao">
          <div className="cabecalho-login">
            <p className="rotulo-secao">BANCO ARKHÉ</p>
            <h1>{sucesso ? 'Chave Pix confirmada' : erro ? 'Não foi possível confirmar' : 'Confirmando sua chave Pix'}</h1>
            <p>Estamos validando o link enviado para o seu e-mail.</p>
          </div>

          {carregando && <p className="mensagem-login" role="status">Confirmando...</p>}
          {sucesso && <p className="mensagem-login" role="status">{sucesso}</p>}
          {erro && <p className="mensagem-login erro-recuperacao" role="alert">{erro}</p>}

          {!carregando && (
            <button className="botao botao-principal botao-largo" type="button" onClick={() => navigate('/login')}>
              Voltar ao Banco Arkhé
            </button>
          )}
        </section>
      </main>
    </div>
  )
}
