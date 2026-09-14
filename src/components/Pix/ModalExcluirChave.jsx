import { useModalAcessivel } from '../../hooks/useModalAcessivel.js'
import { formatarChavePix } from '../../utils/formatadores.js'

export default function ModalExcluirChave({ chave, processando, erro, fechar, excluir }) {
  const { modalRef, fecharAoClicarFora } = useModalAcessivel(fechar, processando)

  let textoExcluir = 'Excluir chave'
  if (processando) textoExcluir = 'Excluindo...'

  return (
    <div className="fundo-modal-perfil" role="presentation" onMouseDown={fecharAoClicarFora}>
      <section
        ref={modalRef}
        className="modal-perfil modal-excluir-chave"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="titulo-excluir-chave"
        tabIndex="-1"
      >
        <header>
          <div>
            <p>CONFIRMAR EXCLUSÃO</p>
            <h2 id="titulo-excluir-chave">Excluir chave Pix?</h2>
            <span>Você deixará de receber transferências por esta chave.</span>
          </div>
          <button type="button" disabled={processando} onClick={fechar} aria-label="Fechar modal">×</button>
        </header>
        <div className="conteudo-excluir-chave">
          <span>{chave.tipo}</span>
          <strong>{formatarChavePix(chave.tipo, chave.valor)}</strong>
          {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}
          <footer>
            <button className="botao botao-secundario" type="button" onClick={fechar}>Cancelar</button>
            <button className="botao botao-perigo" type="button" disabled={processando} onClick={excluir}>
              {textoExcluir}
            </button>
          </footer>
        </div>
      </section>
    </div>
  )
}
