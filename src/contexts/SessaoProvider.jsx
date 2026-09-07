import { useState } from 'react'
import SessaoContext from './SessaoContext.js'

function tipoContaPorExtenso(valor, fallback = '') {
  if (valor === 0 || valor === '0' || valor === 'PF') return 'PF'
  if (valor === 1 || valor === '1' || valor === 'PJ') return 'PJ'
  return fallback
}

function montarPerfilVisual(resultado = {}, fallback = {}) {
  const usuario = resultado.usuario || {}
  const conta = resultado.conta || {}
  const tipoRecebido = conta.tipo_conta ?? resultado.tipo_conta ?? usuario.tipo_conta

  return {
    nome: usuario.nome || resultado.nome || fallback.nome || 'Cliente',
    email: usuario.email || resultado.email || fallback.email || '',
    telefone: usuario.telefone || resultado.telefone || fallback.telefone || '',
    cpf: usuario.cpf || resultado.cpf || fallback.cpf || '',
    cnpj: conta.cnpj || resultado.cnpj || fallback.cnpj || '',
    tipoConta: tipoContaPorExtenso(tipoRecebido, fallback.tipoConta || ''),
  }
}

export default function SessaoProvider({ children }) {
  const [perfil, setPerfil] = useState(null)

  function iniciarSessao(resultado, fallback) {
    setPerfil(montarPerfilVisual(resultado, fallback))
  }

  function atualizarPerfil(dados) {
    setPerfil((atual) => montarPerfilVisual(dados, atual || {}))
  }

  function selecionarConta(tipoConta, dadosConta = {}) {
    const tipoSelecionado = tipoContaPorExtenso(tipoConta)
    let cnpj = ''
    if (tipoSelecionado === 'PJ') cnpj = dadosConta.cnpj || ''

    setPerfil((atual) => ({
      ...(atual || { nome: 'Cliente' }),
      tipoConta: tipoSelecionado,
      cnpj,
    }))
  }

  function limparSessao() {
    setPerfil(null)
  }

  return (
    <SessaoContext.Provider
      value={{ perfil, iniciarSessao, atualizarPerfil, selecionarConta, limparSessao }}
    >
      {children}
    </SessaoContext.Provider>
  )
}
