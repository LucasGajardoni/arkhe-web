import './IndicadorEtapas.css'

function IndicadorEtapas({ etapas, etapaAtual }) {
  return (
    <div className="indicador-etapas">
      <div className="etapa-mobile">
        <strong>Etapa {etapaAtual + 1} de {etapas.length}</strong>
        <span>{etapas[etapaAtual]}</span>
      </div>
      <ol className="lista-etapas">
        {etapas.map((etapa, indice) => (
          <li className={indice === etapaAtual ? 'etapa-ativa' : indice < etapaAtual ? 'etapa-concluida' : ''} key={etapa}>
            <span>{indice < etapaAtual ? '✓' : indice + 1}</span>
            <small>{etapa}</small>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default IndicadorEtapas
