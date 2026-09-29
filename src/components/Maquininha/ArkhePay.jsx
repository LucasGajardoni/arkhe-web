import { useRef, useState } from 'react'
import Icone from '../Dashboard/Icone.jsx'
import ModalPinMaquininha from './ModalPinMaquininha.jsx'
import TecladoNumerico from './TecladoNumerico.jsx'
import { useMaquininha } from './useMaquininha.js'
import './ArkhePay.css'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const titulos = {
  AGUARDANDO_CARTAO: 'Aproxime o cartão',
  CARTAO_LIDO: 'Lendo cartão...',
  AGUARDANDO_PIN: 'Cartão identificado',
  PROCESSANDO: 'Processando pagamento...',
  CANCELANDO: 'Cancelando venda...',
  APROVADO: 'Pagamento aprovado',
  NEGADO: 'Pagamento não aprovado',
  INCERTO: 'Confirme no extrato',
}

export default function ArkhePay({ aoPagamentoAprovado }) {
  const pay = useMaquininha(aoPagamentoAprovado)
  const [digitos, setDigitos] = useState('')
  const [modalidade, setModalidade] = useState('DEBITO')
  const [parcelas, setParcelas] = useState(1)
  const inputRef = useRef(null)
  const centavos = Number(digitos) || 0
  const pronta = pay.etapa === 'PRONTA'
  const concluida = ['APROVADO', 'NEGADO', 'INCERTO'].includes(pay.etapa)
  const carregando = ['CARTAO_LIDO', 'PROCESSANDO', 'CANCELANDO'].includes(pay.etapa)
  const valor = centavos / 100

  function alterar(valorDigitado) {
    const numeros = valorDigitado.replace(/\D/g, '').replace(/^0+/, '')
    if (numeros.length <= 8) setDigitos(numeros)
  }

  function escolherModalidade(tipo) {
    setModalidade(tipo)
    if (tipo === 'DEBITO') setParcelas(1)
  }

  function novaVenda() {
    setDigitos('')
    setModalidade('DEBITO')
    setParcelas(1)
    pay.novaVenda()
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const resumoModalidade = pay.tipo === 'CREDITO'
    ? `Crédito · ${pay.parcelas}x`
    : 'Débito'

  return <section className="bloco-dashboard arkhe-pay" aria-labelledby="pay-titulo">
    <header className="pay-cabecalho">
      <div className="titulo-bloco-dashboard"><div><p>ARKHÉ PAY</p><h2 id="pay-titulo">Venda presencial</h2></div></div>
      <div className="pay-conexao">
        <span className={`pay-status${pay.conectada ? ' conectado' : ''}`} role="status"><i aria-hidden="true" />Maquininha {pay.conectada ? 'conectada' : 'desconectada'}</span>
        {pay.suportada && <button type="button" className="pay-botao-conexao" disabled={pay.conectando || !pronta}
          onClick={pay.conectada ? pay.desconectar : pay.conectar}>
          <Icone nome="cartao" tamanho={16} />{pay.conectando ? 'Aguarde...' : pay.conectada ? 'Desconectar' : 'Conectar maquininha'}
        </button>}
      </div>
    </header>

    {!pay.suportada && <div className="pay-aviso" role="status"><strong>Este navegador não oferece suporte à conexão USB da maquininha.</strong><span>Use uma versão atual do Chrome ou Edge no computador.</span></div>}
    {pay.aviso && <p className="pay-aviso" role="alert">{pay.aviso}</p>}

    {pronta ? <div className="pay-conteudo">
      <div className="pay-venda">
        <label htmlFor="pay-valor" className="pay-rotulo">VALOR DA VENDA</label>
        <input ref={inputRef} id="pay-valor" className="pay-valor" type="text" inputMode="numeric" autoComplete="off"
          aria-describedby="pay-ajuda-valor" value={moeda.format(valor)}
          onChange={(evento) => { if (/^[\dR$\s.,]*$/.test(evento.target.value)) alterar(evento.target.value) }}
          onFocus={(evento) => evento.target.select()} />
        <p id="pay-ajuda-valor" className="pay-ajuda">Digite o valor em centavos ou use o teclado numérico.</p>

        <div className="pay-modalidades" role="group" aria-label="Modalidade de pagamento">
          <button type="button" className={modalidade === 'DEBITO' ? 'ativo' : ''} aria-pressed={modalidade === 'DEBITO'} onClick={() => escolherModalidade('DEBITO')}>
            <span><Icone nome="cartao" tamanho={21} /></span><div><strong>Débito</strong><small>Pagamento à vista</small></div>
          </button>
          <button type="button" className={modalidade === 'CREDITO' ? 'ativo' : ''} aria-pressed={modalidade === 'CREDITO'} onClick={() => escolherModalidade('CREDITO')}>
            <span><Icone nome="cartao" tamanho={21} /></span><div><strong>Crédito</strong><small>Use o limite do cartão</small></div>
          </button>
        </div>

        {modalidade === 'CREDITO' && <div className="pay-parcelamento">
          <label htmlFor="pay-parcelas">Parcelamento</label>
          <select id="pay-parcelas" value={parcelas} onChange={(evento) => setParcelas(Number(evento.target.value))}>
            {Array.from({ length: 15 }, (_, indice) => indice + 1).map((qtd) =>
              <option key={qtd} value={qtd}>{qtd}x de {moeda.format(valor / qtd)}</option>)}
          </select>
          <small>O valor será lançado no crédito e não será descontado do saldo da conta no momento da compra.</small>
        </div>}

        <button className="botao botao-principal pay-cobrar" type="button" disabled={!pay.conectada || pay.conectando || centavos <= 0}
          onClick={() => pay.cobrar(centavos, modalidade, modalidade === 'CREDITO' ? parcelas : 1)}>
          Cobrar {moeda.format(valor)}<Icone nome="seta" tamanho={17} />
        </button>
        <p className="pay-nota"><Icone nome="escudo" tamanho={14} />{pay.conectada ? 'Tudo pronto para sua próxima venda.' : 'Conecte sua maquininha para começar a vender.'}</p>
      </div>
      <div className="pay-teclado-area"><TecladoNumerico digitar={(digito) => alterar(digitos + digito)} apagar={() => alterar(digitos.slice(0, -1))} limpar={() => setDigitos('')} /><p>Simples para vender. Seguro para receber.</p></div>
    </div> : <div className={`pay-resultado ${pay.etapa.toLowerCase()}`}>
      <div aria-live="polite" aria-atomic="true">
        <span className={`pay-emblema${carregando ? ' carregando' : ''}${pay.etapa === 'AGUARDANDO_CARTAO' ? ' pulsando' : ''}`}>
          <Icone nome={pay.etapa === 'APROVADO' ? 'conferir' : ['NEGADO', 'INCERTO'].includes(pay.etapa) ? 'extrato' : 'cartao'} tamanho={32} />
        </span>
        <p className="pay-rotulo">{pay.etapa === 'APROVADO' ? 'VENDA CONCLUÍDA' : 'SUA VENDA'}</p>
        <h3>{titulos[pay.etapa]}</h3>
        <strong className="pay-total">{moeda.format(pay.valor)}</strong>
        <span className="pay-debito">{resumoModalidade}</span>
        {pay.etapa === 'AGUARDANDO_CARTAO' && <p>Aproxime o cartão na maquininha.</p>}
        {pay.etapa === 'PROCESSANDO' && <p>Aguarde a confirmação do pagamento.</p>}
        {pay.cartao && <p className="pay-cliente">{pay.cartao.nome}<span>Cartão final {pay.cartao.final || '••••'}</span></p>}
        {pay.mensagem && <p className="pay-mensagem">{pay.mensagem}</p>}
      </div>
      {concluida ? <button className="botao botao-principal" type="button" onClick={novaVenda}>Nova venda<Icone nome="seta" tamanho={17} /></button>
        : <button className="pay-botao-texto" type="button" disabled={pay.etapa === 'PROCESSANDO' || pay.etapa === 'CANCELANDO'} onClick={pay.cancelar}>Cancelar</button>}
    </div>}
    {pay.etapa === 'AGUARDANDO_PIN' && <ModalPinMaquininha cartao={pay.cartao} valor={pay.valor} tipo={pay.tipo} parcelas={pay.parcelas} confirmar={pay.confirmar} cancelar={pay.cancelar} />}
  </section>
}
