import { useEffect, useRef, useState } from 'react'
import './CapturaFacial.css'

function CapturaFacial({ capturasFaciais, setCapturasFaciais, contaEmpresarial = false }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [estadoCaptura, setEstadoCaptura] = useState(capturasFaciais.frontal ? 'concluida' : 'introducao')
  const [mensagemErro, setMensagemErro] = useState('')

  function encerrarCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((faixa) => faixa.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }

  useEffect(() => () => encerrarCamera(), [])

  useEffect(() => {
    if (estadoCaptura === 'camera' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [estadoCaptura])

  async function iniciarCamera() {
    setEstadoCaptura('solicitando')
    setMensagemErro('')
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error()
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 } }, audio: false })
      streamRef.current = stream
      setEstadoCaptura('camera')
    } catch (erro) {
      encerrarCamera()
      setEstadoCaptura('erro')
      if (erro.name === 'NotAllowedError') {
        setMensagemErro('Não foi possível acessar a câmera. Verifique a permissão do navegador.')
      } else if (erro.name === 'NotFoundError') {
        setMensagemErro('Nenhuma câmera disponível foi encontrada.')
      } else {
        setMensagemErro('Não foi possível iniciar a câmera. Tente novamente.')
      }
    }
  }

  function capturarImagem() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video?.videoWidth || !canvas) {
      setMensagemErro('A câmera ainda está iniciando. Aguarde um instante e tente novamente.')
      return
    }
    const largura = 560
    const altura = Math.round((video.videoHeight / video.videoWidth) * largura)
    canvas.width = largura
    canvas.height = altura
    canvas.getContext('2d').drawImage(video, 0, 0, largura, altura)
    setCapturasFaciais({ frontal: canvas.toDataURL('image/jpeg', 0.8) })
    encerrarCamera()
    setEstadoCaptura('concluida')
  }

  function cancelarCaptura() {
    encerrarCamera()
    setEstadoCaptura('introducao')
    setMensagemErro('')
  }

  function refazerCaptura() {
    setCapturasFaciais({ frontal: '' })
    setEstadoCaptura('introducao')
  }

  if (estadoCaptura === 'introducao') {
    return (
      <div className="introducao-facial introducao-facial-compacta">
        <div className="icone-camera" aria-hidden="true">◎</div>
        <h3>{contaEmpresarial ? 'Foto do responsável' : 'Confirme sua foto'}</h3>
        <p>Fique em um local iluminado e mantenha o rosto dentro da área indicada.</p>
        <button className="botao botao-principal" type="button" onClick={iniciarCamera}>Abrir câmera</button>
      </div>
    )
  }

  if (estadoCaptura === 'solicitando') return <div className="estado-facial"><span className="carregando" /><p>Abrindo câmera...</p></div>

  if (estadoCaptura === 'erro') {
    return <div className="estado-facial"><p className="mensagem-erro">{mensagemErro}</p><button className="botao botao-principal" type="button" onClick={iniciarCamera}>Tentar novamente</button></div>
  }

  if (estadoCaptura === 'concluida') {
    return (
      <div className="captura-concluida captura-concluida-compacta">
        <span className="sinal-concluido">✓</span>
        <h3>Foto capturada</h3>
        <figure className="foto-facial"><img src={capturasFaciais.frontal} alt="Captura facial frontal" /></figure>
        <button className="botao botao-secundario" type="button" onClick={refazerCaptura}>Refazer foto</button>
      </div>
    )
  }

  return (
    <div className="camera-facial">
      <h3>Olhe diretamente para a câmera</h3>
      <div className="area-video area-video-compacta">
        <video ref={videoRef} autoPlay muted playsInline aria-label="Olhe diretamente para a câmera" />
        <div className="moldura-rosto" />
      </div>
      <canvas ref={canvasRef} hidden />
      {mensagemErro && <p className="mensagem-erro">{mensagemErro}</p>}
      <div className="acoes-camera">
        <button className="botao botao-secundario" type="button" onClick={cancelarCaptura}>Cancelar</button>
        <button className="botao botao-principal" type="button" onClick={capturarImagem}>Capturar foto</button>
      </div>
    </div>
  )
}

export default CapturaFacial
