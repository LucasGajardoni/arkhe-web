import { useCallback, useEffect, useRef, useState } from 'react'
import { buscarCartao, gerarCartao as gerarCartaoBackend } from '../services/cartaoService.js'

function cartaoDaConta(resultado, idConta) {
  if (!resultado.possui_cartao) return null
  if (!resultado.cartao || String(resultado.cartao.id_conta) !== String(idConta)) {
    throw new Error('A conta selecionada mudou. Volte à seleção de contas para continuar.')
  }
  return resultado.cartao
}

// Estado exclusivo do bloco montado para esta conta; não há cache global/storage.
export function useCartao(idConta) {
  const [cartao, setCartao] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState('')
  const [erroGeracao, setErroGeracao] = useState('')
  const ativo = useRef(false)
  const requisicao = useRef(0)
  const enviando = useRef(false)

  const consultar = useCallback(() => {
    const atual = ++requisicao.current
    return buscarCartao().then((resultado) => {
      if (ativo.current && atual === requisicao.current) setCartao(cartaoDaConta(resultado, idConta))
    }).catch((falha) => {
      if (ativo.current && atual === requisicao.current) setErro(falha.message)
    }).finally(() => {
      if (ativo.current && atual === requisicao.current) setCarregando(false)
    })
  }, [idConta])

  useEffect(() => {
    ativo.current = true
    consultar()
    return () => { ativo.current = false; requisicao.current += 1 }
  }, [consultar])

  function carregarCartao() {
    if (enviando.current) return
    setErro('')
    setCarregando(true)
    setCartao(null)
    return consultar()
  }

  async function gerarCartao(dados) {
    if (enviando.current || cartao || carregando || erro) return null
    enviando.current = true
    setGerando(true)
    setErroGeracao('')
    const atual = ++requisicao.current
    try {
      const resultado = await gerarCartaoBackend(dados)
      if (!ativo.current || atual !== requisicao.current) return null
      setCartao(cartaoDaConta(resultado, idConta))
      return 'Seu cartão foi criado.'
    } catch (falha) {
      if (!ativo.current || atual !== requisicao.current) return null
      if (falha.status === 409) {
        // Outra aba pode ter criado o cartão. Reconciliar sem repetir o POST.
        try {
          const resultado = falha.dados?.cartao ? falha.dados : await buscarCartao()
          const existente = cartaoDaConta(resultado, idConta)
          if (ativo.current && atual === requisicao.current && existente) {
            setCartao(existente)
            return falha.message
          }
        } catch {
          // Mantém a mensagem original e permite consultar o cartão novamente.
        }
      }
      if (ativo.current && atual === requisicao.current) setErroGeracao(falha.message)
      return null
    } finally {
      enviando.current = false
      if (ativo.current && atual === requisicao.current) setGerando(false)
    }
  }

  return { cartao, possuiCartao: Boolean(cartao), carregando, gerando, erro, erroGeracao,
    carregarCartao, gerarCartao, limparErroGeracao: () => setErroGeracao('') }
}
