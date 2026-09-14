import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import './QRCodePix.css'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

async function copiarTexto(texto) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(texto)
      return
    } catch {
      // Alguns navegadores bloqueiam a Clipboard API fora de um contexto seguro.
    }
  }

  const campo = document.createElement('textarea')
  campo.value = texto
  campo.readOnly = true
  campo.style.position = 'fixed'
  campo.style.opacity = '0'
  campo.style.pointerEvents = 'none'
  const elementoAnterior = document.activeElement
  document.body.appendChild(campo)
  campo.select()

  let copiado
  try {
    copiado = typeof document.execCommand === 'function' && document.execCommand('copy')
  } catch {
    copiado = false
  } finally {
    campo.remove()
    if (elementoAnterior instanceof HTMLElement) elementoAnterior.focus()
  }

  if (!copiado) throw new Error('Não foi possível copiar o código Pix.')
}

export default function QRCodePix({ codigo, valor, nomeRecebedor, aoCriarOutro, aoConcluir }) {
  const [mensagemCopia, setMensagemCopia] = useState('')
  const [erroCopia, setErroCopia] = useState('')
  const temporizadorRef = useRef(null)

  useEffect(() => () => {
    if (temporizadorRef.current) clearTimeout(temporizadorRef.current)
  }, [])

  async function copiarCodigo() {
    setErroCopia('')

    try {
      await copiarTexto(codigo)
      setMensagemCopia('Copiado!')
      if (temporizadorRef.current) clearTimeout(temporizadorRef.current)
      temporizadorRef.current = setTimeout(() => setMensagemCopia(''), 2200)
    } catch (falha) {
      setMensagemCopia('')
      setErroCopia(falha.message || 'Não foi possível copiar o código Pix.')
    }
  }

  return (
    <div className="conteudo-qr-pix">
      <div className="resumo-qr-pix">
        <small>VALOR A RECEBER</small>
        <strong>{moeda.format(Number(valor) || 0)}</strong>
      </div>

      <div className="quadro-qr-pix">
        <QRCodeSVG
          className="imagem-qr-pix"
          value={codigo}
          size={224}
          level="M"
          bgColor="#ffffff"
          fgColor="#0d4d4d"
          marginSize={2}
          role="img"
          aria-label="QR Code do Pix para receber"
        />
      </div>

      <p className="instrucao-qr-pix">Escaneie para pagar</p>
      <p className="recebedor-qr-pix">
        <strong>{nomeRecebedor || 'Cliente Arkhé'}</strong>
        <span>Banco Arkhé</span>
      </p>

      <section className="copia-cola-pix" aria-labelledby="titulo-copia-cola-pix">
        <div>
          <h3 id="titulo-copia-cola-pix">Pix Copia e Cola</h3>
          <p>Quem vai pagar também pode copiar este código.</p>
        </div>
        <code>{codigo}</code>
        <button className="botao botao-principal" type="button" onClick={copiarCodigo}>
          {mensagemCopia || 'Copiar código Pix'}
        </button>
        {mensagemCopia && <p className="feedback-copia-pix" role="status">Código Pix copiado.</p>}
        {erroCopia && <p className="erro-copia-pix" role="alert">{erroCopia}</p>}
      </section>

      <footer className="acoes-qr-pix">
        <button className="botao botao-secundario" type="button" onClick={aoCriarOutro}>Criar outro Pix</button>
        <button className="botao botao-principal" type="button" onClick={aoConcluir}>Concluir</button>
      </footer>
    </div>
  )
}
