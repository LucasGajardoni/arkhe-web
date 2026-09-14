const formatadorDataGrupo = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

const formatadorMes = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
})

export function dataMovimentacao(item) {
  if (!item?.data_movimentacao) return null
  const data = new Date(item.data_movimentacao)
  return Number.isNaN(data.getTime()) ? null : data
}

function chaveData(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function inicioDoDia(data) {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate())
}

export function metadadosMovimentacao(item) {
  const entrada = item?.tipo === 'entrada'
  const origem = String(item?.origem || '').toLowerCase()

  if (origem === 'pix') {
    return {
      entrada,
      descricao: entrada ? 'Pix recebido' : 'Pix enviado',
      icone: 'pix',
    }
  }

  if (origem === 'cobranca') {
    return {
      entrada,
      descricao: entrada ? 'Recebimento de boleto' : 'Pagamento de boleto',
      icone: 'boleto',
    }
  }

  return {
    entrada,
    descricao: entrada ? 'Crédito em conta' : 'Débito em conta',
    icone: 'transferir',
  }
}

export function rotuloDataMovimentacao(data, agora = new Date()) {
  if (!data) return 'Data não informada'

  const diaAtual = inicioDoDia(agora)
  const diaMovimentacao = inicioDoDia(data)
  const diferencaDias = Math.round((diaAtual - diaMovimentacao) / 86400000)

  if (diferencaDias === 0) return 'Hoje'
  if (diferencaDias === 1) return 'Ontem'

  return formatadorDataGrupo.format(data)
}

export function agruparMovimentacoesPorData(lista) {
  const grupos = []
  const indicePorChave = new Map()

  lista.forEach((item) => {
    const data = dataMovimentacao(item)
    const chave = data ? chaveData(data) : 'sem-data'
    let indice = indicePorChave.get(chave)

    if (indice == null) {
      indice = grupos.length
      indicePorChave.set(chave, indice)
      grupos.push({ chave, rotulo: rotuloDataMovimentacao(data), itens: [] })
    }

    grupos[indice].itens.push(item)
  })

  return grupos
}

export function montarPanoramaMensal(movimentacoes, agora = new Date()) {
  const ano = agora.getFullYear()
  const mes = agora.getMonth()
  const ultimoDia = new Date(ano, mes + 1, 0).getDate()
  const intervalos = []

  for (let inicio = 1; inicio <= ultimoDia; inicio += 7) {
    const fim = Math.min(inicio + 6, ultimoDia)
    intervalos.push({
      inicio,
      fim,
      rotulo: inicio === fim ? String(inicio) : `${inicio}–${fim}`,
      entradas: 0,
      saidas: 0,
    })
  }

  let quantidade = 0

  movimentacoes.forEach((item) => {
    const data = dataMovimentacao(item)
    if (!data || data.getFullYear() !== ano || data.getMonth() !== mes) return

    const valor = Number(item.valor)
    if (!Number.isFinite(valor) || valor <= 0) return

    const intervalo = intervalos[Math.floor((data.getDate() - 1) / 7)]
    if (!intervalo) return

    if (item.tipo === 'entrada') intervalo.entradas += valor
    if (item.tipo === 'saida') intervalo.saidas += valor
    quantidade += 1
  })

  const maiorValor = Math.max(
    0,
    ...intervalos.flatMap((intervalo) => [intervalo.entradas, intervalo.saidas]),
  )

  return {
    quantidade,
    rotuloPeriodo: formatadorMes.format(agora),
    intervalos: intervalos.map((intervalo) => ({
      ...intervalo,
      alturaEntradas: maiorValor ? (intervalo.entradas / maiorValor) * 100 : 0,
      alturaSaidas: maiorValor ? (intervalo.saidas / maiorValor) * 100 : 0,
    })),
  }
}
