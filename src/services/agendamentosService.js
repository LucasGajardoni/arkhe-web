import { requisitarApi } from './authService.js'

export const listarAgendamentos = () => requisitarApi('/api/v1/agendamentos')

export const criarAgendamento = (dados) => requisitarApi(
  '/api/v1/agendamentos',
  { method: 'POST', dados },
)

export const cancelarAgendamento = (idAgendamento) => requisitarApi(
  `/api/v1/agendamentos/${encodeURIComponent(idAgendamento)}/cancelar`,
  { method: 'PATCH', dados: {} },
)
