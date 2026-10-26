import { requisitarApi } from './authService.js'

const base = '/api/v1/assistente/conversas'

export const listarConversasMauro = () => requisitarApi(base)
export const criarConversaMauro = () => requisitarApi(base, { method: 'POST', dados: {} })
export const listarMensagensMauro = (id) => requisitarApi(`${base}/${encodeURIComponent(id)}/mensagens`)
export const enviarMensagemMauro = (id, mensagem) => requisitarApi(
  `${base}/${encodeURIComponent(id)}/mensagens`,
  { method: 'POST', dados: { mensagem } },
)

export const transcreverAudioMauro = (id, audio) => {
  const dados = new FormData()
  const extensao = String(audio?.type || '').split(';', 1)[0].endsWith('/ogg') ? 'ogg' : 'webm'
  dados.append('audio', audio, `mauro-audio.${extensao}`)
  return requisitarApi(`${base}/${encodeURIComponent(id)}/audio/transcrever`, {
    method: 'POST', dados,
  }).catch((falha) => {
    if (falha.message === 'Não foi possível concluir a solicitação.') {
      const mensagem = falha.status === 413
        ? 'A gravação passou do limite de 8 MB. Grave um trecho menor e tente novamente.'
        : falha.status >= 500
          ? 'O serviço de voz do MAURO falhou ao processar o áudio. Tente novamente em instantes ou digite sua pergunta.'
          : 'Não consegui enviar o áudio para transcrição. Verifique a conexão e tente novamente.'
      throw new Error(mensagem)
    }
    throw falha
  })
}

export const cancelarPropostaPixMauro = (idConversa, idProposta) => requisitarApi(
  `${base}/${encodeURIComponent(idConversa)}/pix/propostas/${encodeURIComponent(idProposta)}/cancelar`,
  { method: 'POST', dados: {} },
)

export const confirmarPropostaPixMauro = (idConversa, idProposta, pin) => requisitarApi(
  `${base}/${encodeURIComponent(idConversa)}/pix/propostas/${encodeURIComponent(idProposta)}/confirmar`,
  { method: 'POST', dados: { pin } },
)
