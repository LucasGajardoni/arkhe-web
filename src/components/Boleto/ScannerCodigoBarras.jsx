import { useScannerCamera } from '../../hooks/useScannerCamera.js'

export default function ScannerCodigoBarras({ aoLer, aoDigitar }) {
  const { videoRef, erro, codigoEncontrado, abrindo } = useScannerCamera({
    aoLer,
    formato: 'CODE_128',
    alternativaManual: 'Digite o código manualmente',
  })

  return (
    <div className="scanner-boleto">
      <div className="camera-scanner-boleto">
        <video ref={videoRef} autoPlay muted playsInline aria-label="Leitura do código de barras pela câmera" />
        <div className="moldura-scanner-boleto"><span /></div>
        {abrindo && <p className="codigo-encontrado-scanner" role="status">Abrindo câmera...</p>}
        {codigoEncontrado && <p className="codigo-encontrado-scanner">✓ Código encontrado</p>}
      </div>
      <strong>Posicione o código de barras dentro da área</strong>
      <p>Mantenha o aparelho firme e deixe o código inteiro visível.</p>
      {erro && <p className="mensagem-scanner-boleto erro" role="alert">{erro}</p>}
      <button className="botao botao-secundario" type="button" onClick={aoDigitar}>Digitar código</button>
    </div>
  )
}
