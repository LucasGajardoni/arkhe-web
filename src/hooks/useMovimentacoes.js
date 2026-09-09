import { useCallback, useEffect, useMemo, useState } from 'react'
import { buscarMovimentacoes } from '../services/movimentacoesService.js'

function dataValida(valor) {
  if (!valor) return null
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? null : data
}

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
      const dataA = dataValida(a.data_movimentacao)?.getTime() || 0
      const dataB = dataValida(b.data_movimentacao)?.getTime() || 0
      return dataB - dataA
    })
    const saldo = movimentacoes.reduce((total, item) => {
      const valor = Number(item.valor) || 0
      if (item.tipo === 'entrada') return total + valor
      if (item.tipo === 'saida') return total - valor
      return total
    }, 0)

    const datas = movimentacoes.map((item) => dataValida(item.data_movimentacao))
    const podeFiltrarMes = movimentacoes.length > 0 && datas.every(Boolean)
    const agora = new Date()
    const basePeriodo = podeFiltrarMes
      ? movimentacoes.filter((_, indice) => (
        datas[indice].getMonth() === agora.getMonth()
        && datas[indice].getFullYear() === agora.getFullYear()
      ))
      : movimentacoes
    const entradas = basePeriodo.reduce(
      (total, item) => total + (item.tipo === 'entrada' ? Number(item.valor) || 0 : 0),
      0,
    )
    const saidas = basePeriodo.reduce(
      (total, item) => total + (item.tipo === 'saida' ? Number(item.valor) || 0 : 0),
      0,
    )

    return { ordenadas, saldo, entradas, saidas, podeFiltrarMes }
  }, [movimentacoes])

  return { movimentacoes, cobrancas, carregando, erro, carregar, ...resumo }
}
