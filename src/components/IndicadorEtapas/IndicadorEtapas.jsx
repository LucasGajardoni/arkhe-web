import './IndicadorEtapas.css'

export default function IndicadorEtapas({ etapas, etapaAtual }) {
  return (
    <div className="indicador-etapas">
      <div className="etapa-mobile">
        <strong>Etapa {etapaAtual + 1} de {etapas.length}</strong>
        <span>{etapas[etapaAtual]}</span>
      </div>
      <ol className="lista-etapas">
        {etapas.map((etapa, indice) => {
          let classeEtapa = ''
          let numeroEtapa = indice + 1

          if (indice === etapaAtual) {
            classeEtapa = 'etapa-ativa'
          } else if (indice < etapaAtual) {
            classeEtapa = 'etapa-concluida'
            numeroEtapa = '✓'
          }

          return (
            <li className={classeEtapa} key={etapa}>
              <span>{numeroEtapa}</span>
              <small>{etapa}</small>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
