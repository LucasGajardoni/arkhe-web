import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CadastroHeader from '../../components/CadastroHeader/CadastroHeader.jsx'
import { trocarPin, verificarTokenRecuperacaoPin } from '../../services/authService.js'
import { somenteNumeros } from '../../utils/formatadores.js'
import { pinValido } from '../../utils/validadores.js'
import '../Login/Login.css'

export default function RedefinirPin() {
  const navigate = useNavigate()
  const token = window.location.hash.replace('#token=', '').trim()
  const [validando, setValidando] = useState(true)
  const [tokenValido, setTokenValido] = useState(false)
  const [novoPin, setNovoPin] = useState('')
  const [confirmarPin, setConfirmarPin] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    let ativo = true

    if (!token) {
      setErro('Este link de recuperação é inválido.')
      setValidando(false)
      return () => { ativo = false }
    }

    verificarTokenRecuperacaoPin(token)
      .then(() => {
        if (ativo) setTokenValido(true)
      })
      .catch((falha) => {
        if (ativo) setErro(falha.message || 'Este link é inválido ou expirou.')
      })
      .finally(() => {
        if (ativo) setValidando(false)
      })

    return () => { ativo = false }
  }, [token])

  function alterarPin(evento) {
    const valor = somenteNumeros(evento.target.value).slice(0, 6)
    if (evento.target.name === 'novoPin') setNovoPin(valor)
    else setConfirmarPin(valor)
    setErro('')
  }

  async function salvar(evento) {
    evento.preventDefault()

    if (!pinValido(novoPin) || novoPin !== confirmarPin || processando) return

    setProcessando(true)
    setErro('')

    try {
      const resultado = await trocarPin({ token, novoPin })
      setSucesso(resultado.mensagem || 'PIN alterado com sucesso.')
      window.location.hash = ''
    } catch (falha) {
      setErro(falha.message || 'Não foi possível alterar o PIN.')
    } finally {
      setProcessando(false)
    }
  }

  return (
    <div className="pagina-login">
      <CadastroHeader voltarParaHome={() => navigate('/login')} textoAviso="RECUPERAÇÃO SEGURA" />
      <main className="conteudo area-login">
        <aside className="lateral-login">
          <p className="rotulo-secao">BANCO ARKHÉ</p>
          <h2>Crie um novo PIN com segurança.</h2>
          <p>O link recebido por e-mail funciona uma única vez e expira automaticamente.</p>
          <ul>
            <li>Link temporário</li>
            <li>Uso único</li>
            <li>Novo PIN com 6 números</li>
          </ul>
          <small>Nunca envie seu PIN por mensagem, e-mail ou atendimento.</small>
        </aside>

        <section className="cartao-login">
          <div className="cabecalho-login">
            <p className="rotulo-secao">NOVO PIN</p>
            <h1>Redefina seu acesso</h1>
            <p>Escolha um novo PIN pessoal para continuar usando o Arkhé.</p>
          </div>

          {validando && <p className="mensagem-login" role="status">Validando seu link...</p>}

          {!validando && erro && !tokenValido && (
            <>
              <p className="mensagem-login erro-recuperacao" role="alert">{erro}</p>
              <button className="botao botao-principal botao-largo" type="button" onClick={() => navigate('/login')}>
                Voltar ao login
              </button>
            </>
          )}

          {!validando && tokenValido && !sucesso && (
            <form onSubmit={salvar}>
              <div className="grade-pins-recuperacao">
                <label className="campo-login">
                  <span>Novo PIN</span>
                  <input name="novoPin" type={mostrar ? 'text' : 'password'} value={novoPin} onChange={alterarPin}
                    inputMode="numeric" autoComplete="new-password" maxLength={6} placeholder="6 dígitos" autoFocus />
                </label>
                <label className="campo-login">
                  <span>Confirmar novo PIN</span>
                  <input name="confirmarPin" type={mostrar ? 'text' : 'password'} value={confirmarPin} onChange={alterarPin}
                    inputMode="numeric" autoComplete="new-password" maxLength={6} placeholder="Repita o PIN" />
                </label>
              </div>

              <p className="ajuda-pin-login">O PIN deve possuir exatamente 6 números.</p>
              {confirmarPin && novoPin !== confirmarPin && <p className="erro-pin-recuperacao" role="alert">Os PINs não são iguais.</p>}
              {erro && <p className="mensagem-login erro-recuperacao" role="alert">{erro}</p>}

              <button className="alternar-pins-recuperacao" type="button" onClick={() => setMostrar(!mostrar)}>
                {mostrar ? 'Ocultar PINs' : 'Mostrar PINs'}
              </button>

              <button className="botao botao-principal botao-largo" type="submit"
                disabled={!pinValido(novoPin) || novoPin !== confirmarPin || processando}>
                {processando ? 'Alterando...' : 'Salvar novo PIN'}
              </button>
            </form>
          )}

          {sucesso && (
            <>
              <p className="mensagem-login" role="status">{sucesso}</p>
              <button className="botao botao-principal botao-largo" type="button" onClick={() => navigate('/login')}>
                Entrar com o novo PIN
              </button>
            </>
          )}
        </section>
      </main>
    </div>
  )
}
