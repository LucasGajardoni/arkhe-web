import arkheLogo from '../../assets/arkhe-logo.svg'

export default function CartaoVisual({ nome, final = '', numero = '', validade = '—', cvv, mostrarDados = false, compacto = false, previa = false }) {
  const numeroLimpo = String(numero || '').replace(/\s/g, '')
  const numeroExibido = mostrarDados && numeroLimpo
    ? numeroLimpo.replace(/(.{4})(?=.)/g, '$1 ')
    : compacto
      ? `•••• ${final || '••••'}`
      : `•••• •••• •••• ${final || '••••'}`

  return <div className={`cartao-visual${compacto ? ' cartao-visual-compacto' : ''}`} aria-label={`${previa ? 'Prévia do cartão Arkhé para' : 'Cartão Arkhé de'} ${nome}`}>
    <div className="cartao-visual-identidade">
      <img src={arkheLogo} alt="" />
      <div>
        <strong>Arkhé Banco</strong>
        <span className="cartao-visual-titular"><strong>{nome}</strong></span>
      </div>
    </div>

    <div className="cartao-visual-chip" aria-hidden="true">
      <i /><i /><i /><i />
    </div>

    <p className="cartao-visual-numero" aria-label={previa ? 'Prévia do cartão, ainda não gerado' : undefined}>
      {numeroExibido || '—'}
    </p>

    <div className="cartao-visual-rodape">
      <div className="cartao-visual-bank">
        <small>OWN BANK</small>
      </div>
      {!compacto && <div className="cartao-visual-validade"><small>VALID THRU</small><strong>{validade}</strong></div>}
      {!compacto && !previa && <div className="cartao-visual-cvv"><small>CVV</small><strong>{mostrarDados ? cvv ?? '—' : '•••'}</strong></div>}
      <div className="cartao-visual-rede" aria-hidden="true"><i /><i /></div>
    </div>

    <span className="cartao-visual-filete filete-um" aria-hidden="true" />
    <span className="cartao-visual-filete filete-dois" aria-hidden="true" />
  </div>
}
