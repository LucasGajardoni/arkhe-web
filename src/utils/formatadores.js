export function somenteNumeros(valor = '') {
  return String(valor).replace(/\D/g, '')
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

export function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}
