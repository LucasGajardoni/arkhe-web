import { useEffect, useMemo, useState } from 'react'
import { useModalAcessivel } from '../../hooks/useModalAcessivel.js'
import CartaoVisual from './CartaoVisual.jsx'
import { formatarLimite, nomeNoCartao, numeroCartao, percentualUtilizado, validadeCartao } from './cartaoUtils.js'

const diasFechamento = [10, 20]
const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function formatarData(valor) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(valor || ''))
  return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : '—'
}

function mesFatura(valor) {
  const partes = /^(\d{4})-(\d{2})/.exec(String(valor || ''))
  if (!partes) return 'Fatura'
  return `${meses[Number(partes[2]) - 1]} ${partes[1]}`
}

function statusParcela(status) {
  if (Number(status) === 1) return ['Paga', 'paga']
  if (Number(status) === 0) return ['Pendente', 'pendente']
  return ['Em análise', 'neutro']
}

function statusFatura(situacao) {
  if (situacao === 'PAGA') return ['Paga', 'paga']
  if (situacao === 'VENCIDA') return ['Vencida', 'vencida']
  if (situacao === 'PREVISTA') return ['Prevista', 'prevista']
  return ['Fechada', 'fechada']
}

function ItemFatura({ item }) {
  return <div className="cartao-fatura-item">
    <div><strong>Compra #{item.id_compra}</strong><small>{formatarData(item.data_compra)} · Parcela {item.numero_parcela}/{item.total_parcelas}</small></div>
    <b>{formatarLimite(item.valor)}</b>
  </div>
}

function FaturaCard({ fatura, prevista = false, aberta = false }) {
  const [rotulo, classe] = statusFatura(prevista ? 'PREVISTA' : fatura.situacao)
  return <details className="cartao-fatura-card" open={aberta}>
    <summary>
      <div className="cartao-fatura-identidade">
        <span className={`cartao-status-fatura ${classe}`}>{rotulo}</span>
        <div><strong>{mesFatura(fatura.data_fechamento)}</strong><small>{prevista ? `Fecha em ${formatarData(fatura.data_fechamento)}` : `Fechada em ${formatarData(fatura.data_fechamento)}`}</small></div>
      </div>
      <div className="cartao-fatura-total"><strong>{formatarLimite(fatura.valor_total)}</strong><small>Vence {formatarData(fatura.data_vencimento)}</small></div>
    </summary>
    <div className="cartao-fatura-itens">
      {(fatura.itens || []).length > 0
        ? fatura.itens.map((item) => <ItemFatura key={item.id_fatura_compra} item={item} />)
        : <p>Nenhum lançamento nesta fatura.</p>}
    </div>
  </details>
}

