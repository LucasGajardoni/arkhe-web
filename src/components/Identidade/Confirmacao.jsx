import { useModalAcessivel } from '../../hooks/useModalAcessivel.js'
import './Identidade.css'

export default function Confirmacao({ titulo, descricao, confirmar, fechar, processando, erro }) {
  const { modalRef, fecharAoClicarFora } = useModalAcessivel(fechar, processando)
  return <div className="fundo-modal-identidade" onMouseDown={fecharAoClicarFora}>
    <section ref={modalRef} className="modal-identidade" role="dialog" aria-modal="true" aria-labelledby="titulo-confirmacao" tabIndex={-1}>
      <h2 id="titulo-confirmacao">{titulo}</h2><p>{descricao}</p>
      {erro && <p role="alert" className="mensagem-identidade erro">{erro}</p>}
      <div className="acoes-identidade">
        <button type="button" className="botao botao-secundario" onClick={fechar} disabled={processando}>Cancelar</button>
        <button type="button" className="botao botao-principal" onClick={confirmar} disabled={processando}>{processando ? 'Aguarde...' : 'Confirmar'}</button>
      </div>
    </section>
  </div>
}
