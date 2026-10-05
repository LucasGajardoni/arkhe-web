import { useState } from 'react'
import { solicitarRecuperacaoPin } from '../services/authService.js'
import { transicionarFormulario } from '../utils/transicaoFormulario.js'
import { emailValido } from '../utils/validadores.js'

export function useRecuperacaoPin({ aoCancelar, aoConcluir }) {
  const [email, setEmail] = useState('')
  const [processando, setProcessando] = useState(false)
  const [mensagemErro, setMensagemErro] = useState('')
  const emailCorreto = emailValido(email.trim())

  function alterarEmail(evento) {
    setEmail(evento.target.value)
    setMensagemErro('')
  }

  async function enviarLink(evento) {
    evento.preventDefault()
    if (!emailCorreto || processando) return

    setProcessando(true)
    setMensagemErro('')

    try {
      const resultado = await solicitarRecuperacaoPin(email)
      transicionarFormulario(() => {
        aoConcluir(resultado.mensagem || 'Se o e-mail estiver cadastrado, enviaremos um link de recuperação.')
      })
    } catch (erro) {
      setMensagemErro(erro.message || 'Não foi possível iniciar a recuperação.')
    } finally {
      setProcessando(false)
    }
  }

  return {
    email,
    processando,
    mensagemErro,
    emailCorreto,
    alterarEmail,
    enviarLink,
    voltar: () => transicionarFormulario(aoCancelar),
  }
}
