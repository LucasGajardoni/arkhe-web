const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatarLimite(valor) {
  if (valor == null || valor === '' || !Number.isFinite(Number(valor))) return '—'
  return moeda.format(Number(valor))
}

export function percentualUtilizado(total, utilizado) {
  const limite = Number(total)
  const uso = Number(utilizado)
  if (!Number.isFinite(limite) || !Number.isFinite(uso) || limite <= 0) return 0
  return Math.min(100, Math.max(0, (uso / limite) * 100))
}

export function validadeCartao(valor) {
  const partes = /^(\d{4})-(\d{2})-\d{2}/.exec(String(valor || ''))
  if (!partes || Number(partes[2]) < 1 || Number(partes[2]) > 12) return '—'
  return `${partes[2]}/${partes[1].slice(-2)}`
}

export function nomeNoCartao(usuario) {
  return (usuario.tipoConta === 'PJ' && (usuario.nomeFantasia || usuario.razaoSocial)) || usuario.nome || 'Cliente Arkhé'
}

export function numeroCartao(cartao) {
  return String(cartao?.numero_cartao || cartao?.numero_formatado || '').replace(/\D/g, '')
}

export function vencimentoTresDiasUteis(diaFechamento, referencia = new Date()) {
  const dia = Number(diaFechamento)
  if (!Number.isInteger(dia) || dia < 1 || dia > 28) return null

  const hoje = new Date(referencia.getFullYear(), referencia.getMonth(), referencia.getDate())
  let fechamento = new Date(hoje.getFullYear(), hoje.getMonth(), dia)
  if (fechamento < hoje) fechamento = new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia)

  const vencimento = new Date(fechamento)
  let restantes = 3
  while (restantes > 0) {
    vencimento.setDate(vencimento.getDate() + 1)
    const semana = vencimento.getDay()
    if (semana !== 0 && semana !== 6) restantes -= 1
  }

  return { dia: vencimento.getDate(), data: vencimento }
}
