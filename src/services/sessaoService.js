import { obterContasDisponiveis, obterSessao, obterSessaoUsuario } from './authService.js'

export async function restaurarIdentidade() {
  const identidade = await obterSessaoUsuario()
  if (!identidade.usuario) throw new Error('O servidor retornou uma identidade inválida.')
  if (identidade.conta_selecionada) {
    try {
      return { identidade: identidade.usuario, resultado: await obterSessao(), trocaPinObrigatoria: false }
    } catch (erro) {
      if (erro.status !== 401 && erro.status !== 403) throw erro
      // Acesso à conta revogado/bloqueado não significa perda da identidade.
      // Confirme o cookie antes de retornar à seleção de contas.
      await obterSessaoUsuario()
    }
  }
  try {
    await obterContasDisponiveis()
    return { identidade: identidade.usuario, resultado: null, trocaPinObrigatoria: false }
  } catch (erro) {
    if (erro.status === 403 && erro.dados?.troca_pin_obrigatoria) {
      return { identidade: identidade.usuario, resultado: null, trocaPinObrigatoria: true }
    }
    throw erro
  }
}
