import arkheLogo from '../../assets/arkhe-logo.svg'

export default function CartaoVisual({ nome, final = '', numero = '', validade = '—', cvv, mostrarDados = false, compacto = false, previa = false }) {
  const numeroExibido = mostrarDados
    ? numero.replace(/(.{4})(?=.)/g, '$1 ')
    : compacto ? `•••• ${final || '••••'}` : `•••• •••• •••• ${final || '••••'}`
  return <div className={`cartao-visual${compacto ? ' cartao-visual-compacto' : ''}`} aria-label={`${previa ? 'Prévia do cartão Arkhé para' : 'Cartão Arkhé de'} ${nome}`}>
    <div className="cartao-visual-marca"><span><img src={arkheLogo} alt="" />ARKHÉ</span><small>Crédito e Débito</small></div>
    <div className="cartao-visual-chip" aria-hidden="true"><i /><i /><i /></div>
    <p className="cartao-visual-numero" aria-label={previa ? 'Prévia do cartão, ainda não gerado' : undefined}>{numeroExibido || '—'}</p>
    <div className="cartao-visual-rodape">
      <div className="cartao-visual-titular"><small>{previa ? 'SEU CARTÃO ARKHÉ' : 'TITULAR'}</small><strong>{nome}</strong></div>
      {!compacto && <div><small>VALIDADE</small><strong>{validade}</strong></div>}
      {!compacto && !previa && <div><small>CVV</small><strong>{mostrarDados ? cvv ?? '—' : '•••'}</strong></div>}
    </div>
  </div>
}
