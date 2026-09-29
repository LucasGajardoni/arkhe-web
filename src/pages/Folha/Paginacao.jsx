const OPCOES = [5, 10, 25, 50, 100]

function montarPaginas(totalPaginas, atual) {
  if (totalPaginas <= 7) return Array.from({ length: totalPaginas }, (_, indice) => indice + 1)

  const paginas = new Set([1, totalPaginas, atual - 1, atual, atual + 1])
  if (atual <= 3) [2, 3, 4].forEach((pagina) => paginas.add(pagina))
  if (atual >= totalPaginas - 2) [totalPaginas - 3, totalPaginas - 2, totalPaginas - 1].forEach((pagina) => paginas.add(pagina))

  const ordenadas = [...paginas].filter((pagina) => pagina >= 1 && pagina <= totalPaginas).sort((a, b) => a - b)
  const resultado = []

  ordenadas.forEach((pagina, indice) => {
    if (indice > 0 && pagina - ordenadas[indice - 1] > 1) resultado.push(`reticencias-${pagina}`)
    resultado.push(pagina)
  })

  return resultado
}

export default function Paginacao({ total, pagina, porPagina, onPagina, onPorPagina, rotulo = 'itens' }) {
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))
  const paginaAtual = Math.min(Math.max(1, pagina), totalPaginas)
  const inicio = total === 0 ? 0 : (paginaAtual - 1) * porPagina + 1
  const fim = Math.min(paginaAtual * porPagina, total)
  const paginas = montarPaginas(totalPaginas, paginaAtual)

  function ir(paginaDestino) {
    onPagina(Math.min(Math.max(1, paginaDestino), totalPaginas))
  }

  return <div className="folha-paginacao" aria-label={`Paginação de ${rotulo}`}>
    <div className="folha-paginacao-resumo">
      <span>Mostrando <strong>{inicio}–{fim}</strong> de <strong>{total}</strong> {rotulo}</span>
      <label>Exibir
        <select value={porPagina} onChange={(e) => onPorPagina(Number(e.target.value))} aria-label={`Quantidade de ${rotulo} por página`}>
          {OPCOES.map((opcao) => <option key={opcao} value={opcao}>{opcao} por página</option>)}
        </select>
      </label>
    </div>

    {totalPaginas > 1 && <nav className="folha-paginacao-controles" aria-label="Navegação entre páginas">
      <button type="button" onClick={() => ir(1)} disabled={paginaAtual === 1} aria-label="Primeira página">«</button>
      <button type="button" onClick={() => ir(paginaAtual - 1)} disabled={paginaAtual === 1} aria-label="Página anterior">‹</button>

      <div className="folha-paginacao-numeros">
        {paginas.map((item) => typeof item === 'string'
          ? <span className="folha-paginacao-reticencias" aria-hidden="true" key={item}>…</span>
          : <button
              type="button"
              key={item}
              className={item === paginaAtual ? 'ativo' : ''}
              aria-current={item === paginaAtual ? 'page' : undefined}
              aria-label={`Página ${item}`}
              onClick={() => ir(item)}
            >{item}</button>)}
      </div>

      <button type="button" onClick={() => ir(paginaAtual + 1)} disabled={paginaAtual === totalPaginas} aria-label="Próxima página">›</button>
      <button type="button" onClick={() => ir(totalPaginas)} disabled={paginaAtual === totalPaginas} aria-label="Última página">»</button>
    </nav>}
  </div>
}
