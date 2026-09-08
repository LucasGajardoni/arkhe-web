import { useState } from 'react'
import {
  solicitarRecuperacaoPin,
  trocarPin,
  verificarCodigoRecuperacaoPin,
} from '../services/authService.js'
import { somenteNumeros } from '../utils/formatadores.js'
import { emailValido, pinValido } from '../utils/validadores.js'

export function useRecuperacaoPin({ aoCancelar, aoConcluir }) {
  const [etapa, setEtapa] = useState(0)
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [tipoConta, setTipoConta] = useState('')
  const [novoPin, setNovoPin] = useState('')
  const [confirmarPin, setConfirmarPin] = useState('')
  const [mostrarPins, setMostrarPins] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [mensagemErro, setMensagemErro] = useState('')
  const [mensagemEtapa, setMensagemEtapa] = useState('')

  const emailCorreto = emailValido(email.trim())
  const codigoCorreto = /^\d{6}$/.test(codigo)
  const pinsIguais = novoPin === confirmarPin
  const pinsCorretos = pinValido(novoPin) && pinsIguais

  function informarErro(erro, mensagemPadrao) {
    setMensagemErro(erro.message || mensagemPadrao)
  }

  function alterarEmail(evento) {
    setEmail(evento.target.value)
    setMensagemErro('')
  }

  function alterarCodigo(evento) {
    setCodigo(somenteNumeros(evento.target.value).slice(0, 6))
    setMensagemErro('')
  }

  function alterarPin(evento) {
    const valor = somenteNumeros(evento.target.value).slice(0, 6)
    if (evento.target.name === 'novoPin') setNovoPin(valor)
    if (evento.target.name === 'confirmarPin') setConfirmarPin(valor)
    setMensagemErro('')
  }

  function escolherTipoConta(tipo) {
    setTipoConta(tipo)
    setMensagemErro('')
  }

  async function enviarCodigo(evento) {
    evento.preventDefault()
    if (!emailCorreto || processando) return

    setProcessando(true)
    setMensagemErro('')
    setMensagemEtapa('')

    try {
      const resultado = await solicitarRecuperacaoPin(email)
      setCodigo('')
      setMensagemEtapa(resultado.mensagem || 'Código enviado com sucesso.')
      setEtapa(1)
    } catch (erro) {
      informarErro(erro, 'Não foi possível enviar o código de recuperação.')
    } finally {
      setProcessando(false)
    }
  }

  async function validarCodigo(evento) {
    evento.preventDefault()
    if (!codigoCorreto || processando) return

    setProcessando(true)
    setMensagemErro('')
    setMensagemEtapa('')

    try {
      const resultado = await verificarCodigoRecuperacaoPin({ email, codigo })
      setMensagemEtapa(resultado.mensagem || 'Código validado com sucesso.')
      setEtapa(2)
    } catch (erro) {
      informarErro(erro, 'Não foi possível validar o código de recuperação.')
    } finally {
      setProcessando(false)
    }
  }

  async function salvarNovoPin(evento) {
    evento.preventDefault()
    if (!tipoConta || !pinsCorretos || processando) return

    setProcessando(true)
    setMensagemErro('')

    try {
      const resultado = await trocarPin({
        email,
        codigo,
        tipoConta,
        novoPin,
      })
      aoConcluir(resultado.mensagem || 'PIN alterado com sucesso.')
    } catch (erro) {
      informarErro(erro, 'Não foi possível alterar o PIN.')
    } finally {
      setProcessando(false)
    }
  }

  function voltar() {
    setMensagemErro('')
    setMensagemEtapa('')

    if (etapa === 0) {
      aoCancelar()
      return
    }

    setEtapa((atual) => atual - 1)
  }

  return {
    etapa,
    email,
    codigo,
    tipoConta,
    novoPin,
    confirmarPin,
    mostrarPins,
    processando,
    mensagemErro,
    mensagemEtapa,
    emailCorreto,
    codigoCorreto,
    pinsIguais,
    pinsCorretos,
    setMostrarPins,
    alterarEmail,
    alterarCodigo,
    alterarPin,
    escolherTipoConta,
    enviarCodigo,
    validarCodigo,
    salvarNovoPin,
    voltar,
  }
}
