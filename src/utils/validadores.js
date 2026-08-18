import { normalizarTexto, somenteNumeros } from './formatadores.js'

export function cpfValido(valor) {
  const cpf = somenteNumeros(valor)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

  function calcularDigito(tamanho) {
    let soma = 0
    for (let indice = 0; indice < tamanho; indice += 1) {
      soma += Number(cpf[indice]) * (tamanho + 1 - indice)
    }
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }

  return calcularDigito(9) === Number(cpf[9])
    && calcularDigito(10) === Number(cpf[10])
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

export function requisitosSenha({ senha = '', nome = '', email = '', cpf = '', telefone = '', nascimento = '', cnpj = '', empresa = '' }) {
  const senhaNormalizada = normalizarTexto(senha)
  const [ano = '', mes = '', dia = ''] = nascimento.split('-')

  const palavrasPessoais = [
    ...nome.split(/\s+/),
    ...email.split('@')[0].split(/[^a-zA-ZÀ-ÿ0-9]+/),
    ...empresa.split(/\s+/),
  ].map(normalizarTexto).filter((parte) => parte.length >= 3)

  const cpfLimpo = somenteNumeros(cpf)
  const telefoneLimpo = somenteNumeros(telefone)
  const numerosPessoais = [
    cpfLimpo,
    telefoneLimpo,
    cpfLimpo.slice(-4),
    telefoneLimpo.slice(-4),
    dia && mes ? `${dia}${mes}` : '',
    dia && mes && ano ? `${dia}${mes}${ano}` : '',
    ano,
    somenteNumeros(cnpj),
  ].filter((parte) => parte.length >= 4)

  const contemDadosPessoais = [...palavrasPessoais, ...numerosPessoais]
    .some((parte) => senhaNormalizada.includes(parte))

  return {
    tamanho: senha.length >= 8 && senha.length <= 12,
    maiuscula: /[A-ZÀ-Ý]/.test(senha),
    minuscula: /[a-zà-ÿ]/.test(senha),
    numero: /\d/.test(senha),
    especial: /[^A-Za-zÀ-ÿ0-9]/.test(senha),
    semDadosPessoais: !contemDadosPessoais,
  }
}

export function requisitosDaSenha({ tipoConta, dadosPF, dadosPJ }) {
  const empresarial = tipoConta === 'PJ'
  return requisitosSenha({
    senha: empresarial ? dadosPJ.senha : dadosPF.senha,
    nome: empresarial ? dadosPJ.nomeResponsavel : dadosPF.nome,
    email: empresarial ? dadosPJ.emailEmpresarial : dadosPF.email,
    cpf: empresarial ? dadosPJ.cpfResponsavel : dadosPF.cpf,
    telefone: empresarial ? dadosPJ.telefoneEmpresarial : dadosPF.telefone,
    nascimento: empresarial ? dadosPJ.dataNascimentoResponsavel : dadosPF.dataNascimento,
    cnpj: empresarial ? dadosPJ.cnpj : '',
    empresa: empresarial ? `${dadosPJ.razaoSocial} ${dadosPJ.nomeFantasia}` : '',
  })
}

export function senhaValida(dadosCadastro) {
  return Object.values(requisitosDaSenha(dadosCadastro)).every(Boolean)
}
