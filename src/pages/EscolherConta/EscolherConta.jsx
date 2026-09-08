import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Home from '../Home/Home.jsx'
import ModalTipoConta from '../../components/ModalTipoConta/ModalTipoConta.jsx'
import { verificarUsuario } from '../../services/authService.js'
import { mascaraCpf } from '../../utils/formatadores.js'
import { transicionarFormulario } from '../../utils/transicaoFormulario.js'
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
      const novaEtapa = resultado.usuario_existente === true ? 'existente' : 'tipo'
      transicionarFormulario(() => setEtapa(novaEtapa))
    } catch (erro) {
      setMensagemErro(erro.message || 'Não foi possível verificar o CPF.')
    } finally {
      setVerificando(false)
    }
  }

  function escolherTipo(tipoConta) {
    transicionarFormulario(() => {
      navigate(`/cadastro/${tipoConta.toLowerCase()}`, {
        state: { cpfVerificado: cpf, clienteExistente: false },
      })
    })
  }

  function autenticarClienteExistente() {
    transicionarFormulario(() => {
      navigate('/login', {
        state: { abrindoOutraConta: true, cpfInicial: cpf },
      })
    })
  }

  function fechar() {
    transicionarFormulario(() => navigate('/'))
  }

  function voltar() {
    setMensagemErro('')

    if (etapa === 'cpf') {
      fechar()
      return
    }

    transicionarFormulario(() => setEtapa('cpf'))
  }

  return (
    <>
      <Home />
      <ModalTipoConta
        cpf={cpf}
        etapa={etapa}
        mensagemErro={mensagemErro}
        verificando={verificando}
        fechar={fechar}
        voltar={voltar}
        alterarCpf={alterarCpf}
        continuarComCpf={continuarComCpf}
        escolherTipo={escolherTipo}
        autenticarClienteExistente={autenticarClienteExistente}
      />
    </>
  )
}
