import { useState } from 'react'
import { useModalAcessivel } from '../../hooks/useModalAcessivel.js'
import CartaoVisual from './CartaoVisual.jsx'
import { formatarLimite, nomeNoCartao, numeroCartao, percentualUtilizado, validadeCartao } from './cartaoUtils.js'

const dias = Array.from({ length: 28 }, (_, i) => i + 1)

export default function ModalCartao({ usuario, dados, fechar }) {
  const { cartao, gerando, erroGeracao, gerarCartao } = dados
  const [vencimento, setVencimento] = useState('10')
  const [fechamento, setFechamento] = useState('3')
  const [mostrarDados, setMostrarDados] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erroCopia, setErroCopia] = useState('')
  const { modalRef, fecharAoClicarFora } = useModalAcessivel(fechar, gerando)
  const numero = numeroCartao(cartao)
  const percentual = percentualUtilizado(cartao?.limite_total, cartao?.limite_utilizado)
  const diasIguais = vencimento === fechamento

  async function criar(evento) {
    evento.preventDefault()
    if (gerando || diasIguais) return
    const resultado = await gerarCartao({ dia_vencimento: Number(vencimento), dia_fechamento: Number(fechamento) })
    if (resultado) { setMostrarDados(false); setMensagem(resultado) }
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

  return <div className="fundo-modal-cartao" role="presentation" onMouseDown={fecharAoClicarFora}>
    <section ref={modalRef} className="modal-cartao" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-cartao" tabIndex={-1} aria-busy={gerando}>
      <header className="modal-cartao-cabecalho"><div><p>CARTÃO ARKHÉ</p><h2 id="titulo-modal-cartao">Seu cartão Arkhé</h2><span>{cartao ? 'Seus dados e limites, em um só lugar.' : 'Feito para acompanhar a sua conta.'}</span></div>
        <button type="button" className="cartao-fechar" aria-label="Fechar cartão" disabled={gerando} onClick={fechar}>×</button>
      </header>
      {mensagem && <p className="cartao-mensagem" role="status">{mensagem}</p>}
      <CartaoVisual nome={nomeNoCartao(usuario)} final={numero.slice(-4)} numero={numero}
        validade={validadeCartao(cartao?.vencimento)} cvv={cartao?.cvv} mostrarDados={mostrarDados} previa={!cartao} />
      {cartao ? <>
        <div className="cartao-acoes-dados">
          <button type="button" className="botao botao-secundario" aria-pressed={mostrarDados} onClick={() => setMostrarDados(!mostrarDados)}>{mostrarDados ? 'Ocultar dados' : 'Mostrar dados'}</button>
          <button type="button" className="botao botao-secundario" onClick={copiar} disabled={!numero}>Copiar número</button>
        </div>
        {erroCopia && <p className="cartao-mensagem erro" role="alert">{erroCopia}</p>}
        <section className="cartao-limite" aria-labelledby="titulo-limite-cartao"><h3 id="titulo-limite-cartao">Limite</h3>
          <dl className="cartao-limites"><div><dt>Limite total</dt><dd>{formatarLimite(cartao.limite_total)}</dd></div><div><dt>Limite utilizado</dt><dd>{formatarLimite(cartao.limite_utilizado)}</dd></div><div><dt>Limite disponível</dt><dd>{formatarLimite(cartao.limite_disponivel)}</dd></div></dl>
          <progress max="100" value={percentual} aria-label="Percentual do limite utilizado" />
          <p>{Math.round(percentual)}% utilizado</p>
        </section>
        <dl className="cartao-datas"><div><dt>Fechamento da fatura</dt><dd>{cartao.dia_fechamento != null ? `Dia ${cartao.dia_fechamento}` : '—'}</dd></div><div><dt>Vencimento da fatura</dt><dd>{cartao.dia_vencimento != null ? `Dia ${cartao.dia_vencimento}` : '—'}</dd></div><div><dt>Validade do cartão</dt><dd>{validadeCartao(cartao.vencimento)}</dd></div></dl>
      </> : <form onSubmit={criar} className="cartao-formulario">
        <p>Cartão vinculado à conta atual, com limite inicial de <strong>R$ 5.000,00</strong> para usar em crédito e débito no ecossistema do projeto.</p>
        <div className="cartao-escolha-dias">
          <div><label htmlFor="vencimento-fatura-cartao">Dia de vencimento da fatura</label><select id="vencimento-fatura-cartao" value={vencimento} disabled={gerando} onChange={(e) => setVencimento(e.target.value)}>{dias.map((dia) => <option key={dia} value={dia}>Dia {dia}</option>)}</select></div>
          <div><label htmlFor="fechamento-fatura-cartao">Dia de fechamento da fatura</label><select id="fechamento-fatura-cartao" value={fechamento} disabled={gerando} onChange={(e) => setFechamento(e.target.value)}>{dias.map((dia) => <option key={dia} value={dia}>Dia {dia}</option>)}</select></div>
        </div>
        {diasIguais && <p className="cartao-mensagem erro" role="alert">Escolha dias diferentes para fechamento e vencimento.</p>}
        {erroGeracao && <p className="cartao-mensagem erro" role="alert">{erroGeracao}</p>}
        <button type="submit" className="botao botao-principal" disabled={gerando || diasIguais}>{gerando ? 'Gerando cartão...' : 'Gerar cartão'}</button>
      </form>}
      <p className="cartao-nota">Cartão próprio do Banco Arkhé para uso no projeto acadêmico.</p>
    </section>
  </div>
}
