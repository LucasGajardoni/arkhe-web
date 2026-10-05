import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { obterSessaoUsuario, realizarLoginUsuario } from '../services/authService.js'
import { mascaraCpf, somenteNumeros } from '../utils/formatadores.js'
import { cpfValido, pinValido } from '../utils/validadores.js'
import { useSessao } from './useSessao.js'

export function useLogin() {
  const location = useLocation()
  const navigate = useNavigate()
  const { iniciarSessaoIdentidade } = useSessao()
  const [etapa, setEtapa] = useState('credenciais')
  const [credenciais, setCredenciais] = useState({ cpf: mascaraCpf(location.state?.cpfInicial || ''), pin: '' })
  const [credenciaisPendentes, setCredenciaisPendentes] = useState(null)
  const [mostrarPin, setMostrarPin] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [mensagemErro, setMensagemErro] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState('')
  const [sessaoFacial, setSessaoFacial] = useState(null)
  const [modoFacial, setModoFacial] = useState('login')
  const [mensagemFacial, setMensagemFacial] = useState('')
  const [desafioFacial, setDesafioFacial] = useState('')
  const [recuperandoPin, setRecuperandoPin] = useState(false)
  const ocupado = useRef(false)
  const credenciaisValidas = cpfValido(credenciais.cpf) && pinValido(credenciais.pin)

  function alterarCredencial({ target: { name, value } }) {
    setCredenciais((dados) => ({ ...dados, [name]: name === 'cpf' ? mascaraCpf(value) : somenteNumeros(value).slice(0, 6) }))
    setMensagemErro('')
    setMensagemSucesso('')
  }

  function voltarEtapa() {
    if (ocupado.current) return
    setMensagemErro('')
    if (recuperandoPin) return setRecuperandoPin(false)
    if (etapa === 'credenciais') return navigate('/')
    setSessaoFacial(null)
    setCredenciaisPendentes(null)
    setEtapa('credenciais')
  }

  async function autenticar(dados, confirmarFacial = false) {
    if (ocupado.current) return
    ocupado.current = true
    setProcessando(true)
    setMensagemErro('')

    try {
      const resultado = await realizarLoginUsuario({
        ...dados,
        desafioFacial: confirmarFacial ? desafioFacial : '',
        sessaoFacialId: confirmarFacial ? sessaoFacial?.session_id : '',
      })

      if (resultado.reconhecimento_facial_pendente) {
        setModoFacial(resultado.modo_facial || 'login')
        setMensagemFacial(
          resultado.modo_facial === 'cadastro'
            ? 'Este é seu primeiro acesso. Vamos cadastrar seu rosto para proteger sua conta.'
            : 'Confirme sua identidade com o reconhecimento facial.',
        )
        setSessaoFacial(resultado.sessao_facial)
        setDesafioFacial(resultado.desafio_facial || '')
        setEtapa('facial')
        return
      }

      let resultadoFinal = resultado

      if (!resultado.usuario) {
        const sessaoAtual = await obterSessaoUsuario()

        if (!sessaoAtual?.usuario) {
          throw new Error('O reconhecimento terminou, mas a sessão não foi criada. Tente novamente.')
        }

        resultadoFinal = {
          ...resultado,
          usuario: sessaoAtual.usuario,
        }
      }

      iniciarSessaoIdentidade(resultadoFinal)
      setCredenciaisPendentes(null)
      setSessaoFacial(null)
      setDesafioFacial('')
      setCredenciais((atuais) => ({ ...atuais, pin: '' }))
      navigate(resultado.troca_pin_obrigatoria ? '/primeiro-acesso' : '/selecionar-conta', { replace: true })
    } catch (erro) {
      setSessaoFacial(null)
      setDesafioFacial('')
      setCredenciaisPendentes(null)
      setEtapa('credenciais')
      setMensagemErro(erro.dados?.pin_temporario_expirado
        ? 'Seu PIN temporário expirou. Peça ao responsável pela empresa para reenviar o convite.'
        : erro.message || 'Não foi possível entrar. Tente novamente.')
    } finally {
      ocupado.current = false
      setProcessando(false)
    }
  }

  function continuarCredenciais(evento) {
    evento?.preventDefault()
    if (!credenciaisValidas || ocupado.current) return
    const dados = { cpf: somenteNumeros(credenciais.cpf), pin: credenciais.pin }
    setCredenciaisPendentes(dados)
    return autenticar(dados, false)
  }


  function reiniciarReconhecimentoFacial() {
    if (!credenciaisPendentes || ocupado.current) return

    setMensagemErro('')
    setSessaoFacial(null)
    setDesafioFacial('')

    return autenticar(credenciaisPendentes, false)
  }

  return {
    etapa, credenciais, credenciaisValidas, mostrarPin, processando, mensagemErro, mensagemSucesso,
    sessaoFacial, modoFacial, mensagemFacial, recuperandoPin, setMostrarPin, setMensagemErro,
    alterarCredencial, voltarEtapa, continuarCredenciais, reiniciarReconhecimentoFacial,
    irParaCadastro: () => navigate('/cadastro'),
    abrirRecuperacaoPin: () => { if (!ocupado.current) setRecuperandoPin(true) },
    fecharRecuperacaoPin: () => setRecuperandoPin(false),
    concluirRecuperacaoPin: (mensagem) => {
      setCredenciais((dados) => ({ ...dados, pin: '' }))
      setMostrarPin(false)
      setMensagemErro('')
      setMensagemSucesso(mensagem || 'PIN pessoal alterado com sucesso.')
      setRecuperandoPin(false)
    },
    concluirReconhecimentoFacial: () => credenciaisPendentes && autenticar(credenciaisPendentes, true),
  }
}
