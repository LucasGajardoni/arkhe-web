import { formatarLimite, percentualUtilizado } from './cartaoUtils.js'

export default function GraficoLimite({ cartao }) {
  const utilizado = Number(cartao?.limite_utilizado) || 0
  const disponivel = Number(cartao?.limite_disponivel) || 0
  const totalInformado = Number(cartao?.limite_total)
  const possuiTotalInformado = cartao?.limite_total != null && cartao?.limite_total !== '' && Number.isFinite(totalInformado)
  const total = possuiTotalInformado ? totalInformado : utilizado + disponivel
  const percentual = percentualUtilizado(total, utilizado)
  const percentualExibido = Math.round(percentual)

  return <aside className="grafico-limite-cartao" aria-label="Resumo visual do limite">
    <div className="grafico-limite-cabecalho">
      <span>USO DO LIMITE</span>
      <strong>{percentualExibido}%</strong>
    </div>

    <div className="anel-limite" role="img" aria-label={`${percentualExibido}% do limite utilizado`}>
      <span style={{ width: `${percentual}%` }} />
    </div>

    <div className="legenda-limite">
      <span><i className="legenda-utilizado" />Utilizado <strong>{formatarLimite(utilizado)}</strong></span>
      <span><i className="legenda-disponivel" />Disponível <strong>{formatarLimite(disponivel)}</strong></span>
    </div>

    <p>Limite total de <strong>{formatarLimite(total)}</strong></p>
  </aside>
}