export default function ModalCartao({ usuario, dados, fechar }) {
  const {
    cartao, gerando, erroGeracao, gerarCartao,
    alterandoBloqueio, erroBloqueio, alternarBloqueioCartao,
    comprasCartao, carregandoCompras, erroCompras, carregarComprasCartao,
    faturasCartao, carregandoFaturas, erroFaturas, carregarFaturasCartao,
  } = dados
  const [fechamento, setFechamento] = useState('10')
  const [mostrarDados, setMostrarDados] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erroCopia, setErroCopia] = useState('')
  const [aba, setAba] = useState('resumo')
  const [tentouCarregarCredito, setTentouCarregarCredito] = useState(false)
  const { modalRef, fecharAoClicarFora } = useModalAcessivel(fechar, gerando)
  const numero = numeroCartao(cartao)
  const bloqueado = Number(cartao?.status) === 1
  const percentual = percentualUtilizado(cartao?.limite_total, cartao?.limite_utilizado)
  const vencimento = Number(fechamento) + 3
  const compras = comprasCartao?.compras || []
  const parcelas = comprasCartao?.parcelas || []
  const resumoCredito = comprasCartao?.resumo || {}
  const faturas = faturasCartao?.faturas || []
  const proximasFaturas = faturasCartao?.proximas_faturas || []
  const faturaAtual = faturasCartao?.fatura_atual || null
  const proximaFatura = faturasCartao?.proxima_fatura || null
  const parcelasOrdenadas = useMemo(() => [...parcelas].sort((a, b) => {
    const pendenteA = Number(a.status) === 0 ? 0 : 1
    const pendenteB = Number(b.status) === 0 ? 0 : 1
    if (pendenteA !== pendenteB) return pendenteA - pendenteB
    return String(a.data_parcela || '').localeCompare(String(b.data_parcela || ''))
  }), [parcelas])

  useEffect(() => {
    if (!cartao || tentouCarregarCredito) return
    setTentouCarregarCredito(true)
    void (async () => {
      await carregarFaturasCartao({ forcar: true })
      await carregarComprasCartao({ forcar: true })
    })()
  }, [cartao, tentouCarregarCredito, carregarFaturasCartao, carregarComprasCartao])

  async function atualizarCredito() {
    await carregarFaturasCartao({ forcar: true })
    await carregarComprasCartao({ forcar: true })
  }

  async function criar(evento) {
    evento.preventDefault()
    if (gerando) return
    const resultado = await gerarCartao({ dia_vencimento: vencimento, dia_fechamento: Number(fechamento) })
    if (resultado) { setMostrarDados(false); setMensagem(resultado) }
  }

  async function alterarBloqueio() {
    if (alterandoBloqueio) return
    setMensagem('')
    const resultado = await alternarBloqueioCartao()
    if (resultado) setMensagem(resultado)
  }

  async function copiar() {
    setErroCopia('')
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Cópia indisponível')
      await navigator.clipboard.writeText(numero)
      setMensagem('Número do cartão copiado.')
    } catch {
      setErroCopia('Não foi possível copiar. Use “Mostrar dados” para consultar o número.')
    }
  }

  function conteudoCreditoVazio(titulo, texto) {
    return <div className="cartao-credito-vazio"><span aria-hidden="true">✓</span><h4>{titulo}</h4><p>{texto}</p></div>
  }

  const carregandoCredito = carregandoCompras || carregandoFaturas

  return <div className="fundo-modal-cartao" role="presentation" onMouseDown={fecharAoClicarFora}>
    <section ref={modalRef} className="modal-cartao" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-cartao" tabIndex={-1} aria-busy={gerando}>
      <header className="modal-cartao-cabecalho"><div><p>CARTÃO ARKHÉ</p><h2 id="titulo-modal-cartao">Seu cartão Arkhé</h2><span>{cartao ? 'Cartão, faturas, compras e parcelas em um só lugar.' : 'Feito para acompanhar a sua conta.'}</span></div>
        <button type="button" className="cartao-fechar" aria-label="Fechar cartão" disabled={gerando} onClick={fechar}>×</button>
      </header>
      {mensagem && <p className="cartao-mensagem" role="status">{mensagem}</p>}
      <CartaoVisual nome={nomeNoCartao(usuario)} final={numero.slice(-4)} numero={numero}
        validade={validadeCartao(cartao?.vencimento)} cvv={cartao?.cvv} mostrarDados={mostrarDados} previa={!cartao} />
      {cartao ? <>
        <div className="cartao-acoes-dados">
          <button type="button" className="botao botao-secundario" aria-pressed={mostrarDados} onClick={() => setMostrarDados(!mostrarDados)}>{mostrarDados ? 'Ocultar dados' : 'Mostrar dados'}</button>
          <button type="button" className="botao botao-secundario" onClick={copiar} disabled={!numero}>Copiar número</button>
          <button type="button" className="botao botao-secundario" aria-pressed={bloqueado} onClick={alterarBloqueio} disabled={alterandoBloqueio}>{alterandoBloqueio ? 'Alterando...' : bloqueado ? 'Desbloquear cartão' : 'Bloquear cartão'}</button>
        </div>
        {bloqueado && <p className="cartao-mensagem erro" role="status">
          {cartao.motivo_bloqueio === 'PIN'
            ? 'Cartão bloqueado após 3 tentativas de PIN incorretas. Desbloqueie para voltar a comprar.'
            : 'Cartão bloqueado. Novas compras serão recusadas até você desbloquear.'}
        </p>}
        {erroCopia && <p className="cartao-mensagem erro" role="alert">{erroCopia}</p>}
        {erroBloqueio && <p className="cartao-mensagem erro" role="alert">{erroBloqueio}</p>}

        <nav className="cartao-abas" aria-label="Informações do cartão">
          <button type="button" aria-pressed={aba === 'resumo'} onClick={() => setAba('resumo')}>Resumo</button>
          <button type="button" aria-pressed={aba === 'faturas'} onClick={() => setAba('faturas')}>Faturas <span>{faturas.length}</span></button>
          <button type="button" aria-pressed={aba === 'compras'} onClick={() => setAba('compras')}>Compras <span>{compras.length}</span></button>
          <button type="button" aria-pressed={aba === 'parcelas'} onClick={() => setAba('parcelas')}>Parcelas <span>{Number(resumoCredito.parcelas_pendentes || 0)}</span></button>
        </nav>

        {aba === 'resumo' && <div className="cartao-aba-conteudo">
          <section className="cartao-limite" aria-labelledby="titulo-limite-cartao"><h3 id="titulo-limite-cartao">Limite</h3>
            <dl className="cartao-limites"><div><dt>Limite total</dt><dd>{formatarLimite(cartao.limite_total)}</dd></div><div><dt>Limite utilizado</dt><dd>{formatarLimite(cartao.limite_utilizado)}</dd></div><div><dt>Limite disponível</dt><dd>{formatarLimite(cartao.limite_disponivel)}</dd></div></dl>
            <progress max="100" value={percentual} aria-label="Percentual do limite utilizado" />
            <p>{Math.round(percentual)}% utilizado</p>
          </section>

          {(faturaAtual || proximaFatura) && <section className="cartao-fatura-destaque">
            <div><p>{faturaAtual ? 'FATURA FECHADA' : 'PRÓXIMA FATURA'}</p><h3>{mesFatura((faturaAtual || proximaFatura).data_fechamento)}</h3>
              <span>{faturaAtual ? `Vence em ${formatarData(faturaAtual.data_vencimento)}` : `Fecha em ${formatarData(proximaFatura.data_fechamento)}`}</span></div>
            <div><strong>{formatarLimite((faturaAtual || proximaFatura).valor_total)}</strong><button type="button" onClick={() => setAba('faturas')}>Ver fatura →</button></div>
          </section>}

          <section className="cartao-credito-resumo" aria-labelledby="titulo-credito-cartao">
            <div className="cartao-secao-cabecalho"><div><p>CRÉDITO</p><h3 id="titulo-credito-cartao">Compras parceladas</h3></div>
              {compras.length > 0 && <button type="button" onClick={() => setAba('compras')}>Ver detalhes →</button>}</div>
            {carregandoCredito && compras.length === 0 ? <p className="cartao-credito-carregando" role="status">Carregando seus dados de crédito...</p>
              : erroCompras ? <div className="cartao-credito-erro" role="alert"><span>{erroCompras}</span><button type="button" onClick={atualizarCredito}>Tentar novamente</button></div>
                : compras.length === 0 ? conteudoCreditoVazio('Nenhuma compra no crédito ainda', 'Quando você parcelar uma compra no Arkhé Pay, ela aparecerá aqui com todas as parcelas.')
                  : <><dl className="cartao-credito-numeros">
                    <div><dt>Crédito comprometido</dt><dd>{formatarLimite(resumoCredito.valor_pendente)}</dd></div>
                    <div><dt>Parcelas pendentes</dt><dd>{Number(resumoCredito.parcelas_pendentes || 0)}</dd></div>
                    <div><dt>Compras no crédito</dt><dd>{Number(resumoCredito.compras_credito || compras.length)}</dd></div>
                  </dl>
                  {resumoCredito.proxima_parcela && <div className="cartao-proxima-parcela"><div><span>PRÓXIMA PARCELA</span><strong>Parcela {resumoCredito.proxima_parcela.numero}/{resumoCredito.proxima_parcela.total_parcelas}</strong><small>{resumoCredito.proxima_parcela.id_fatura ? `Vencimento ${formatarData(resumoCredito.proxima_parcela.data_vencimento)}` : `Prevista para ${formatarData(resumoCredito.proxima_parcela.data_parcela)}`}</small></div><b>{formatarLimite(resumoCredito.proxima_parcela.valor)}</b></div>}</>}
          </section>

          <dl className="cartao-datas"><div><dt>Fechamento da fatura</dt><dd>{cartao.dia_fechamento != null ? `Dia ${cartao.dia_fechamento}` : '—'}</dd></div><div><dt>Vencimento da fatura</dt><dd>{cartao.dia_vencimento != null ? `Dia ${cartao.dia_vencimento}` : '—'}</dd></div><div><dt>Validade do cartão</dt><dd>{validadeCartao(cartao.vencimento)}</dd></div></dl>
        </div>}

        {aba === 'faturas' && <section className="cartao-aba-conteudo cartao-faturas" aria-labelledby="titulo-faturas-cartao">
          <div className="cartao-secao-cabecalho"><div><p>FATURAMENTO</p><h3 id="titulo-faturas-cartao">Suas faturas</h3></div><button type="button" disabled={carregandoCredito} onClick={atualizarCredito}>{carregandoCredito ? 'Atualizando...' : 'Atualizar'}</button></div>
          {erroFaturas ? <div className="cartao-credito-erro" role="alert"><span>{erroFaturas}</span><button type="button" onClick={atualizarCredito}>Tentar novamente</button></div>
            : carregandoFaturas && faturas.length === 0 && proximasFaturas.length === 0 ? <p className="cartao-credito-carregando" role="status">Organizando suas faturas...</p>
              : <>
                {faturaAtual && <div className="cartao-fatura-hero">
                  <div><span>FATURA MAIS RECENTE</span><h4>{mesFatura(faturaAtual.data_fechamento)}</h4><small>Fechou {formatarData(faturaAtual.data_fechamento)} · vence {formatarData(faturaAtual.data_vencimento)}</small></div>
                  <div><strong>{formatarLimite(faturaAtual.valor_total)}</strong><span className={`cartao-status-fatura ${statusFatura(faturaAtual.situacao)[1]}`}>{statusFatura(faturaAtual.situacao)[0]}</span></div>
                </div>}

                {faturas.length > 0 ? <div className="cartao-faturas-grupo"><div className="cartao-faturas-titulo"><h4>Faturas fechadas</h4><span>{faturas.length} {faturas.length === 1 ? 'fatura' : 'faturas'}</span></div>
                  <div className="cartao-faturas-lista">{faturas.map((fatura, indice) => <FaturaCard key={fatura.id_fatura} fatura={fatura} aberta={indice === 0} />)}</div></div>
                  : conteudoCreditoVazio('Nenhuma fatura fechada ainda', 'Assim que chegar o dia de fechamento, as parcelas daquele ciclo serão reunidas em uma fatura.')}

                {proximasFaturas.length > 0 && <div className="cartao-faturas-grupo futuras"><div className="cartao-faturas-titulo"><h4>Próximas faturas</h4><span>Previsão das parcelas futuras</span></div>
                  <div className="cartao-faturas-lista">{proximasFaturas.map((fatura, indice) => <FaturaCard key={fatura.data_fechamento} fatura={fatura} prevista aberta={faturas.length === 0 && indice === 0} />)}</div></div>}
              </>}
        </section>}

        {aba === 'compras' && <section className="cartao-aba-conteudo cartao-historico" aria-labelledby="titulo-compras-credito">
          <div className="cartao-secao-cabecalho"><div><p>HISTÓRICO</p><h3 id="titulo-compras-credito">Compras no crédito</h3></div><button type="button" disabled={carregandoCredito} onClick={atualizarCredito}>{carregandoCredito ? 'Atualizando...' : 'Atualizar'}</button></div>
          {erroCompras ? <div className="cartao-credito-erro" role="alert"><span>{erroCompras}</span><button type="button" onClick={atualizarCredito}>Tentar novamente</button></div>
            : carregandoCompras && compras.length === 0 ? <p className="cartao-credito-carregando" role="status">Carregando compras...</p>
              : compras.length === 0 ? conteudoCreditoVazio('Nenhuma compra encontrada', 'As compras realizadas no crédito serão organizadas aqui.')
                : <div className="cartao-compras-lista">{compras.map((compra) => {
                  const pagas = compra.parcelas.filter((parcela) => Number(parcela.status) === 1).length
                  return <article className="cartao-compra-item" key={compra.id_compra}>
                    <div className="cartao-compra-principal"><div><span>{formatarData(compra.data_compra)}</span><strong>Compra no crédito</strong><small>{compra.qtd_parcelas}x de {formatarLimite(compra.valor_parcela)}</small></div><b>{formatarLimite(compra.valor_total)}</b></div>
                    <div className="cartao-compra-rodape"><span>{pagas} de {compra.qtd_parcelas} parcelas pagas</span><button type="button" onClick={() => setAba('parcelas')}>Ver parcelas →</button></div>
                  </article>
                })}</div>}
        </section>}

        {aba === 'parcelas' && <section className="cartao-aba-conteudo cartao-historico" aria-labelledby="titulo-parcelas-credito">
          <div className="cartao-secao-cabecalho"><div><p>PARCELAMENTO</p><h3 id="titulo-parcelas-credito">Todas as parcelas</h3></div><button type="button" disabled={carregandoCredito} onClick={atualizarCredito}>{carregandoCredito ? 'Atualizando...' : 'Atualizar'}</button></div>
          {erroCompras ? <div className="cartao-credito-erro" role="alert"><span>{erroCompras}</span><button type="button" onClick={atualizarCredito}>Tentar novamente</button></div>
            : parcelasOrdenadas.length === 0 ? conteudoCreditoVazio('Nenhuma parcela encontrada', 'Quando uma compra for feita no crédito, as parcelas aparecerão aqui.')
              : <div className="cartao-parcelas-lista">{parcelasOrdenadas.map((parcela) => {
                const [rotulo, classe] = statusParcela(parcela.status)
                return <article className="cartao-parcela-item" key={parcela.id_fatura_compra}>
                  <div className="cartao-parcela-identidade"><span className={`cartao-status-parcela ${classe}`}>{rotulo}</span><div><strong>Parcela {parcela.numero}/{parcela.total_parcelas}</strong><small>Compra #{parcela.id_compra}</small></div></div>
                  <div className="cartao-parcela-data"><small>{parcela.id_fatura ? 'Vencimento da fatura' : 'Previsão da parcela'}</small><strong>{formatarData(parcela.id_fatura ? parcela.data_vencimento : parcela.data_parcela)}</strong>{parcela.id_fatura && <span>Fatura #{parcela.id_fatura}</span>}</div>
                  <b>{formatarLimite(parcela.valor)}</b>
                </article>
              })}</div>}
        </section>}
      </> : <form onSubmit={criar} className="cartao-formulario">
        <p>Cartão vinculado à conta atual, com limite inicial de <strong>R$ 5.000,00</strong> para usar em crédito e débito no ecossistema do projeto.</p>
        <div className="cartao-escolha-dias">
          <div><label htmlFor="fechamento-fatura-cartao">Dia de fechamento da fatura</label><select id="fechamento-fatura-cartao" value={fechamento} disabled={gerando} onChange={(e) => setFechamento(e.target.value)}>{diasFechamento.map((dia) => <option key={dia} value={dia}>Dia {dia}</option>)}</select></div>
        </div>
        <p className="cartao-nota-regra">Sua fatura fechará no dia {fechamento} e vencerá automaticamente no dia {vencimento}, 3 dias depois.</p>
        {erroGeracao && <p className="cartao-mensagem erro" role="alert">{erroGeracao}</p>}
        <button type="submit" className="botao botao-principal" disabled={gerando}>{gerando ? 'Gerando cartão...' : 'Gerar cartão'}</button>
      </form>}
      <p className="cartao-nota">Cartão próprio do Banco Arkhé para uso no projeto acadêmico.</p>
    </section>
  </div>
}
