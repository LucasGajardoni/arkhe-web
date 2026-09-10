import { useEffect, useRef, useState } from 'react'
import {
  buscarCobrancaPorCodigo,
  pagarCobranca,
} from '../../services/movimentacoesService.js'
import { formatarDataBrasileira } from '../../utils/formatadores.js'
import ScannerCodigoBarras from './ScannerCodigoBarras.jsx'
import './ModalPagarBoleto.css'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

function limparCodigo(valor) {
  return String(valor || '').replace(/\s+/g, '')
}

function somenteData(valor) {
  return String(valor || '').slice(0, 10)
}

function beneficiarioBoleto(boleto) {
  if (typeof boleto.recebedor === 'string' && boleto.recebedor.trim()) return boleto.recebedor
  return boleto.recebedor?.nome_fantasia
    || boleto.recebedor?.razao_social
    || boleto.recebedor?.nome
    || boleto.nome_recebedor
    || (boleto.id_recebedor != null ? `Conta beneficiária #${boleto.id_recebedor}` : 'Beneficiário não informado')
}

function descricaoConta(usuario) {
  const partes = [`Conta ${usuario.tipoConta}`]
  if (usuario.banco) partes.push(usuario.banco)
  if (usuario.agencia) partes.push(`Agência ${usuario.agencia}`)
  if (usuario.numeroConta) partes.push(`Conta ${usuario.numeroConta}`)
  return partes.join(' · ')
}

function formatarDataHora(valor) {
  if (!valor) return ''
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return ''
  return dataHora.format(data)
}

