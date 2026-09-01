import { useCallback, useEffect, useState } from 'react'
import { adicionarChavePix, buscarChavesPix, excluirChavePix } from '../services/pixService.js'
import { somenteNumeros } from '../utils/formatadores.js'

export function usePix(usuario) {
  const [chaves, setChaves] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [modalCadastro, setModalCadastro] = useState(false)
  const [chaveExclusao, setChaveExclusao] = useState(null)
  const [tipo, setTipo] = useState('email')
  const valoresAutomaticos = {
    email: String(usuario?.email || '').trim().toLowerCase(),
    telefone: somenteNumeros(usuario?.telefone),
    cpf: somenteNumeros(usuario?.cpf),
    cnpj: somenteNumeros(usuario?.cnpj),
    aleatoria: '',
  }
  const valor = valoresAutomaticos[tipo] || ''
  const tiposCadastrados = new Set(chaves.map((chave) => chave.tipo))
  const tiposDisponiveis = ['email', 'telefone', 'cpf', 'cnpj']
    .filter((item) => valoresAutomaticos[item] && !tiposCadastrados.has(item))
  if (!tiposCadastrados.has('aleatoria')) tiposDisponiveis.push('aleatoria')

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const resposta = await buscarChavesPix()
      setChaves(Array.isArray(resposta.chaves) ? resposta.chaves : [])
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    let ativo = true
    buscarChavesPix()
      .then((resposta) => { if (ativo) setChaves(Array.isArray(resposta.chaves) ? resposta.chaves : []) })
      .catch((falha) => { if (ativo) setErro(falha.message) })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [])

  function alterarTipo(novoTipo) {
    setTipo(novoTipo)
    setErro('')
  }
  const valorValido = tipo === 'aleatoria' || Boolean(valor)

  async function cadastrar(evento) {
    evento.preventDefault()
    if (!valorValido || processando) return
    setProcessando(true)
    setErro('')
    try {
      const valorEnviar = ['telefone', 'cpf', 'cnpj'].includes(tipo) ? somenteNumeros(valor) : valor.trim()
      const resposta = await adicionarChavePix(tipo, valorEnviar)
      setMensagem(resposta.mensagem || 'Chave Pix cadastrada com sucesso.')
      setModalCadastro(false)
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setProcessando(false)
    }
  }

  async function excluir() {
    if (!chaveExclusao || processando) return
    setProcessando(true)
    setErro('')
    try {
      const resposta = await excluirChavePix(chaveExclusao.id_chave_pix, chaveExclusao.tipo)
      setMensagem(resposta.mensagem || 'Chave Pix excluída com sucesso.')
      setChaveExclusao(null)
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setProcessando(false)
    }
  }

  return { chaves, carregando, processando, erro, setErro, mensagem, setMensagem, modalCadastro, setModalCadastro, chaveExclusao, setChaveExclusao, tipo, alterarTipo, tiposDisponiveis, valor, valorValido, cadastrar, excluir, carregar }
}
