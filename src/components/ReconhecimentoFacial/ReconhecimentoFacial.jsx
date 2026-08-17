import { useEffect, useRef, useState } from 'react'
import { FACE_API_URL } from '../../App.jsx'
import './ReconhecimentoFacial.css'

const SDK_ID = 'arkhe-face-identity-sdk'

function carregarSdkFacial() {
  if (window.FaceIdentity) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const existente = document.getElementById(SDK_ID)
    if (existente) {
      existente.addEventListener('load', resolve, { once: true })
      existente.addEventListener('error', reject, { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = SDK_ID
    script.src = `${FACE_API_URL}/static/sdk/face-identity.js`
    script.onload = resolve
    script.onerror = () => reject(new Error('Não foi possível carregar o scanner facial.'))
    document.head.appendChild(script)
  })
}

export default function ReconhecimentoFacial({ modo, sessao, aoConcluir, aoErro }) {
  const areaScanner = useRef(null)
  const scanner = useRef(null)
  const temporizadorCaptura = useRef(null)
  const temporizadorInicializacao = useRef(null)
  const cameraPronta = useRef(false)
  const concluir = useRef(aoConcluir)
  const informarErro = useRef(aoErro)
  const [iniciando, setIniciando] = useState(true)
  const [tentativa, setTentativa] = useState(0)
  const [reinicio, setReinicio] = useState(0)
  const [erroScanner, setErroScanner] = useState('')
  const [mensagem, setMensagem] = useState('Preparando a câmera...')

  useEffect(() => {
    concluir.current = aoConcluir
    informarErro.current = aoErro
  }, [aoConcluir, aoErro])

  useEffect(() => {
    let ativo = true
    const elementoScanner = areaScanner.current

    async function iniciarScanner() {
      setIniciando(true)
      setErroScanner('')
      cameraPronta.current = false
      informarErro.current?.('')
      setMensagem('Preparando a câmera...')

      try {
        await carregarSdkFacial()
        if (!ativo || !areaScanner.current) return

        // O token abaixo é temporário e autoriza somente esta sessão facial.
        // A chave permanente da aplicação não é usada pelo scanner/câmera.
        // Agenda a próxima leitura sem permitir uma sequência de cliques manuais.
        // Cada nova captura só é disparada depois que a API respondeu à anterior.
        function agendarCaptura(tempo = 900) {
          clearTimeout(temporizadorCaptura.current)
          temporizadorCaptura.current = setTimeout(() => {
            if (ativo) scanner.current?.ui?.captureButton?.click()
          }, tempo)
        }

        const opcoes = {
          baseUrl: FACE_API_URL,
          sessionId: sessao.session_id,
          sessionToken: sessao.session_token,
          mount: areaScanner.current,
          destroyOnClose: true,
          autoComplete: modo === 'cadastro',
          onProgress(resultado) {
            if (resultado.next_hint) setMensagem(resultado.next_hint)

            // No enrollment, a API acumula cobertura frontal, esquerda,
            // direita, acima e abaixo. Continuamos lendo até ready=true.
            if (modo === 'cadastro' && !resultado.ready) agendarCaptura()
          },
          onSuccess(resultado) {
            if (!ativo) return

            // No login, o SDK considera a tentativa concluída mesmo quando o
            // rosto não combina. Permitimos no máximo três leituras para não
            // atingir o rate limit e mostramos uma resposta clara ao usuário.
            if (modo === 'login' && !resultado.matched) {
              if (tentativa >= 2) {
                const texto = 'Rosto não reconhecido. A pessoa não corresponde ao cadastro.'
                setMensagem(texto)
                setErroScanner(texto)
                informarErro.current?.(texto)
                return
              }

              setMensagem(`Rosto não reconhecido. Tentativa ${tentativa + 1} de 3.`)
              clearTimeout(temporizadorCaptura.current)
              temporizadorCaptura.current = setTimeout(() => {
                if (ativo) setTentativa((valor) => valor + 1)
              }, 1400)
              return
            }

            clearTimeout(temporizadorCaptura.current)
            concluir.current(resultado)
          },
          onError(erro) {
            if (!ativo) return
            const texto = erro?.message || 'Não foi possível realizar o reconhecimento facial.'

            // O SDK pode emitir falhas transitórias enquanto o elemento de vídeo
            // ainda está sendo montado. Nesse intervalo mantemos o carregamento.
            if (!cameraPronta.current) return

            const maisDeUmRosto = erro?.code === 'ARKHE_MULTIPLE_FACES'
              || texto.toLowerCase().includes('mais de uma face')
              || texto.toLowerCase().includes('mais de um rosto')
            const limiteExcedido = texto.toLowerCase().includes('limite')

            // Mais de uma pessoa no quadro invalida a leitura. Interrompemos
            // câmera e temporizador imediatamente para não continuar mandando
            // frames depois de a própria API recusar a situação.
            if (maisDeUmRosto) {
              clearTimeout(temporizadorCaptura.current)
              scanner.current?.stop?.()
              const aviso = 'Mais de um rosto detectado. Deixe apenas uma pessoa em frente à câmera e tente novamente.'
              setMensagem(aviso)
              setErroScanner(aviso)
              informarErro.current?.(aviso)
              return
            }

            setMensagem(texto)
            setErroScanner(texto)
            informarErro.current?.(texto)

            // Durante o cadastro, erros de enquadramento podem ser corrigidos
            // no próximo frame. No login, não repetimos erros HTTP para evitar
            // várias chamadas seguidas e mensagens de rate limit.
            if (modo === 'cadastro' && !limiteExcedido) {
              agendarCaptura(1500)
            } else {
              clearTimeout(temporizadorCaptura.current)
              scanner.current?.stop?.()
            }
          },
        }

        scanner.current = modo === 'cadastro'
          ? await window.FaceIdentity.enroll(opcoes)
          : await window.FaceIdentity.verify(opcoes)

        // Inicia o escaneamento automaticamente assim que a câmera estiver pronta.
        // O usuário apenas olha para a câmera e segue as orientações na tela.
        temporizadorInicializacao.current = setTimeout(() => {
          if (!ativo) return
          cameraPronta.current = true
          setIniciando(false)
          setMensagem('Câmera pronta. Olhe diretamente para a tela.')
          agendarCaptura(700)
        }, 1200)
      } catch (erro) {
        if (!ativo) return
        const texto = erro?.message || 'Não foi possível iniciar o reconhecimento facial.'
        setMensagem(texto)
        setErroScanner(texto)
        informarErro.current?.(texto)
        setIniciando(false)
      }
    }

    iniciarScanner()

    return () => {
      ativo = false
      clearTimeout(temporizadorCaptura.current)
      clearTimeout(temporizadorInicializacao.current)
      scanner.current?.stop?.()
      scanner.current = null
      if (elementoScanner) elementoScanner.innerHTML = ''
    }
  }, [modo, sessao, tentativa, reinicio])

  function tentarNovamente() {
    setTentativa(0)
    setErroScanner('')
    informarErro.current?.('')
    setReinicio((valor) => valor + 1)
  }

  return (
    <div className="reconhecimento-facial">
      <div ref={areaScanner} className="area-scanner-facial" />
      <p className="status-scanner-facial">{iniciando ? 'Preparando a câmera...' : mensagem}</p>
      {erroScanner && (
        <div className="erro-scanner-facial" role="alert">
          <p>{erroScanner}</p>
          <button className="botao botao-principal" type="button" onClick={tentarNovamente}>Tentar novamente</button>
        </div>
      )}
    </div>
  )
}
