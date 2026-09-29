import { ErroApi, requisitarApi } from './authService.js'

export function identificarCartaoMaquininha(uid) {
  return requisitarApi('/maquininha/identificar', {
    method: 'POST', dados: { uid: uid.trim() },
  })
}

export function comprarMaquininha({ uid, pin, valor, tipo = 'DEBITO', parcelas = 1 }) {
  const modalidade = String(tipo).toUpperCase()
  const qtdParcelas = Number(parcelas)
  if (!/^\d{6}$/.test(pin) || !Number.isFinite(valor) || valor <= 0
    || !['DEBITO', 'CREDITO'].includes(modalidade)
    || !Number.isInteger(qtdParcelas) || qtdParcelas < 1 || qtdParcelas > 12) {
    throw new ErroApi('Confira os dados do pagamento.', 0, { codigo: 'DADOS_INVALIDOS' })
  }
  return requisitarApi('/maquininha/comprar', {
    method: 'POST',
    dados: { uid: uid.trim(), pin, valor, tipo: modalidade, parcelas: modalidade === 'CREDITO' ? qtdParcelas : 1 },
  })
}
