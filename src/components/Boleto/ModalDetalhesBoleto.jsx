import { useState } from 'react'
import { useModalAcessivel } from '../../hooks/useModalAcessivel.js'
import FormAgendamento from '../Agendamentos/FormAgendamento.jsx'
import { criarAgendamento } from '../../services/agendamentosService.js'
import { cancelarCobranca, pagarCobranca } from '../../services/movimentacoesService.js'
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
  const [idAgendamento, setIdAgendamento] = useState(null)
  const [motivoCancelamento, setMotivoCancelamento] = useState('')
  const pago = Number(boleto.status) === 1
  const cancelado = Number(boleto.status) === 2
  const vencimento = somenteData(boleto.data_vencimento)
  const dataPagamento = somenteData(boleto.data_pagamento)
  let textoSituacao = situacao.texto
  if (contaPJ && pago && boleto.status_operacao !== 'ESTORNADO') textoSituacao = 'Pagamento recebido'
  if (boleto.status_operacao === 'ESTORNADO') textoSituacao = 'Estornado'
  if (contaPJ && !pago && situacao.classe === 'pendente') textoSituacao = 'Pagamento pendente'
  const { modalRef, fecharAoClicarFora } = useModalAcessivel(fechar, processando)

  async function confirmarPagamento() {
    if (processando || contaPJ || pago || cancelado) return

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

  async function confirmarCancelamento() {
    if (processando || !boleto.pode_cancelar) return
    setProcessando(true)
    setErro('')
    try {
      await cancelarCobranca(boleto.id_cobranca, motivoCancelamento)
      setEtapa('cancelado')
      await atualizar()
    } catch (falha) {
      setErro(falha.message || 'Não foi possível cancelar a cobrança.')
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarAgendamento(dataAgendada) {
    if (processando || contaPJ || pago || cancelado) return
    setProcessando(true)
    setErro('')
    try {
      const resposta = await criarAgendamento({
        tipo_operacao: 'BOLETO',
        id_cobranca: boleto.id_cobranca,
        valor: Number(boleto.valor),
        data_agendada: dataAgendada,
      })
      setIdAgendamento(resposta.id_agendamento)
      setEtapa('agendado')
      await atualizar()
    } catch (falha) {
      setErro(falha.message || 'Não foi possível criar o agendamento.')
    } finally {
      setProcessando(false)
    }
  }

  let conteudo

  if (etapa === 'cancelar') {
    conteudo = (
      <div className="conteudo-detalhes-boleto confirmacao-baixa-boleto">
        <span>!</span>
        <h3>Cancelar esta cobrança?</h3>
        <p>A cobrança deixará de aceitar pagamentos. Esta ação não movimenta saldo.</p>
        <label className="motivo-estorno-boleto">Motivo do cancelamento
          <textarea value={motivoCancelamento} onChange={(evento) => setMotivoCancelamento(evento.target.value)} maxLength={500} minLength={5} required placeholder="Explique brevemente o motivo." />
        </label>
        {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}
        <footer>
          <button className="botao botao-secundario" type="button" disabled={processando} onClick={() => { setErro(''); setEtapa('detalhes') }}>Voltar</button>
          <button className="botao botao-principal" type="button" disabled={processando || motivoCancelamento.trim().length < 5} onClick={confirmarCancelamento}>
            {processando ? 'Cancelando…' : 'Confirmar cancelamento'}
          </button>
        </footer>
      </div>
    )
  } else if (etapa === 'cancelado') {
    conteudo = (
      <div className="sucesso-baixa-boleto" role="status">
        <span>✓</span>
        <h3>Cobrança cancelada</h3>
        <strong>{moeda.format(Number(boleto.valor) || 0)}</strong>
        <p>Nenhum saldo foi movimentado. A cobrança foi preservada no histórico como cancelada.</p>
        <button className="botao botao-principal" type="button" onClick={fechar}>Concluir</button>
      </div>
    )
  } else if (etapa === 'confirmacao') {
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
  } else if (etapa === 'agendamento') {
    conteudo = (
      <FormAgendamento
        tipo="Pagamento de boleto"
        valor={Number(boleto.valor) || 0}
        destinatario={nomeRelacionado}
        erro={erro}
        processando={processando}
        aoVoltar={() => { setErro(''); setEtapa('detalhes') }}
        aoConfirmar={confirmarAgendamento}
      />
    )
  } else if (etapa === 'agendado') {
    conteudo = (
      <div className="sucesso-pagamento-codigo" role="status">
        <span>✓</span>
        <h3>Agendamento salvo</h3>
        <strong>{moeda.format(Number(boleto.valor) || 0)}</strong>
        <p>{nomeRelacionado}</p>
        <small>O saldo não foi movimentado. A execução revalidará saldo, permissões e limites.</small>
        {idAgendamento && <small>Agendamento #{idAgendamento}</small>}
        <button className="botao botao-principal" type="button" onClick={fechar}>Concluir</button>
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
          {boleto.status_operacao === 'CANCELADO' ? 'Cancelado' : textoSituacao}
        </p>

        <dl>
          <div><dt>{contaPJ ? 'Pagador' : 'Recebedor'}</dt><dd>{nomeRelacionado}</dd></div>
          <div><dt>Valor</dt><dd>{moeda.format(Number(boleto.valor) || 0)}</dd></div>
          <div><dt>Vencimento</dt><dd>{vencimento ? formatarDataBrasileira(vencimento) : 'Não informado'}</dd></div>
          <div><dt>Situação</dt><dd>{boleto.status_operacao === 'CANCELADO' ? 'Cancelado' : textoSituacao}</dd></div>
          <div><dt>Conta atual</dt><dd>{descricaoConta(usuario)}</dd></div>
          {boleto.id_cobranca && <div><dt>ID da cobrança</dt><dd>#{boleto.id_cobranca}</dd></div>}
          {boleto.estorno && <div><dt>Movimentação inversa</dt><dd>#{boleto.estorno.id_movimentacao_reversa}{boleto.estorno.id_estorno ? ` · estorno #${boleto.estorno.id_estorno}` : ''}</dd></div>}
          {boleto.estorno?.motivo && <div><dt>Motivo do estorno</dt><dd>{boleto.estorno.motivo}</dd></div>}
          {boleto.cancelamento?.motivo && <div><dt>Motivo do cancelamento</dt><dd>{boleto.cancelamento.motivo}</dd></div>}
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
          {!contaPJ && !pago && !cancelado && (
            <button className="botao botao-secundario" type="button" onClick={() => setEtapa('agendamento')}>Agendar para depois</button>
          )}
          {!contaPJ && !pago && !cancelado && (
            <button className="botao botao-principal" type="button" onClick={() => setEtapa('confirmacao')}>Pagar boleto</button>
          )}
          {boleto.pode_cancelar && !pago && Number(boleto.status) === 0 && (
            <button className="botao botao-secundario" type="button" onClick={() => setEtapa('cancelar')}>Cancelar cobrança</button>
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
