import { useState } from 'react'
import './FormRecorrencia.css'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function formatoLocal(data) {
  const pad = (valor) => String(valor).padStart(2, '0')
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}T${pad(data.getHours())}:${pad(data.getMinutes())}`
}

function dataInicial() {
  const data = new Date()
  data.setDate(data.getDate() + 1)
  data.setHours(9, 0, 0, 0)
  return formatoLocal(data)
}

function dataMinima() {
  return formatoLocal(new Date(Date.now() + 2 * 60 * 1000))
}

export default function FormRecorrencia({
  tipo,
  valor,
  destinatario,
  observacao,
  erro,
  processando,
  aoVoltar,
  aoConfirmar,
}) {
  const [frequencia, setFrequencia] = useState('MENSAL')
  const [inicio, setInicio] = useState(dataInicial)
  const [tipoTermino, setTipoTermino] = useState('nunca')
  const [dataFinal, setDataFinal] = useState('')
  const [quantidade, setQuantidade] = useState('12')
  const [autorizado, setAutorizado] = useState(false)
  const minimo = dataMinima()

  function enviar(evento) {
    evento.preventDefault()
    aoConfirmar({
      frequencia,
      data_inicio: inicio,
      data_final: tipoTermino === 'data' ? dataFinal : null,
      limite_execucoes: tipoTermino === 'quantidade' ? Number(quantidade) : null,
      autorizacao_futura: autorizado,
    })
  }

  return (
    <form className="form-recorrencia" onSubmit={enviar}>
      <div className="resumo-form-recorrencia">
        <small>{tipo}</small>
        <strong>{moeda.format(Number(valor) || 0)}</strong>
        <span>{destinatario || 'Destinatário'}</span>
      </div>

      <label>
        Frequência
        <select value={frequencia} onChange={(evento) => setFrequencia(evento.target.value)}>
          <option value="SEMANAL">Semanal</option>
          <option value="QUINZENAL">Quinzenal</option>
          <option value="MENSAL">Mensal</option>
        </select>
      </label>
      <label>
        Primeira execução · horário de São Paulo
        <input type="datetime-local" min={minimo} value={inicio} onChange={(evento) => setInicio(evento.target.value)} required />
      </label>
      {frequencia === 'MENSAL' && (
        <p className="nota-mensal-recorrencia">
          Para dias 29, 30 ou 31, nos meses mais curtos a execução será no último dia do mês.
        </p>
      )}

      <fieldset className="termino-recorrencia">
        <legend>Quando encerrar</legend>
        <label><input type="radio" name="termino-recorrencia" checked={tipoTermino === 'nunca'} onChange={() => setTipoTermino('nunca')} /> Sem data final</label>
        <label><input type="radio" name="termino-recorrencia" checked={tipoTermino === 'data'} onChange={() => setTipoTermino('data')} /> Em uma data</label>
        {tipoTermino === 'data' && <input aria-label="Data final" type="date" min={inicio.slice(0, 10)} value={dataFinal} onChange={(evento) => setDataFinal(evento.target.value)} required />}
        <label><input type="radio" name="termino-recorrencia" checked={tipoTermino === 'quantidade'} onChange={() => setTipoTermino('quantidade')} /> Após um número de execuções</label>
        {tipoTermino === 'quantidade' && (
          <input aria-label="Quantidade de execuções" type="number" min="1" max="1200" value={quantidade} onChange={(evento) => setQuantidade(evento.target.value)} required />
        )}
      </fieldset>

      {observacao && <p className="aviso-boleto-recorrencia">{observacao}</p>}
      <label className="autorizacao-recorrencia">
        <input type="checkbox" checked={autorizado} onChange={(evento) => setAutorizado(evento.target.checked)} required />
        <span>Autorizo as próximas execuções desta recorrência. Nenhum valor será debitado agora; em cada data o Arkhé verificará novamente saldo, limites, destinatário e permissões. Posso pausar ou cancelar antes de uma execução.</span>
      </label>
      {erro && <p className="erro-form-recorrencia" role="alert">{erro}</p>}
      <footer>
        <button className="botao botao-secundario" type="button" onClick={aoVoltar} disabled={processando}>Voltar</button>
        <button className="botao botao-principal" type="submit" disabled={processando || !autorizado || !inicio || (tipoTermino === 'data' && !dataFinal) || (tipoTermino === 'quantidade' && (!quantidade || Number(quantidade) < 1))}>
          {processando ? 'Salvando…' : 'Autorizar recorrência'}
        </button>
      </footer>
    </form>
  )
}
