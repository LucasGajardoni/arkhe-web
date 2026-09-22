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
