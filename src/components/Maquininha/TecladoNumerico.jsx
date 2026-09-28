export default function TecladoNumerico({ digitar, apagar, limpar, desabilitado = false }) {
  return <div className="pay-teclado" role="group" aria-label="Teclado numérico">
    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digito) => (
      <button type="button" key={digito} disabled={desabilitado} onClick={() => digitar(digito)}>{digito}</button>
    ))}
    <button type="button" disabled={desabilitado} onClick={apagar} aria-label="Apagar último dígito">
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5h11v14H9l-7-7 7-7Z" /><path d="m12 9 6 6m0-6-6 6" /></svg>
    </button>
    <button type="button" disabled={desabilitado} onClick={() => digitar('0')}>0</button>
    <button type="button" className="pay-tecla-limpar" disabled={desabilitado} onClick={limpar}>Limpar</button>
  </div>
}
