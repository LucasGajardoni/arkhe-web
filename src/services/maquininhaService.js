import { ErroApi, requisitarApi } from './authService.js'

export function identificarCartaoMaquininha(uid) {
  return requisitarApi('/maquininha/identificar', {
    method: 'POST', dados: { uid: uid.trim() },
  })
}

export function comprarMaquininha({ uid, pin, valor }) {
  if (!/^\d{6}$/.test(pin) || !Number.isFinite(valor) || valor <= 0) {
    throw new ErroApi('Confira os dados do pagamento.', 0, { codigo: 'DADOS_INVALIDOS' })
  }
  return requisitarApi('/maquininha/comprar', {
    method: 'POST', dados: { uid: uid.trim(), pin, valor, tipo: 'DEBITO' },
  })
}
