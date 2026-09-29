import { useRef, useState } from 'react'
import { useModalAcessivel } from '../../hooks/useModalAcessivel.js'
import Icone from '../Dashboard/Icone.jsx'
import TecladoNumerico from './TecladoNumerico.jsx'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export default function ModalPinMaquininha({ cartao, valor, tipo = 'DEBITO', parcelas = 1, confirmar, cancelar }) {
  const [pin, setPin] = useState('')
  const enviado = useRef(false)
  const { modalRef, fecharAoClicarFora } = useModalAcessivel(fechar)

  function fechar() {
    if (enviado.current) return
    setPin('')
    cancelar()
  }

  function enviar(evento) {
    evento?.preventDefault()
    if (enviado.current || !/^\d{6}$/.test(pin)) return
    enviado.current = true
    const tentativa = pin
    setPin('')
    confirmar(tentativa)
  }

  function tecla(evento) {
    if (evento.target.tagName === 'INPUT' || evento.ctrlKey || evento.metaKey || evento.altKey) return
    if (/^\d$/.test(evento.key)) {
      evento.preventDefault()
      setPin((anterior) => (anterior + evento.key).slice(0, 6))
    } else if (evento.key === 'Backspace') {
      evento.preventDefault()
      setPin((anterior) => anterior.slice(0, -1))
    } else if (evento.key === 'Enter' && evento.target === evento.currentTarget) enviar(evento)
  }

  return <div className="pay-modal-fundo" onMouseDown={fecharAoClicarFora}>
    <section className="pay-modal" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="pay-pin-titulo" aria-describedby="pay-pin-descricao" tabIndex={-1} onKeyDown={tecla}>
      <span className="pay-emblema"><Icone nome="escudo" tamanho={26} /></span>
      <p className="pay-rotulo">ARKHÉ PAY</p>
      <h2 id="pay-pin-titulo">Digite o PIN</h2>
      <p id="pay-pin-descricao">Insira o PIN de 6 dígitos do cartão.</p>
      <div className="pay-pin-resumo"><strong>{moeda.format(valor)} <small>· {tipo === 'CREDITO' ? `Crédito ${parcelas}x` : 'Débito'}</small></strong><span>{cartao.nome}</span><span>Cartão final {cartao.final || '••••'}</span></div>
      <form onSubmit={enviar} autoComplete="off">
        <label className="pay-pin-campo">
          <span className="pay-somente-leitor">PIN de 6 dígitos</span>
          <input type="password" inputMode="numeric" autoComplete="off" maxLength={6} value={pin}
            onChange={(evento) => setPin(evento.target.value.replace(/\D/g, '').slice(0, 6))} />
          <span className="pay-pin-indicadores" aria-hidden="true">{Array.from({ length: 6 }, (_, indice) => <i key={indice} className={indice < pin.length ? 'preenchido' : ''} />)}</span>
        </label>
        <TecladoNumerico digitar={(digito) => setPin((anterior) => (anterior + digito).slice(0, 6))} apagar={() => setPin((anterior) => anterior.slice(0, -1))} limpar={() => setPin('')} />
        <button type="submit" className="botao botao-principal pay-confirmar" disabled={pin.length !== 6}>Confirmar pagamento</button>
        <button type="button" className="pay-botao-texto" onClick={fechar}>Cancelar</button>
      </form>
      <p className="pay-nota"><Icone nome="escudo" tamanho={14} /> Seu PIN é usado apenas para autorizar esta compra.</p>
    </section>
  </div>
}
