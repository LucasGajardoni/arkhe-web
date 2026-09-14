import { useScannerCamera } from '../../hooks/useScannerCamera.js'
import './ScannerQrPix.css'

export default function ScannerQrPix({ aoLer, aoColar, erroExterno = '' }) {
  const { videoRef, erro, codigoEncontrado, abrindo } = useScannerCamera({
    aoLer,
    formato: 'QR_CODE',
    alternativaManual: 'Use o Pix Copia e Cola',
  })

  return (
    <div className="scanner-qr-pix">
      <div className="camera-scanner-qr-pix">
        <video ref={videoRef} autoPlay muted playsInline aria-label="Leitura de QR Code Pix pela câmera" />
        <div className="moldura-scanner-qr-pix"><span /></div>
        {abrindo && <p className="estado-camera-qr-pix" role="status">Abrindo câmera...</p>}
        {codigoEncontrado && <p className="codigo-encontrado-qr-pix">✓ QR Code encontrado</p>}
      </div>
      <strong>Posicione o QR Code dentro da área</strong>
      <p>Mantenha o aparelho firme e o código inteiro visível.</p>
      {erro && <p className="mensagem-scanner-qr-pix erro" role="alert">{erro}</p>}
      {erroExterno && <p className="mensagem-scanner-qr-pix erro" role="alert">{erroExterno}</p>}
      <button className="botao botao-secundario" type="button" onClick={aoColar}>Usar Pix Copia e Cola</button>
    </div>
  )
}
