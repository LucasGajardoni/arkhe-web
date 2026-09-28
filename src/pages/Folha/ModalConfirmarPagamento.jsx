import { useModalAcessivel } from '../../hooks/useModalAcessivel.js'
import { competencia, moeda } from './folhaUtils.js'

export default function ModalConfirmarPagamento({ folha, fechar, confirmar, processando, bloqueado, erro }) {
  const { modalRef, fecharAoClicarFora } = useModalAcessivel(fechar, processando)
  return <div className="fundo-modal-identidade" onMouseDown={fecharAoClicarFora}>
    <section ref={modalRef} className="modal-identidade modal-folha" role="dialog" aria-modal="true" aria-labelledby="titulo-pagamento-folha" tabIndex={-1} aria-busy={processando}>
      <p className="rotulo-secao">PAGAMENTO DA EMPRESA</p>
      <h2 id="titulo-pagamento-folha">Confirmar pagamento da folha?</h2>
      <p>Confira os valores antes de confirmar o débito na conta da empresa.</p>
      <dl className="folha-confirmacao-resumo">
        <div><dt>Competência</dt><dd>{competencia(folha)}</dd></div>
        <div><dt>Funcionários a pagar</dt><dd>{folha.quantidade_validos}</dd></div>
        <div><dt>Total</dt><dd>{moeda.format(folha.total_valido)}</dd></div>
      </dl>
      <p>Somente os funcionários prontos para pagamento serão pagos.</p>
      {erro && <p role="alert" className="mensagem-identidade erro">{erro}</p>}
      {processando && <p role="status">Processando pagamentos...</p>}
      <div className="acoes-identidade">
        <button type="button" className="botao botao-secundario" disabled={processando} onClick={fechar}>Cancelar</button>
        <button type="button" className="botao botao-principal" disabled={processando || bloqueado} onClick={confirmar}>{processando ? 'Processando pagamentos...' : 'Confirmar pagamento'}</button>
      </div>
    </section>
  </div>
}
