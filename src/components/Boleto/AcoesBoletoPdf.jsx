import { useEffect, useRef, useState } from 'react'
import { buscarBoletoPdf } from '../../services/movimentacoesService.js'
import './AcoesBoletoPdf.css'

export default function AcoesBoletoPdf({ idCobranca }) {
  const [acao, setAcao] = useState('')
  const [erro, setErro] = useState('')
  const [urlVisualizacao, setUrlVisualizacao] = useState('')
  const urlVisualizacaoRef = useRef('')
  const ativoRef = useRef(true)

  useEffect(() => {
    ativoRef.current = true

    return () => {
      ativoRef.current = false
      if (urlVisualizacaoRef.current) URL.revokeObjectURL(urlVisualizacaoRef.current)
    }
  }, [])

  async function visualizar() {
    if (!idCobranca || acao) return
    setAcao('visualizar')
    setErro('')

    try {
      const arquivo = await buscarBoletoPdf(idCobranca)
      if (!ativoRef.current) return
      if (urlVisualizacaoRef.current) URL.revokeObjectURL(urlVisualizacaoRef.current)
      const url = URL.createObjectURL(arquivo)
      urlVisualizacaoRef.current = url
      setUrlVisualizacao(url)
    } catch (falha) {
      if (ativoRef.current) setErro(falha.message || 'Não foi possível visualizar o boleto.')
    } finally {
      if (ativoRef.current) setAcao('')
    }
  }

  async function baixar() {
    if (!idCobranca || acao) return
    setAcao('baixar')
    setErro('')

    try {
      const arquivo = await buscarBoletoPdf(idCobranca)
      if (!ativoRef.current) return
      const url = URL.createObjectURL(arquivo)
      const link = document.createElement('a')
      link.href = url
      link.download = `boleto-arkhe-${idCobranca}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (falha) {
      if (ativoRef.current) setErro(falha.message || 'Não foi possível baixar o boleto.')
    } finally {
      if (ativoRef.current) setAcao('')
    }
  }

  function fecharVisualizacao() {
    if (urlVisualizacaoRef.current) URL.revokeObjectURL(urlVisualizacaoRef.current)
    urlVisualizacaoRef.current = ''
    setUrlVisualizacao('')
  }

  if (!idCobranca) return null

  return (
    <div className="area-acoes-pdf-boleto">
      <div className="acoes-pdf-boleto">
        <button className="botao botao-secundario" type="button" disabled={Boolean(acao)} onClick={visualizar}>
          {acao === 'visualizar' ? 'Carregando...' : 'Visualizar boleto'}
        </button>
        <button className="botao botao-secundario" type="button" disabled={Boolean(acao)} onClick={baixar}>
          {acao === 'baixar' ? 'Baixando...' : 'Baixar PDF'}
        </button>
      </div>

      {erro && <p className="mensagem-pdf-boleto erro" role="alert">{erro}</p>}

      {urlVisualizacao && (
        <div className="fundo-visualizador-boleto" role="presentation">
          <section className="visualizador-boleto" role="dialog" aria-modal="true" aria-labelledby="titulo-visualizador-boleto">
            <header>
              <div>
                <p>DOCUMENTO ARKHÉ</p>
                <h2 id="titulo-visualizador-boleto">Visualizar boleto</h2>
              </div>
              <button type="button" onClick={fecharVisualizacao} aria-label="Fechar visualização">×</button>
            </header>
            <iframe src={urlVisualizacao} title={`Boleto Arkhé ${idCobranca}`} />
            <footer>
              <button className="botao botao-secundario" type="button" onClick={fecharVisualizacao}>Fechar</button>
              <button className="botao botao-principal" type="button" disabled={Boolean(acao)} onClick={baixar}>Baixar PDF</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  )
}
