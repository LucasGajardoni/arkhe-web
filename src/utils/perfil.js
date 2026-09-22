export function montarPerfilVisual(resultado = {}, fallback = {}) {
  const usuario = resultado.usuario || resultado
  const conta = resultado.conta || {}
  const tipo = conta.tipo_conta ?? fallback.tipoConta
  return {
    nome: usuario.nome ?? fallback.nome ?? 'Cliente',
    email: usuario.email ?? fallback.email ?? '',
    telefone: usuario.telefone ?? fallback.telefone ?? '',
    cpf: usuario.cpf ?? fallback.cpf ?? '',
    idUsuario: usuario.id_usuario ?? fallback.idUsuario ?? null,
    idConta: conta.id_conta ?? fallback.idConta ?? null,
    idTitular: conta.id_titular ?? fallback.idTitular ?? null,
    vinculo: conta.vinculo ?? fallback.vinculo ?? '',
    cargo: conta.cargo !== undefined ? conta.cargo : fallback.cargo ?? null,
    tipoConta: tipo === 1 || tipo === '1' || tipo === 'PJ' ? 'PJ' : 'PF',
    cnpj: conta.cnpj ?? fallback.cnpj ?? '',
    nomeFantasia: conta.nome_fantasia ?? fallback.nomeFantasia ?? '',
    razaoSocial: conta.razao_social ?? fallback.razaoSocial ?? '',
    banco: conta.banco ?? fallback.banco ?? '',
    agencia: conta.agencia ?? fallback.agencia ?? '',
    numeroConta: conta.numero_conta ?? fallback.numeroConta ?? '',
  }
}
