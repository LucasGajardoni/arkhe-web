import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Home from '../Home/Home.jsx'
import ModalTipoConta from '../../components/ModalTipoConta/ModalTipoConta.jsx'
import { verificarUsuario } from '../../services/authService.js'
import { mascaraCpf } from '../../utils/formatadores.js'
import { cpfValido } from '../../utils/validadores.js'

export default function EscolherConta() {
  const navigate = useNavigate()
  const [cpf, setCpf] = useState('')
  const [etapa, setEtapa] = useState('cpf')
  const [mensagemErro, setMensagemErro] = useState('')
  const [verificando, setVerificando] = useState(false)

  function alterarCpf(evento) {
    setCpf(mascaraCpf(evento.target.value))
    setMensagemErro('')
  }

  async function continuarComCpf(evento) {
    evento.preventDefault()

    if (!cpfValido(cpf)) {
      setMensagemErro('Informe um CPF válido para continuar.')
      return
    }

    setVerificando(true)
    setMensagemErro('')

    try {
      const resultado = await verificarUsuario(cpf)
      if (resultado.usuario_existente === true) {
        setEtapa('existente')
      } else {
        setEtapa('tipo')
      }
    } catch (erro) {
      setMensagemErro(erro.message || 'Não foi possível verificar o CPF.')
    } finally {
      setVerificando(false)
    }
  }

  function escolherTipo(tipoConta) {
    navigate(`/cadastro/${tipoConta.toLowerCase()}`, {
      state: { cpfVerificado: cpf, clienteExistente: false },
    })
  }

  function autenticarClienteExistente() {
    navigate('/login', {
      state: { abrindoOutraConta: true, cpfInicial: cpf },
    })
  }

  function voltar() {
    setMensagemErro('')

    if (etapa === 'cpf') {
      navigate('/')
      return
    }

    setEtapa('cpf')
  }

  return (
    <>
      <Home />
      <ModalTipoConta
        cpf={cpf}
        etapa={etapa}
        mensagemErro={mensagemErro}
        verificando={verificando}
        fechar={() => navigate('/')}
        voltar={voltar}
        alterarCpf={alterarCpf}
        continuarComCpf={continuarComCpf}
        escolherTipo={escolherTipo}
        autenticarClienteExistente={autenticarClienteExistente}
      />
    </>
  )
}
