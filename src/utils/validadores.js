import { somenteNumeros } from './formatadores.js'

export function cpfValido(valor) {
  const cpf = somenteNumeros(valor)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

  function calcularDigito(tamanho) {
    let soma = 0
    for (let indice = 0; indice < tamanho; indice += 1) {
      soma += Number(cpf[indice]) * (tamanho + 1 - indice)
    }
    const resto = (soma * 10) % 11
    if (resto === 10) return 0
    return resto
  }

  return calcularDigito(9) === Number(cpf[9])
    && calcularDigito(10) === Number(cpf[10])
}

export function cnpjValido(valor) {
  const cnpj = somenteNumeros(valor)
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false

  function calcularDigito(base, pesos) {
    const soma = base
      .split('')
      .reduce((total, digito, indice) => total + Number(digito) * pesos[indice], 0)
    const resto = soma % 11
    if (resto < 2) return 0
    return 11 - resto
  }

  const primeiroDigito = calcularDigito(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const segundoDigito = calcularDigito(
    `${cnpj.slice(0, 12)}${primeiroDigito}`,
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  )

  return cnpj.endsWith(`${primeiroDigito}${segundoDigito}`)
}

export function nomeValido(nome) {
  const nomeLimpo = String(nome || '').trim()
  return nomeLimpo.length > 0 && /^[\p{L}\s]+$/u.test(nomeLimpo)
}

export function maiorDeIdade(dataNascimento) {
  if (!dataNascimento) return false
  const nascimento = new Date(`${dataNascimento}T00:00:00`)
  const hoje = new Date()
  let idade = hoje.getFullYear() - nascimento.getFullYear()
  const aniversarioAindaNaoChegou = hoje.getMonth() < nascimento.getMonth()
    || (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate())
  if (aniversarioAindaNaoChegou) idade -= 1
  return idade >= 18
}

export function camposPreenchidos(dados, campos) {
  return campos.every((campo) => String(dados[campo] || '').trim())
}

export function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function pinValido(pin) {
  return /^\d{6}$/.test(String(pin || ''))
}

export function pinSeguro(pin, dados = {}) {
  const pinLimpo = somenteNumeros(pin)
  if (!pinValido(pinLimpo)) return false

  const camposNumericos = [
    dados.cpf,
    dados.cnpj,
    dados.telefone,
    dados.cep,
    dados.numero,
  ]

  const partesData = String(dados.dataNascimento || '').split('-')
  if (partesData.length === 3) {
    const [ano, mes, dia] = partesData
    camposNumericos.push(`${ano}${mes}${dia}`)
    camposNumericos.push(`${dia}${mes}${ano}`)
    camposNumericos.push(`${dia}${mes}${ano.slice(-2)}`)
  }

  for (const campo of camposNumericos) {
    const numeroDoCampo = somenteNumeros(campo)
    if (numeroDoCampo.includes(pinLimpo)) return false
  }

  return true
}
