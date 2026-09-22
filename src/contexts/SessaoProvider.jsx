import { useCallback, useEffect, useRef, useState } from 'react'
import SessaoContext from './SessaoContext.js'
import { definirPinPessoal, obterSessao, selecionarContaBackend } from '../services/authService.js'
import { restaurarIdentidade } from '../services/sessaoService.js'
import { montarPerfilVisual } from '../utils/perfil.js'

export default function SessaoProvider({ children }) {
  const [usuarioIdentidade, setUsuarioIdentidade] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [trocaPinObrigatoria, setTrocaPinObrigatoria] = useState(false)
  const [verificandoSessao, setVerificandoSessao] = useState(true)
  const [erroSessao, setErroSessao] = useState('')
  const versao = useRef(0)

  const limparSessao = useCallback(() => {
    versao.current += 1
    setUsuarioIdentidade(null)
    setPerfil(null)
    setTrocaPinObrigatoria(false)
    setErroSessao('')
    setVerificandoSessao(false)
  }, [])

  const tratarErroSessao = useCallback((erro) => {
    if (erro.dados?.troca_pin_obrigatoria) {
      setTrocaPinObrigatoria(true)
      setPerfil(null)
    } else if (erro.status === 401) limparSessao()
  }, [limparSessao])

  const recarregarSessao = useCallback(() => {
    const atual = ++versao.current
    return restaurarIdentidade().then((estado) => {
      if (atual !== versao.current) return
      setUsuarioIdentidade(estado.identidade)
      setTrocaPinObrigatoria(estado.trocaPinObrigatoria)
      setPerfil(estado.resultado ? montarPerfilVisual(estado.resultado) : null)
    }).catch((erro) => {
      if (atual !== versao.current) return
      if (erro.status === 401) limparSessao()
      else setErroSessao(erro.message || 'Não foi possível restaurar sua sessão.')
    }).finally(() => {
      if (atual === versao.current) setVerificandoSessao(false)
    })
  }, [limparSessao])

  useEffect(() => {
    recarregarSessao()
    return () => { versao.current += 1 }
  }, [recarregarSessao])

  function iniciarSessaoIdentidade(resultado) {
    versao.current += 1
    setUsuarioIdentidade(resultado.usuario)
    setPerfil(null)
    setTrocaPinObrigatoria(resultado.troca_pin_obrigatoria === true)
    setVerificandoSessao(false)
    setErroSessao('')
  }

  async function concluirPrimeiroAcesso(novoPin) {
    await definirPinPessoal(novoPin)
    setTrocaPinObrigatoria(false)
  }

  async function atualizarSessaoConta() {
    // O cookie já foi atualizado pelo backend; nunca reaproveitar o perfil anterior.
    setPerfil(null)
    const resultado = await obterSessao()
    setUsuarioIdentidade(resultado.usuario)
    setPerfil(montarPerfilVisual(resultado))
    setTrocaPinObrigatoria(false)
    return resultado
  }

  async function selecionarConta(idConta) {
    await selecionarContaBackend(idConta)
    return atualizarSessaoConta()
  }

  function atualizarPerfil(dados) {
    setPerfil((atual) => montarPerfilVisual(dados, atual || {}))
    setUsuarioIdentidade((atual) => ({ ...atual, ...(dados.usuario || {
      nome: dados.nome, email: dados.email, telefone: dados.telefone,
    }) }))
  }

  return <SessaoContext.Provider value={{
    usuarioIdentidade, perfil, trocaPinObrigatoria, verificandoSessao, erroSessao,
    iniciarSessaoIdentidade, concluirPrimeiroAcesso, selecionarConta, atualizarSessaoConta,
    atualizarPerfil, limparSessao, tratarErroSessao,
    recarregarSessao: () => {
      setVerificandoSessao(true)
      setErroSessao('')
      setPerfil(null)
      return recarregarSessao()
    },
  }}>{children}</SessaoContext.Provider>
}
