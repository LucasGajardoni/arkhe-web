import { useMemo, useState } from 'react'
import './FormAgendamento.css'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function formatoLocal(data) {
  const pad = (valor) => String(valor).padStart(2, '0')
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}T${pad(data.getHours())}:${pad(data.getMinutes())}`
}

function horarioMinimoAgendamento() {
  return formatoLocal(new Date(Date.now() + 2 * 60 * 1000))
}

function horarioInicial() {
  return formatoLocal(new Date(Date.now() + 60 * 60 * 1000))
}

export default function FormAgendamento({ valor, destinatario, tipo, erro, processando, aoVoltar, aoConfirmar }) {
  const [data, setData] = useState(horarioInicial)
  const minimo = useMemo(() => horarioMinimoAgendamento(), [])

  return (
    <div className="form-agendamento">
      <div className="resumo-form-agendamento">
        <small>{tipo}</small>
        <strong>{moeda.format(Number(valor) || 0)}</strong>
        <span>{destinatario || 'Destinatário'}</span>
      </div>
      <label htmlFor="data-agendamento">Data e horário</label>
      <input id="data-agendamento" type="datetime-local" min={minimo} value={data} onChange={(evento) => setData(evento.target.value)} required />
      <small className="fuso-agendamento">Horário de São Paulo. O saldo só será verificado na data programada.</small>
      {erro && <p className="erro-form-agendamento" role="alert">{erro}</p>}
      <p className="confirmacao-form-agendamento">Ao confirmar, o Arkhé salvará a instrução. A execução revalidará saldo, permissões e limites.</p>
      <footer>
        <button className="botao botao-secundario" type="button" onClick={aoVoltar} disabled={processando}>Voltar</button>
        <button className="botao botao-principal" type="button" onClick={() => aoConfirmar(data)} disabled={processando || !data}>
          {processando ? 'Salvando…' : 'Confirmar agendamento'}
        </button>
      </footer>
    </div>
  )
}
