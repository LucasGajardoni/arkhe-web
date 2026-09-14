import { useEffect, useRef, useState } from 'react'

function mensagemCamera(erro, alternativaManual) {
  if (erro?.name === 'NotAllowedError' || erro?.name === 'SecurityError') {
    return `Permissão da câmera negada. Libere o acesso. ${alternativaManual}.`
  }
  if (erro?.name === 'NotFoundError' || erro?.name === 'DevicesNotFoundError') {
    return 'Nenhuma câmera foi encontrada neste dispositivo.'
  }
  if (erro?.name === 'NotReadableError' || erro?.name === 'TrackStartError') {
    return 'A câmera está ocupada por outro aplicativo.'
  }
  return `Não foi possível iniciar a câmera. ${alternativaManual}.`
}

function pararTracks(video) {
  const transmissao = video?.srcObject
  if (transmissao?.getTracks) transmissao.getTracks().forEach((track) => track.stop())
  if (video) video.srcObject = null
}

export function useScannerCamera({ aoLer, formato, alternativaManual }) {
  const videoRef = useRef(null)
  const aoLerRef = useRef(aoLer)
  const [erro, setErro] = useState('')
  const [codigoEncontrado, setCodigoEncontrado] = useState(false)
  const [abrindo, setAbrindo] = useState(true)

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
        setAbrindo(false)
        setErro(`A câmera precisa de uma conexão HTTPS. ${alternativaManual}.`)
        return
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setAbrindo(false)
        setErro('Este navegador não oferece acesso compatível à câmera.')
        return
      }

      try {
        const modulo = await import('@zxing/browser')
        if (!ativo) return

        let leitor
        if (formato === 'QR_CODE') {
          leitor = new modulo.BrowserQRCodeReader()
        } else {
          leitor = new modulo.BrowserMultiFormatReader()
          leitor.possibleFormats = [modulo.BarcodeFormat[formato]]
        }

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
            setAbrindo(false)
            setCodigoEncontrado(true)
            temporizadorLeitura = setTimeout(() => {
              if (ativo) aoLerRef.current(codigo)
            }, 450)
          },
        )

        if (!ativo) {
          novosControles.stop()
          pararTracks(elementoVideo)
          return
        }

        controles = novosControles
        setAbrindo(false)
      } catch (falha) {
        pararTracks(elementoVideo)
        if (ativo) {
          setAbrindo(false)
          setErro(mensagemCamera(falha, alternativaManual))
        }
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
  }, [alternativaManual, formato])

  return { videoRef, erro, codigoEncontrado, abrindo }
}
