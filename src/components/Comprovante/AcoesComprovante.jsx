import { useEffect, useRef, useState } from 'react'
import { buscarComprovantePdf } from '../../services/movimentacoesService.js'
import './AcoesComprovante.css'

export default function AcoesComprovante({ idMovimentacao }) {
  const [acao, setAcao] = useState('')
  const [erro, setErro] = useState('')
  const [urlVisualizacao, setUrlVisualizacao] = useState('')
  const urlVisualizacaoRef = useRef('')
  const acaoRef = useRef('')
  const ativoRef = useRef(true)

  useEffect(() => {
    ativoRef.current = true

    return () => {
      ativoRef.current = false
      if (urlVisualizacaoRef.current) URL.revokeObjectURL(urlVisualizacaoRef.current)
    }
  }, [])

  function iniciarAcao(nome) {
    if (!idMovimentacao || acaoRef.current) return false
    acaoRef.current = nome
    setAcao(nome)
    setErro('')
    return true
  }

  function finalizarAcao() {
    acaoRef.current = ''
    if (ativoRef.current) setAcao('')
  }

  async function visualizar() {
    if (!iniciarAcao('visualizar')) return

    try {
      const arquivo = await buscarComprovantePdf(idMovimentacao)
      if (!ativoRef.current) return
      if (urlVisualizacaoRef.current) URL.revokeObjectURL(urlVisualizacaoRef.current)
      const url = URL.createObjectURL(arquivo)
      urlVisualizacaoRef.current = url
      setUrlVisualizacao(url)
    } catch (falha) {
      if (ativoRef.current) setErro(falha.message || 'Não foi possível visualizar o comprovante.')
    } finally {
      finalizarAcao()
    }
  }

  async function baixar() {
    if (!iniciarAcao('baixar')) return

    try {
      const arquivo = await buscarComprovantePdf(idMovimentacao)
      if (!ativoRef.current) return
      const url = URL.createObjectURL(arquivo)
      const link = document.createElement('a')
      link.href = url
      link.download = `comprovante-arkhe-${idMovimentacao}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (falha) {
      if (ativoRef.current) setErro(falha.message || 'Não foi possível baixar o comprovante.')
    } finally {
      finalizarAcao()
    }
  }

  function fecharVisualizacao() {
    if (urlVisualizacaoRef.current) URL.revokeObjectURL(urlVisualizacaoRef.current)
    urlVisualizacaoRef.current = ''
    setUrlVisualizacao('')
  }

  function fecharAoClicarFora(evento) {
    if (evento.target === evento.currentTarget) fecharVisualizacao()
  }

  if (!idMovimentacao) return null

  return (
    <div className="area-acoes-comprovante">
      <div className="acoes-comprovante">
        <button className="botao botao-secundario" type="button" disabled={Boolean(acao)} onClick={visualizar}>
          {acao === 'visualizar' ? 'Gerando comprovante...' : 'Visualizar comprovante'}
        </button>
        <button className="botao botao-secundario" type="button" disabled={Boolean(acao)} onClick={baixar}>
          {acao === 'baixar' ? 'Gerando comprovante...' : 'Baixar comprovante'}
        </button>
      </div>

      {erro && <p className="mensagem-comprovante erro" role="alert">{erro}</p>}

      {urlVisualizacao && (
        <div className="fundo-visualizador-comprovante" role="presentation" onMouseDown={fecharAoClicarFora}>
          <section className="visualizador-comprovante" role="dialog" aria-modal="true" aria-labelledby="titulo-visualizador-comprovante">
            <header>
              <div>
                <p>DOCUMENTO ARKHÉ</p>
                <h2 id="titulo-visualizador-comprovante">Comprovante da transação</h2>
              </div>
              <button type="button" onClick={fecharVisualizacao} aria-label="Fechar visualização">×</button>
            </header>
            <iframe src={urlVisualizacao} title={`Comprovante Arkhé ${idMovimentacao}`} />
            <footer>
              <button className="botao botao-secundario" type="button" onClick={fecharVisualizacao}>Fechar</button>
              <button className="botao botao-principal" type="button" disabled={Boolean(acao)} onClick={baixar}>
                {acao === 'baixar' ? 'Gerando comprovante...' : 'Baixar PDF'}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  )
}
