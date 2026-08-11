import './ModalTipoConta.css'

export default function ModalTipoConta({ fechar, escolherTipo }) {
  return (
    <div className="fundo-modal-conta" role="presentation" onMouseDown={fechar}>
      <section className="modal-tipo-conta" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-conta" onMouseDown={(evento) => evento.stopPropagation()}>
        <button className="fechar-modal-conta" type="button" aria-label="Fechar" onClick={fechar}>×</button>
        <p className="rotulo-secao">ABERTURA DE CONTA</p>
        <h2 id="titulo-modal-conta">Qual conta você quer abrir?</h2>
        <p className="texto-modal-conta">Escolha uma opção para começar seu cadastro simulado.</p>
        <div className="opcoes-modal-conta">
          <button type="button" onClick={() => escolherTipo('PF')}>
            <span>PF</span>
            <div><strong>Pessoa Física</strong><small>Conta para sua vida financeira</small></div>
            <b aria-hidden="true">→</b>
          </button>
          <button type="button" onClick={() => escolherTipo('PJ')}>
            <span>PJ</span>
            <div><strong>Pessoa Jurídica</strong><small>Conta para sua empresa</small></div>
            <b aria-hidden="true">→</b>
          </button>
        </div>
        <p className="aviso-modal-conta">Ambiente acadêmico. Nenhuma conta bancária real será criada.</p>
      </section>
    </div>
  )
}
