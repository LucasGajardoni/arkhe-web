import { useState } from 'react'
import { useModalAcessivel } from '../../hooks/useModalAcessivel.js'
import { pagarCobranca } from '../../services/movimentacoesService.js'
import { formatarDataBrasileira } from '../../utils/formatadores.js'
import AcoesComprovante from '../Comprovante/AcoesComprovante.jsx'
import AcoesBoletoPdf from './AcoesBoletoPdf.jsx'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function somenteData(valor) {
  const data = String(valor || '').trim().slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : ''
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
  idMovimentacao,
}) {
  const [etapa, setEtapa] = useState('detalhes')
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')
  const [resultadoPagamento, setResultadoPagamento] = useState(null)
  const pago = Number(boleto.status) === 1
  const vencimento = somenteData(boleto.data_vencimento)
  const dataPagamento = somenteData(boleto.data_pagamento)
  let textoSituacao = situacao.texto
  if (contaPJ && pago) textoSituacao = 'Pagamento recebido'
  if (contaPJ && !pago && situacao.classe === 'pendente') textoSituacao = 'Pagamento pendente'
  const { modalRef, fecharAoClicarFora } = useModalAcessivel(fechar, processando)

  async function confirmarPagamento() {
    if (processando || contaPJ || pago) return

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
        <AcoesComprovante idMovimentacao={resultadoPagamento?.id_movimentacao} />
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
          <div><dt>Situação</dt><dd>{textoSituacao}</dd></div>
          <div><dt>Conta atual</dt><dd>{descricaoConta(usuario)}</dd></div>
          {boleto.id_cobranca && <div><dt>ID da cobrança</dt><dd>#{boleto.id_cobranca}</dd></div>}
          {boleto.codigo_pagamento && <div><dt>Código de pagamento</dt><dd className="codigo-detalhes-boleto">{boleto.codigo_pagamento}</dd></div>}
          {pago && dataPagamento && <div><dt>{contaPJ ? 'Recebido em' : 'Pago em'}</dt><dd>{formatarDataBrasileira(dataPagamento)}</dd></div>}
        </dl>

        {!boleto.codigo_pagamento && contaPJ && (
          <p className="dado-indisponivel-boleto">Código de pagamento não disponível para esta cobrança.</p>
        )}

        <AcoesBoletoPdf idCobranca={boleto.id_cobranca} />
        {pago && <AcoesComprovante idMovimentacao={idMovimentacao} />}

        {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}

        <footer>
          <button className="botao botao-secundario" type="button" onClick={fechar}>Fechar</button>
          {!contaPJ && !pago && (
            <button className="botao botao-principal" type="button" onClick={() => setEtapa('confirmacao')}>Pagar boleto</button>
          )}
        </footer>
      </div>
    )
  }

  return (
    <div className="fundo-modal-perfil" role="presentation" onMouseDown={fecharAoClicarFora}>
      <section ref={modalRef} className="modal-perfil modal-detalhes-boleto" role="dialog" aria-modal="true" aria-labelledby="titulo-detalhes-boleto" tabIndex="-1">
        <header>
          <div>
            <p>{contaPJ ? 'BOLETO EMITIDO' : 'DDA / BOLETO'}</p>
            <h2 id="titulo-detalhes-boleto">{contaPJ ? 'Detalhes da cobrança' : 'Detalhes do boleto'}</h2>
            {boleto.id_cobranca && <span>Cobrança #{boleto.id_cobranca}</span>}
          </div>
          <button type="button" disabled={processando} onClick={fechar} aria-label="Fechar modal">×</button>
        </header>
        {conteudo}
      </section>
    </div>
  )
}
