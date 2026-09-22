export const CARGOS = ['Administrativo', 'Financeiro', 'Contador', 'RH', 'Compras', 'Outro']
export const STATUS_ACESSO = ['Pendente', 'Ativo', 'Bloqueado', 'Revogado']
export const proprietarioPJ = (perfil) => perfil?.tipoConta === 'PJ' && perfil?.vinculo === 'proprietario'
export const possuiContaPropria = (contas, tipo) => contas.some((conta) =>
  Number(conta.tipo_conta) === (tipo === 'PJ' ? 1 : 0)
  && conta.vinculo === (tipo === 'PJ' ? 'proprietario' : 'titular'))
export function rotuloConta(perfil) {
  if (perfil?.tipoConta !== 'PJ') return 'Conta pessoal'
  return `Conta empresarial · ${perfil.vinculo === 'proprietario' ? 'Proprietário' : CARGOS[perfil.cargo] || 'Acesso'}`
}
