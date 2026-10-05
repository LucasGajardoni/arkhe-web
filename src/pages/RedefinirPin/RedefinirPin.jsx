import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CadastroHeader from '../../components/CadastroHeader/CadastroHeader.jsx'
import { trocarPin, verificarTokenRecuperacaoPin } from '../../services/authService.js'
import { somenteNumeros } from '../../utils/formatadores.js'
import { pinValido } from '../../utils/validadores.js'
import '../Login/Login.css'
import './RedefinirPin.css'

export default function RedefinirPin() {
  const navigate = useNavigate()
  const token = useMemo(() => new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token') || '', [])
  const [validando, setValidando] = useState(Boolean(token))
  const [tokenValido, setTokenValido] = useState(false)
  const [novoPin, setNovoPin] = useState('')
  const [confirmarPin, setConfirmarPin] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState(token ? '' : 'Este link de recuperação é inválido.')
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    let ativo = true

    if (!token) return () => { ativo = false }

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

  const pinsIguais = novoPin === confirmarPin
  const formularioValido = pinValido(novoPin) && pinsIguais

  function alterarPin(evento) {
    const valor = somenteNumeros(evento.target.value).slice(0, 6)
    if (evento.target.name === 'novoPin') setNovoPin(valor)
    if (evento.target.name === 'confirmarPin') setConfirmarPin(valor)
    setErro('')
  }

  async function salvar(evento) {
    evento.preventDefault()
    if (!formularioValido || processando || !tokenValido) return

    setProcessando(true)
    setErro('')

    try {
      const resultado = await trocarPin({ token, novoPin })
      setSucesso(resultado.mensagem || 'PIN alterado com sucesso.')
      setTokenValido(false)
      window.history.replaceState(null, '', '/redefinir-pin')
    } catch (falha) {
      setErro(falha.message || 'Não foi possível alterar o PIN.')
    } finally {
      setProcessando(false)
    }
  }

  return (
    <div className="pagina-login">
      <CadastroHeader voltarParaHome={() => navigate('/login')} textoAviso="RECUPERAÇÃO SEGURA" />
      <main className="conteudo redefinir-pin-area">
        <section className="cartao-login redefinir-pin-cartao">
          <div className="cabecalho-login">
            <p className="rotulo-secao">SEGURANÇA ARKHÉ</p>
            <h1>{sucesso ? 'PIN alterado' : 'Crie seu novo PIN'}</h1>
            <p>{sucesso
              ? 'Seu novo PIN já pode ser usado no próximo acesso.'
              : 'O PIN deve ter exatamente 6 números.'}</p>
          </div>

          {validando && <p className="mensagem-login" role="status">Validando seu link...</p>}

          {sucesso ? (
            <>
              <p className="mensagem-login" role="status">{sucesso}</p>
              <button className="botao botao-principal botao-largo" type="button" onClick={() => navigate('/login', { replace: true })}>
                Ir para o login
              </button>
            </>
          ) : tokenValido ? (
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

              {confirmarPin && !pinsIguais && <p className="erro-pin-recuperacao" role="alert">Os PINs não são iguais.</p>}
              <button className="alternar-pins-recuperacao" type="button" onClick={() => setMostrar(!mostrar)}>
                {mostrar ? 'Ocultar PINs' : 'Mostrar PINs'}
              </button>

              {erro && <p className="mensagem-login erro-recuperacao" role="alert">{erro}</p>}

              <button className="botao botao-principal botao-largo" type="submit" disabled={!formularioValido || processando}>
                {processando ? 'Alterando...' : 'Salvar novo PIN'}
              </button>
            </form>
          ) : !validando ? (
            <>
              <p className="mensagem-login erro-recuperacao" role="alert">{erro || 'Este link não pode mais ser usado.'}</p>
              <button className="botao botao-principal botao-largo" type="button" onClick={() => navigate('/login')}>
                Solicitar outro link
              </button>
            </>
          ) : null}
        </section>
      </main>
    </div>
  )
}
