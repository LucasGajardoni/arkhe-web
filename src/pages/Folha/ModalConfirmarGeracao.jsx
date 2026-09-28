import { useModalAcessivel } from '../../hooks/useModalAcessivel.js'
import { meses, moeda } from './folhaUtils.js'

export default function ModalConfirmarGeracao({ mes, ano, funcionarios, fechar, confirmar, processando, erro }) {
  const { modalRef, fecharAoClicarFora } = useModalAcessivel(fechar, processando)
  const ativos = funcionarios.filter((item) => Number(item.status) === 1)
  const total = ativos.reduce((soma, item) => soma + Number(item.salario || 0), 0)
  const periodo = `${meses[Number(mes) - 1]} de ${ano}`
  return <div className="fundo-modal-identidade" onMouseDown={fecharAoClicarFora}>
    <section ref={modalRef} className="modal-identidade modal-folha" role="dialog" aria-modal="true" aria-labelledby="titulo-geracao-folha" tabIndex={-1} aria-busy={processando}>
      <p className="rotulo-secao">NOVA COMPETÊNCIA</p>
      <h2 id="titulo-geracao-folha">Criar folha de {periodo}?</h2>
      <p>Revise o que será registrado antes de criar a folha.</p>
      <dl className="folha-confirmacao-resumo">
        <div><dt>Competência</dt><dd>{periodo}</dd></div>
        <div><dt>Funcionários ativos</dt><dd>{ativos.length}</dd></div>
        <div><dt>Total previsto</dt><dd>{moeda.format(total)}</dd></div>
      </dl>
      <div className="folha-aviso-congelamento"><strong>Esta folha será uma fotografia deste momento.</strong><p>Funcionários e salários ficam fixos nela. Cadastros ou alterações feitos depois só entram em uma nova competência.</p></div>
      {erro && <p role="alert" className="mensagem-identidade erro">{erro}</p>}
      <div className="acoes-identidade">
        <button type="button" className="botao botao-secundario" disabled={processando} onClick={fechar}>Voltar e revisar</button>
        <button type="button" className="botao botao-principal" disabled={processando || ativos.length === 0} onClick={confirmar}>{processando ? 'Criando folha...' : 'Confirmar e criar folha'}</button>
      </div>
    </section>
  </div>
}
