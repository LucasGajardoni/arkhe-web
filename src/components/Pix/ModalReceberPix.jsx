import { useRef, useState } from 'react'
import { useModalAcessivel } from '../../hooks/useModalAcessivel.js'
import { criarCobrancaPix } from '../../services/pixService.js'
import QRCodePix from './QRCodePix.jsx'
import './ModalReceberPix.css'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function nomeDaConta(usuario) {
  if (usuario?.tipoConta === 'PJ') {
    return usuario.nomeFantasia || usuario.razaoSocial || usuario.nome || 'Conta empresarial Arkhé'
  }
  return usuario?.nome || 'Cliente Arkhé'
}

export default function ModalReceberPix({ usuario, fechar, aoCriar }) {
  const [centavos, setCentavos] = useState(0)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')
  const [cobranca, setCobranca] = useState(null)
  const processandoRef = useRef(false)
  const { modalRef, fecharAoClicarFora } = useModalAcessivel(fechar, processando)
  const valor = Number((centavos / 100).toFixed(2))

  function alterarValor(evento) {
    const digitos = evento.target.value.replace(/\D/g, '').slice(0, 13)
    setCentavos(Number(digitos) || 0)
    setErro('')
  }

  async function gerar(evento) {
    evento.preventDefault()
    if (processandoRef.current || valor <= 0) return

    processandoRef.current = true
    setProcessando(true)
    setErro('')

    try {
      const resposta = await criarCobrancaPix(valor)
      const codigoPagamento = String(resposta.codigo_pagamento ?? '')
      const valorResposta = Number(resposta.valor)

      if (!codigoPagamento.trim()) {
        throw new Error('O servidor não retornou o código do Pix. Tente novamente.')
      }

      setCobranca({
        ...resposta,
        codigo_pagamento: codigoPagamento,
        valor: Number.isFinite(valorResposta) && valorResposta > 0 ? valorResposta : valor,
      })
      Promise.resolve(aoCriar?.()).catch(() => {})
    } catch (falha) {
      setErro(falha.message || 'Não foi possível gerar o Pix para receber.')
    } finally {
      processandoRef.current = false
      setProcessando(false)
    }
  }

  function criarOutro() {
    setCobranca(null)
    setCentavos(0)
    setErro('')
  }

  return (
    <div className="fundo-modal-perfil" role="presentation" onMouseDown={fecharAoClicarFora}>
      <section
        ref={modalRef}
        className="modal-perfil modal-receber-pix"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-receber-pix"
        tabIndex="-1"
      >
        <header>
          <div>
            <p>RECEBER PIX</p>
            <h2 id="titulo-receber-pix">{cobranca ? 'Pix para receber' : 'Quanto você quer receber?'}</h2>
            <span>{cobranca ? 'Compartilhe o QR Code ou o código Pix.' : 'Crie uma cobrança Pix para sua conta atual.'}</span>
          </div>
          <button type="button" disabled={processando} onClick={fechar} aria-label="Fechar modal">×</button>
        </header>

        {cobranca ? (
          <QRCodePix
            codigo={cobranca.codigo_pagamento}
            valor={cobranca.valor}
            nomeRecebedor={nomeDaConta(usuario)}
            aoCriarOutro={criarOutro}
            aoConcluir={fechar}
          />
        ) : (
          <form className="form-receber-pix" onSubmit={gerar} aria-busy={processando}>
            <label>
              <span>Valor do Pix</span>
              <input
                autoFocus
                inputMode="decimal"
                autoComplete="off"
                value={moeda.format(valor)}
                onChange={alterarValor}
                disabled={processando}
                required
                aria-label="Valor do Pix para receber"
                aria-describedby="ajuda-valor-receber-pix"
              />
              <small id="ajuda-valor-receber-pix">Informe um valor maior que zero.</small>
            </label>

            <div className="aviso-receber-pix">
              <span aria-hidden="true">↓</span>
              <p>
                <strong>O dinheiro entra na conta atual</strong>
                <small>O código Pix e o QR Code aparecem após a confirmação.</small>
              </p>
            </div>

            {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}

            <footer>
              <button className="botao botao-secundario" type="button" disabled={processando} onClick={fechar}>Cancelar</button>
              <button className="botao botao-principal" type="submit" disabled={processando || valor <= 0}>
                {processando ? 'Gerando Pix...' : 'Gerar Pix'}
              </button>
            </footer>
          </form>
        )}
      </section>
    </div>
  )
}
