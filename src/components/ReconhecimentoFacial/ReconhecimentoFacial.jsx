import { useEffect, useRef, useState } from 'react'
import { carregarSdkFacial, criarScannerFacial } from '../../services/facialService.js'
import './ReconhecimentoFacial.css'

export default function ReconhecimentoFacial({ modo, sessao, aoConcluir, aoErro, aoReiniciar }) {
  const areaScanner = useRef(null)
  const scanner = useRef(null)
  const temporizadorCaptura = useRef(null)
  const temporizadorInicializacao = useRef(null)
  const cameraPronta = useRef(false)
  const conclusaoEmAndamento = useRef(false)
  const tentativasComparacao = useRef(0)
  const falhasLeitura = useRef(0)
  const concluir = useRef(aoConcluir)
  const informarErro = useRef(aoErro)
  const reiniciar = useRef(aoReiniciar)
  const [iniciando, setIniciando] = useState(true)
  const [tentativa, setTentativa] = useState(0)
  const [erroScanner, setErroScanner] = useState('')
  const [mensagem, setMensagem] = useState('Preparando a câmera...')

  useEffect(() => {
    concluir.current = aoConcluir
    informarErro.current = aoErro
    reiniciar.current = aoReiniciar
  }, [aoConcluir, aoErro, aoReiniciar])

  useEffect(() => {
    let ativo = true
    const elementoScanner = areaScanner.current

    async function iniciarScanner() {
      setIniciando(true)
      setTentativa(0)
      setErroScanner('')
      tentativasComparacao.current = 0
      falhasLeitura.current = 0
      cameraPronta.current = false
      conclusaoEmAndamento.current = false
      informarErro.current?.('')
      setMensagem('Preparando a câmera...')

      try {
        await carregarSdkFacial()
        if (!ativo || !areaScanner.current) return

        function agendarCaptura(tempo = 900) {
          clearTimeout(temporizadorCaptura.current)
          temporizadorCaptura.current = setTimeout(() => {
            if (ativo && !conclusaoEmAndamento.current) {
              scanner.current?.ui?.captureButton?.click()
            }
          }, tempo)
        }

        function encerrarComErro(texto) {
          clearTimeout(temporizadorCaptura.current)
          scanner.current?.stop?.()
          setMensagem(texto)
          setErroScanner(texto)
        }

        const opcoes = {
          sessionId: sessao.session_id,
          sessionToken: sessao.session_token,
          mount: areaScanner.current,
          destroyOnClose: true,
          autoComplete: modo === 'cadastro',

          onProgress(resultado) {
            if (resultado.next_hint) setMensagem(resultado.next_hint)

            if (modo === 'cadastro' && !resultado.ready) {
              agendarCaptura()
            }
          },

          onSuccess(resultado) {
            if (!ativo || conclusaoEmAndamento.current) return

            if (modo === 'login' && !resultado.matched) {
              tentativasComparacao.current += 1
              const atual = tentativasComparacao.current
              setTentativa(atual)

              if (atual >= 3 || resultado.status === 'not_matched') {
                encerrarComErro('Rosto não reconhecido após 3 tentativas. Inicie uma nova verificação para tentar novamente.')
                return
              }

              setMensagem(`Rosto não reconhecido. Tentativa ${atual} de 3. Vamos tentar novamente.`)
              agendarCaptura(1400)
              return
            }

            conclusaoEmAndamento.current = true
            clearTimeout(temporizadorCaptura.current)

            Promise.resolve(concluir.current?.(resultado)).catch((erro) => {
              if (!ativo) return
              conclusaoEmAndamento.current = false
              encerrarComErro(erro?.message || 'Não foi possível concluir o reconhecimento facial.')
            })
          },

          onError(erro) {
            if (!ativo) return

            const texto = erro?.message || 'Não foi possível realizar o reconhecimento facial.'

            if (!cameraPronta.current) return

            const codigo = String(erro?.code || '')
            const textoLower = texto.toLowerCase()
            const maisDeUmRosto = codigo === 'ARKHE_MULTIPLE_FACES'
              || textoLower.includes('mais de uma face')
              || textoLower.includes('mais de um rosto')
            const capturaRuim = codigo === 'ARKHE_NO_FACE'
              || codigo === 'ARKHE_LOW_IMAGE_QUALITY'
              || codigo === 'HTTP_422'
              || textoLower.includes('nenhuma face')
              || textoLower.includes('qualidade insuficiente')
              || textoLower.includes('liveness insuficiente')

            if (maisDeUmRosto) {
              encerrarComErro('Mais de um rosto detectado. Deixe apenas uma pessoa em frente à câmera e tente novamente.')
              return
            }

            if (modo === 'login' && capturaRuim) {
              falhasLeitura.current += 1

              if (falhasLeitura.current >= 5) {
                encerrarComErro('Não conseguimos obter uma leitura facial válida. Ajuste a iluminação e tente novamente.')
                return
              }

              setMensagem('Não conseguimos ler seu rosto. Ajuste a posição e olhe para a câmera.')
              agendarCaptura(1300)
              return
            }

            if (modo === 'cadastro' && !textoLower.includes('limite')) {
              setMensagem(texto)
              agendarCaptura(1500)
              return
            }

            encerrarComErro(texto)
          },
        }

        scanner.current = await criarScannerFacial(modo, opcoes)

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

      if (elementoScanner) {
        elementoScanner.innerHTML = ''
      }
    }
  }, [modo, sessao])

  function tentarNovamente() {
    if (conclusaoEmAndamento.current) return
    reiniciar.current?.()
  }

  let textoStatus = mensagem

  if (iniciando) {
    textoStatus = 'Preparando a câmera...'
  } else if (modo === 'login' && tentativa > 0 && !erroScanner) {
    textoStatus = mensagem
  }

  return (
    <div className="reconhecimento-facial">
      <div ref={areaScanner} className="area-scanner-facial" />
      <p className="status-scanner-facial">{textoStatus}</p>

      {erroScanner && (
        <div className="erro-scanner-facial" role="alert">
          <p>{erroScanner}</p>
          <button className="botao botao-principal" type="button" onClick={tentarNovamente}>
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  )
}
