import { somenteNumeros } from '../utils/formatadores.js'

export async function consultarEnderecoPorCep(cep) {
  const cepLimpo = somenteNumeros(cep)
  const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)

  if (!resposta.ok) throw new Error('Não foi possível consultar o CEP.')

  const endereco = await resposta.json()
  if (endereco.erro) return null

  return {
    logradouro: endereco.logradouro || '',
    bairro: endereco.bairro || '',
    cidade: endereco.localidade || '',
    estado: endereco.uf || '',
  }
}
