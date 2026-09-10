import { useEffect, useState } from 'react'
import { pagarCobranca } from '../../services/movimentacoesService.js'
import { formatarDataBrasileira } from '../../utils/formatadores.js'
import AcoesBoletoPdf from './AcoesBoletoPdf.jsx'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function somenteData(valor) {
  return String(valor || '').slice(0, 10)
}

function descricaoConta(usuario) {
  const partes = [`Conta ${usuario.tipoConta}`]
  if (usuario.agencia) partes.push(`Agência ${usuario.agencia}`)
  if (usuario.numeroConta) partes.push(`Conta ${usuario.numeroConta}`)
  return partes.join(' · ')
}

export default function ModalDetalhesBoleto({
  boleto,
  usuario,
  contaPJ,
  nomeRelacionado,
  situacao,
  fechar,
  atualizar,
  aoEscanear,
}) {
  const [etapa, setEtapa] = useState('detalhes')
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')
  const pago = Number(boleto.status) === 1
  const vencimento = somenteData(boleto.data_vencimento)
  const dataPagamento = somenteData(boleto.data_pagamento)
  let textoSituacao = situacao.texto
  if (contaPJ && pago) textoSituacao = 'Pagamento recebido'
  if (contaPJ && !pago && situacao.classe === 'pendente') textoSituacao = 'Pagamento pendente'

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

  async function confirmarPagamento() {
    if (processando || contaPJ || pago) return

    setProcessando(true)
    setErro('')

    try {
      await pagarCobranca(boleto.id_cobranca)
      await atualizar()
      setEtapa('sucesso')
    } catch (falha) {
      setErro(falha.message || 'Não foi possível pagar o boleto.')
    } finally {
      setProcessando(false)
    }
  }

  let conteudo

  if (etapa === 'confirmacao') {
    conteudo = (
      <div className="conteudo-detalhes-boleto confirmacao-baixa-boleto">
        <span>!</span>
        <h3>Confirmar pagamento?</h3>
        <p>O valor de <strong>{moeda.format(Number(boleto.valor) || 0)}</strong> será debitado da sua conta atual.</p>
        {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}
        <footer>
          <button className="botao botao-secundario" type="button" disabled={processando} onClick={() => { setErro(''); setEtapa('detalhes') }}>Voltar</button>
          <button className="botao botao-principal" type="button" disabled={processando} onClick={confirmarPagamento}>
            {processando ? 'Processando...' : 'Confirmar pagamento'}
          </button>
        </footer>
      </div>
    )
  } else if (etapa === 'sucesso') {
    conteudo = (
      <div className="sucesso-baixa-boleto" role="status">
        <span>✓</span>
        <h3>Boleto pago com sucesso</h3>
        <strong>{moeda.format(Number(boleto.valor) || 0)}</strong>
        <p>A cobrança foi baixada e o saldo da conta foi atualizado.</p>
        <button className="botao botao-principal" type="button" onClick={fechar}>Concluir</button>
      </div>
    )
  } else {
    conteudo = (
      <div className="conteudo-detalhes-boleto">
        <p className={`situacao-detalhes-boleto ${situacao.classe}`}>
          {textoSituacao}
        </p>

        <dl>
          <div><dt>{contaPJ ? 'Pagador' : 'Recebedor'}</dt><dd>{nomeRelacionado}</dd></div>
          <div><dt>Valor</dt><dd>{moeda.format(Number(boleto.valor) || 0)}</dd></div>
          <div><dt>Vencimento</dt><dd>{vencimento ? formatarDataBrasileira(vencimento) : 'Não informado'}</dd></div>
          <div><dt>Situação</dt><dd>{situacao.texto}</dd></div>
          <div><dt>Conta atual</dt><dd>{descricaoConta(usuario)}</dd></div>
          <div><dt>ID da cobrança</dt><dd>#{boleto.id_cobranca}</dd></div>
          {boleto.codigo_pagamento && <div><dt>Código de pagamento</dt><dd className="codigo-detalhes-boleto">{boleto.codigo_pagamento}</dd></div>}
          {pago && dataPagamento && <div><dt>Pagamento recebido em</dt><dd>{formatarDataBrasileira(dataPagamento)}</dd></div>}
        </dl>

        {!boleto.codigo_pagamento && contaPJ && (
          <p className="dado-indisponivel-boleto">Código de pagamento não disponibilizado pelo backend.</p>
        )}

        <AcoesBoletoPdf idCobranca={boleto.id_cobranca} />

        {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}

        <footer>
          <button className="botao botao-secundario" type="button" onClick={fechar}>Fechar</button>
          {!contaPJ && !pago && (
            <button className="botao botao-principal" type="button" onClick={aoEscanear}>Escanear para pagar</button>
          )}
        </footer>
      </div>
    )
  }

  return (
    <div className="fundo-modal-perfil" role="presentation" onMouseDown={fecharAoClicarFora}>
      <section className="modal-perfil modal-detalhes-boleto" role="dialog" aria-modal="true" aria-labelledby="titulo-detalhes-boleto">
        <header>
          <div>
            <p>{contaPJ ? 'BOLETO EMITIDO' : 'DDA / BOLETO'}</p>
            <h2 id="titulo-detalhes-boleto">Detalhes da cobrança</h2>
            <span>Cobrança #{boleto.id_cobranca}</span>
          </div>
          <button type="button" disabled={processando} onClick={fechar} aria-label="Fechar modal">×</button>
        </header>
        {conteudo}
      </section>
    </div>
  )
}
