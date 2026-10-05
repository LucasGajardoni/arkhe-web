import { useState } from 'react'
import { solicitarRecuperacaoPin } from '../services/authService.js'
import { transicionarFormulario } from '../utils/transicaoFormulario.js'
import { emailValido } from '../utils/validadores.js'

export function useRecuperacaoPin({ aoCancelar }) {
  const [email, setEmail] = useState('')
  const [processando, setProcessando] = useState(false)
  const [mensagemErro, setMensagemErro] = useState('')
  const [mensagemEtapa, setMensagemEtapa] = useState('')

  const emailCorreto = emailValido(email.trim())

  function alterarEmail(evento) {
    setEmail(evento.target.value)
    setMensagemErro('')
    setMensagemEtapa('')
  }

  async function enviarLink(evento) {
    evento.preventDefault()
    if (!emailCorreto || processando) return

    setProcessando(true)
    setMensagemErro('')
    setMensagemEtapa('')

    try {
      const resultado = await solicitarRecuperacaoPin(email)
      setMensagemEtapa(resultado.mensagem || 'Se o e-mail estiver cadastrado, você receberá o link em instantes.')
    } catch (erro) {
      setMensagemErro(erro.message || 'Não foi possível iniciar a recuperação do PIN.')
    } finally {
      setProcessando(false)
    }
  }

  function voltar() {
    if (processando) return
    transicionarFormulario(aoCancelar)
  }

  return {
    email,
    processando,
    mensagemErro,
    mensagemEtapa,
    emailCorreto,
    alterarEmail,
    enviarLink,
    voltar,
  }
}
