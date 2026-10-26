import { requisitarApi } from './authService.js'

const base = '/api/v1/assistente/conversas'

export const listarConversasMauro = () => requisitarApi(base)
export const criarConversaMauro = () => requisitarApi(base, { method: 'POST', dados: {} })
export const listarMensagensMauro = (id) => requisitarApi(`${base}/${encodeURIComponent(id)}/mensagens`)
export const enviarMensagemMauro = (id, mensagem) => requisitarApi(
  `${base}/${encodeURIComponent(id)}/mensagens`,
  { method: 'POST', dados: { mensagem } },
)

export const cancelarPropostaPixMauro = (idConversa, idProposta) => requisitarApi(
  `${base}/${encodeURIComponent(idConversa)}/pix/propostas/${encodeURIComponent(idProposta)}/cancelar`,
  { method: 'POST', dados: {} },
)

export const confirmarPropostaPixMauro = (idConversa, idProposta, pin) => requisitarApi(
  `${base}/${encodeURIComponent(idConversa)}/pix/propostas/${encodeURIComponent(idProposta)}/confirmar`,
  { method: 'POST', dados: { pin } },
)
