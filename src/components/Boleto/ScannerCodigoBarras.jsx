import { useEffect, useRef, useState } from 'react'

function mensagemCamera(erro) {
  if (erro?.name === 'NotAllowedError' || erro?.name === 'SecurityError') {
    return 'Permissão da câmera negada. Libere o acesso ou digite o código manualmente.'
  }
  if (erro?.name === 'NotFoundError' || erro?.name === 'DevicesNotFoundError') {
    return 'Nenhuma câmera foi encontrada neste dispositivo.'
  }
  if (erro?.name === 'NotReadableError' || erro?.name === 'TrackStartError') {
    return 'A câmera está ocupada por outro aplicativo.'
  }
  return 'Não foi possível iniciar a câmera. Digite o código manualmente.'
}

function pararTracks(video) {
  const transmissao = video?.srcObject
  if (transmissao?.getTracks) transmissao.getTracks().forEach((track) => track.stop())
  if (video) video.srcObject = null
}

export default function ScannerCodigoBarras({ aoLer, aoDigitar }) {
  const videoRef = useRef(null)
  const aoLerRef = useRef(aoLer)
  const [erro, setErro] = useState('')
  const [codigoEncontrado, setCodigoEncontrado] = useState('')

  useEffect(() => {
    aoLerRef.current = aoLer
  }, [aoLer])

  useEffect(() => {
    let ativo = true
    let leituraConcluida = false
    let controles
    let temporizadorLeitura
    const elementoVideo = videoRef.current

    async function iniciar() {
      if (!window.isSecureContext && !['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)) {
        setErro('A câmera precisa de uma conexão HTTPS. Você ainda pode digitar o código.')
        return
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setErro('Este navegador não oferece acesso compatível à câmera.')
        return
      }

      try {
        const { BarcodeFormat, BrowserMultiFormatReader } = await import('@zxing/browser')
        if (!ativo) return

        const leitor = new BrowserMultiFormatReader()
        leitor.possibleFormats = [BarcodeFormat.CODE_128]
        const novosControles = await leitor.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          elementoVideo,
          (resultado, _erroLeitura, controlesLeitura) => {
            if (!ativo || leituraConcluida || !resultado) return

            const codigo = resultado.getText().trim()
            if (!codigo) return

            leituraConcluida = true
            controlesLeitura.stop()
            pararTracks(elementoVideo)
            setCodigoEncontrado(codigo)
            temporizadorLeitura = setTimeout(() => {
              if (ativo) aoLerRef.current(codigo)
            }, 500)
          },
        )

        if (!ativo) {
          novosControles.stop()
          pararTracks(elementoVideo)
          return
        }

        controles = novosControles
      } catch (falha) {
        pararTracks(elementoVideo)
        if (ativo) setErro(mensagemCamera(falha))
      }
    }

    const temporizadorInicio = setTimeout(iniciar, 0)

    return () => {
      ativo = false
      clearTimeout(temporizadorInicio)
      if (temporizadorLeitura) clearTimeout(temporizadorLeitura)
      if (controles) controles.stop()
      pararTracks(elementoVideo)
    }
  }, [])

  return (
    <div className="scanner-boleto">
      <div className="camera-scanner-boleto">
        <video ref={videoRef} autoPlay muted playsInline />
        <div className="moldura-scanner-boleto"><span /></div>
        {codigoEncontrado && <p className="codigo-encontrado-scanner">✓ Código encontrado</p>}
      </div>
      <strong>Posicione o código de barras dentro da área</strong>
      <p>Mantenha o aparelho firme e deixe o código inteiro visível.</p>
      {erro && <p className="mensagem-scanner-boleto erro" role="alert">{erro}</p>}
      <button className="botao botao-secundario" type="button" onClick={aoDigitar}>Digitar código</button>
    </div>
  )
}
