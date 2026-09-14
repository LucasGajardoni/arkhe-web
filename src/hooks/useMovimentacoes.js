import { useCallback, useEffect, useMemo, useState } from 'react'
import { buscarMovimentacoes } from '../services/movimentacoesService.js'
import { dataMovimentacao, montarPanoramaMensal } from '../utils/movimentacoes.js'

export function useMovimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState([])
  const [cobrancas, setCobrancas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const resposta = await buscarMovimentacoes()
      setMovimentacoes(Array.isArray(resposta.movimentacoes) ? resposta.movimentacoes : [])
      setCobrancas(Array.isArray(resposta.cobrancas) ? resposta.cobrancas : [])
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    let ativo = true

    buscarMovimentacoes()
      .then((resposta) => {
        if (ativo) {
          setMovimentacoes(Array.isArray(resposta.movimentacoes) ? resposta.movimentacoes : [])
          setCobrancas(Array.isArray(resposta.cobrancas) ? resposta.cobrancas : [])
        }
      })
      .catch((falha) => {
        if (ativo) setErro(falha.message)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => { ativo = false }
  }, [])

  const resumo = useMemo(() => {
    const ordenadas = [...movimentacoes].sort((a, b) => {
      const dataA = dataMovimentacao(a)?.getTime() || 0
      const dataB = dataMovimentacao(b)?.getTime() || 0
      return dataB - dataA
    })
    const saldo = movimentacoes.reduce((total, item) => {
      const valor = Number(item.valor) || 0
      if (item.tipo === 'entrada') return total + valor
      if (item.tipo === 'saida') return total - valor
      return total
    }, 0)

    const agora = new Date()
    const basePeriodo = movimentacoes.filter((item) => {
      const data = dataMovimentacao(item)
      return data
        && data.getMonth() === agora.getMonth()
        && data.getFullYear() === agora.getFullYear()
    })
    const entradas = basePeriodo.reduce(
      (total, item) => total + (item.tipo === 'entrada' ? Number(item.valor) || 0 : 0),
      0,
    )
    const saidas = basePeriodo.reduce(
      (total, item) => total + (item.tipo === 'saida' ? Number(item.valor) || 0 : 0),
      0,
    )

    return {
      ordenadas,
      saldo,
      entradas,
      saidas,
      panorama: montarPanoramaMensal(movimentacoes, agora),
    }
  }, [movimentacoes])

  return { movimentacoes, cobrancas, carregando, erro, carregar, ...resumo }
}
