import { useEffect } from 'react'
import { formatarChavePix } from '../../utils/formatadores.js'

export default function ModalExcluirChave({ chave, processando, erro, fechar, excluir }) {
  useEffect(() => {
    function fecharComEsc(evento) { if (evento.key === 'Escape') fechar() }
    document.addEventListener('keydown', fecharComEsc)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', fecharComEsc); document.body.style.overflow = '' }
  }, [fechar])

  return <div className="fundo-modal-perfil" role="presentation" onMouseDown={(evento) => { if (evento.target === evento.currentTarget) fechar() }}>
    <section className="modal-perfil modal-excluir-chave" role="alertdialog" aria-modal="true" aria-labelledby="titulo-excluir-chave">
      <header><div><p>CONFIRMAR EXCLUSÃO</p><h2 id="titulo-excluir-chave">Excluir chave Pix?</h2><span>Você deixará de receber transferências por esta chave.</span></div><button type="button" onClick={fechar} aria-label="Fechar modal">×</button></header>
      <div className="conteudo-excluir-chave"><span>{chave.tipo}</span><strong>{formatarChavePix(chave.tipo, chave.valor)}</strong>{erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}<footer><button className="botao botao-secundario" type="button" onClick={fechar}>Cancelar</button><button className="botao botao-perigo" type="button" disabled={processando} onClick={excluir}>{processando ? 'Excluindo...' : 'Excluir chave'}</button></footer></div>
    </section>
  </div>
}
