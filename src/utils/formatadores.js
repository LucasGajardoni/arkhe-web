export function somenteNumeros(valor = '') {
  return String(valor).replace(/\D/g, '')
}

export function cpfValido(valor) {
  const cpf = somenteNumeros(valor)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

  for (const tamanho of [9, 10]) {
    let soma = 0
    for (let indice = 0; indice < tamanho; indice += 1) soma += Number(cpf[indice]) * (tamanho + 1 - indice)
    let digito = (soma * 10) % 11
    if (digito === 10) digito = 0
    if (digito !== Number(cpf[tamanho])) return false
  }
  return true
}

export function mascaraCpf(valor) {
  return somenteNumeros(valor)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function mascaraCnpj(valor) {
  return somenteNumeros(valor)
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function mascaraCpfParcial(valor) {
  const cpf = somenteNumeros(valor)
  if (!cpf) return ''
  return `${cpf.slice(0, 3).padEnd(3, '*')}.***.***-**`
}

export function mascaraCnpjParcial(valor) {
  const cnpj = somenteNumeros(valor)
  if (!cnpj) return ''
  return `${cnpj.slice(0, 2).padEnd(2, '*')}.***.***/****-**`
}

export function mascaraTelefone(valor) {
  return somenteNumeros(valor)
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

export function mascaraCep(valor) {
  return somenteNumeros(valor).slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')
}

export function formatarDataBrasileira(data) {
  if (!data) return ''
  const [ano, mes, dia] = data.split('-')
  if (!ano || !mes || !dia) return data
  return `${dia}/${mes}/${ano}`
}

export function formatarChavePix(tipo, valor) {
  if (tipo === 'cpf') return mascaraCpf(valor)
  if (tipo === 'cnpj') return mascaraCnpj(valor)
  if (tipo === 'telefone') return mascaraTelefone(valor)
  return String(valor || '')
}