export default function ModalPagarBoleto({ usuario, fechar, atualizar }) {
  const [etapa, setEtapa] = useState('entrada')
  const [codigo, setCodigo] = useState('')
  const [boleto, setBoleto] = useState(null)
  const [resultadoPagamento, setResultadoPagamento] = useState(null)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')
  const processandoRef = useRef(false)

  useEffect(() => {
    function fecharComEsc(evento) {
      if (evento.key === 'Escape' && !processando) fechar()
    }

    document.addEventListener('keydown', fecharComEsc)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', fecharComEsc)
      document.body.style.overflow = ''
    }
  }, [fechar, processando])

  function fecharAoClicarFora(evento) {
    if (evento.target === evento.currentTarget && !processando) fechar()
  }

  async function localizarBoleto(codigoInformado) {
    const codigoLimpo = limparCodigo(codigoInformado)
    if (!codigoLimpo || processandoRef.current) {
      if (!codigoLimpo) setErro('Digite ou escaneie o código do boleto.')
      return
    }

    processandoRef.current = true
    setProcessando(true)
    setErro('')
    setCodigo(codigoLimpo)
    setEtapa('buscando')

    try {
      const resposta = await buscarCobrancaPorCodigo(codigoLimpo)
      const cobranca = resposta.cobranca || resposta
      if (cobranca.id_cobranca == null) throw new Error('Boleto não encontrado.')
      setBoleto(cobranca)
      setEtapa('revisao')
    } catch (falha) {
      setBoleto(null)
      setErro(falha.message || 'Boleto não encontrado.')
      setEtapa('entrada')
    } finally {
      processandoRef.current = false
      setProcessando(false)
    }
  }

  async function confirmarPagamento() {
    if (!boleto || Number(boleto.status) === 1 || processandoRef.current) return

    processandoRef.current = true
    setProcessando(true)
    setErro('')

    try {
      const resposta = await pagarCobranca(boleto.id_cobranca)
      setResultadoPagamento(resposta)
      await atualizar()
      setEtapa('sucesso')
    } catch (falha) {
      setErro(falha.message || 'Não foi possível pagar o boleto.')
    } finally {
      processandoRef.current = false
      setProcessando(false)
    }
  }

  let conteudo

  if (etapa === 'entrada') {
    conteudo = (
      <div className="conteudo-pagar-boleto">
        <div className="modos-pagar-boleto">
          <button className="ativo" type="button">Digitar código</button>
          <button type="button" onClick={() => { setErro(''); setEtapa('scanner') }}>Escanear código</button>
        </div>

        <form onSubmit={(evento) => { evento.preventDefault(); localizarBoleto(codigo) }}>
          <label className="campo-codigo-pagar-boleto">
            <span>Código do boleto</span>
            <input
              autoFocus
              inputMode="numeric"
              autoComplete="off"
              value={codigo}
              onChange={(evento) => { setCodigo(evento.target.value); setErro('') }}
              placeholder="2480000000027"
            />
            <small>Você pode digitar ou colar o código de pagamento.</small>
          </label>

          {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}

          <footer>
            <button className="botao botao-secundario" type="button" onClick={fechar}>Cancelar</button>
            <button className="botao botao-principal" type="submit" disabled={!limparCodigo(codigo)}>Continuar</button>
          </footer>
        </form>
      </div>
    )
  } else if (etapa === 'scanner') {
    conteudo = (
      <div className="conteudo-pagar-boleto">
        <div className="modos-pagar-boleto">
          <button type="button" onClick={() => setEtapa('entrada')}>Digitar código</button>
          <button className="ativo" type="button">Escanear código</button>
        </div>
        <ScannerCodigoBarras aoLer={localizarBoleto} aoDigitar={() => setEtapa('entrada')} />
      </div>
    )
  } else if (etapa === 'buscando') {
    conteudo = (
      <div className="buscando-codigo-boleto" role="status">
        <span />
        <strong>Consultando o boleto...</strong>
        <p>Estamos conferindo o código informado.</p>
      </div>
    )
  } else if (etapa === 'revisao') {
    const pago = Number(boleto.status) === 1
    const vencimento = somenteData(boleto.data_vencimento)

    conteudo = (
      <div className="conteudo-pagar-boleto revisao-pagar-boleto">
        <div className="beneficiario-pagar-boleto">
          <span>{beneficiarioBoleto(boleto).slice(0, 1).toUpperCase()}</span>
          <div><small>BENEFICIÁRIO</small><strong>{beneficiarioBoleto(boleto)}</strong></div>
        </div>

        <strong className="valor-revisao-boleto">{moeda.format(Number(boleto.valor) || 0)}</strong>

        <dl>
          <div><dt>Vencimento</dt><dd>{vencimento ? formatarDataBrasileira(vencimento) : 'Não informado'}</dd></div>
          <div><dt>Código</dt><dd className="codigo-revisao-boleto">{boleto.codigo_pagamento || codigo}</dd></div>
          <div><dt>Situação</dt><dd>{pago ? 'Boleto já pago' : 'Pendente'}</dd></div>
          <div><dt>Conta que realizará o pagamento</dt><dd>{descricaoConta(usuario)}</dd></div>
        </dl>

        {pago && <p className="aviso-boleto-pago">Este boleto já foi pago e não pode ser pago novamente.</p>}
        {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}

        <footer>
          <button className="botao botao-secundario" type="button" onClick={() => { setErro(''); setEtapa('entrada') }}>Voltar</button>
          <button className="botao botao-principal" type="button" disabled={pago} onClick={() => setEtapa('confirmacao')}>Continuar</button>
        </footer>
      </div>
    )
  } else if (etapa === 'confirmacao') {
    conteudo = (
      <div className="confirmacao-pagar-codigo">
        <span>!</span>
        <h3>Confirmar pagamento?</h3>
        <p>
          Confirmar pagamento de <strong>{moeda.format(Number(boleto.valor) || 0)}</strong>
          {' '}para <strong>{beneficiarioBoleto(boleto)}</strong>?
        </p>
        {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}
        <footer>
          <button className="botao botao-secundario" type="button" disabled={processando} onClick={() => { setErro(''); setEtapa('revisao') }}>Voltar</button>
          <button className="botao botao-principal" type="button" disabled={processando} onClick={confirmarPagamento}>
            {processando ? 'Processando...' : 'Confirmar pagamento'}
          </button>
        </footer>
      </div>
    )
  } else {
    const momentoPagamento = formatarDataHora(
      resultadoPagamento?.data_pagamento || resultadoPagamento?.data_hora,
    )

    conteudo = (
      <div className="sucesso-pagamento-codigo" role="status">
        <span>✓</span>
        <h3>Boleto pago com sucesso</h3>
        <strong>{moeda.format(Number(boleto.valor) || 0)}</strong>
        <p>{beneficiarioBoleto(boleto)}</p>
        {momentoPagamento && <small>{momentoPagamento}</small>}
        <button className="botao botao-principal" type="button" onClick={fechar}>Concluir</button>
      </div>
    )
  }

  return (
    <div className="fundo-modal-perfil" role="presentation" onMouseDown={fecharAoClicarFora}>
      <section className="modal-perfil modal-pagar-boleto" role="dialog" aria-modal="true" aria-labelledby="titulo-pagar-boleto">
        <header>
          <div>
            <p>PAGAMENTO DE BOLETO</p>
            <h2 id="titulo-pagar-boleto">Pagar boleto</h2>
            <span>Digite o código ou use a câmera para escanear.</span>
          </div>
          <button type="button" disabled={processando} onClick={fechar} aria-label="Fechar modal">×</button>
        </header>
        {conteudo}
      </section>
    </div>
  )
}
