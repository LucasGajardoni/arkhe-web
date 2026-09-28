import { useState } from 'react'
import { useModalAcessivel } from '../../hooks/useModalAcessivel.js'
import { meses } from './folhaUtils.js'

export default function ModalEditarFolha({ folha, fechar, salvar, processando, erro }) {
  const hoje = new Date()
  const mesAtual = hoje.getMonth() + 1
  const anoAtual = hoje.getFullYear()
  const [mes, setMes] = useState(String(folha.mes))
  const [ano, setAno] = useState(String(folha.ano))
  const [validacao, setValidacao] = useState('')
  const { modalRef, fecharAoClicarFora } = useModalAcessivel(fechar, processando)

  function enviar(evento) {
    evento.preventDefault()
    const mesNumero = Number(mes)
    const anoNumero = Number(ano)
    if (!Number.isInteger(anoNumero) || anoNumero < anoAtual || anoNumero > 2200 || (anoNumero === anoAtual && mesNumero < mesAtual)) {
      setValidacao('Escolha o mês atual ou uma competência futura.')
      return
    }
    setValidacao('')
    salvar(mesNumero, anoNumero)
  }

  return <div className="fundo-modal-identidade" onMouseDown={fecharAoClicarFora}>
    <section ref={modalRef} className="modal-identidade modal-folha" role="dialog" aria-modal="true" aria-labelledby="titulo-editar-folha" tabIndex={-1} aria-busy={processando}>
      <p className="rotulo-secao">EDITAR RASCUNHO</p>
      <h2 id="titulo-editar-folha">Atualizar folha</h2>
      <p>Você pode alterar a competência e atualizar este rascunho com a equipe ativa e os salários atuais.</p>
      <form onSubmit={enviar}>
        <div className="folha-competencia">
          <div className="campo-identidade"><label htmlFor="editar-folha-mes">Mês</label><select id="editar-folha-mes" value={mes} disabled={processando} onChange={(e) => setMes(e.target.value)}>{meses.map((nome, indice) => { const numeroMes = indice + 1; const desabilitado = Number(ano) === anoAtual && numeroMes < mesAtual; return <option key={nome} value={numeroMes} disabled={desabilitado}>{nome}</option> })}</select></div>
          <div className="campo-identidade"><label htmlFor="editar-folha-ano">Ano</label><input id="editar-folha-ano" type="number" min={anoAtual} max="2200" step="1" value={ano} disabled={processando} onChange={(e) => { const valor = e.target.value; setAno(valor); if (Number(valor) === anoAtual && Number(mes) < mesAtual) setMes(String(mesAtual)) }} /></div>
        </div>
        <div className="folha-aviso-congelamento"><strong>O rascunho será montado novamente.</strong><p>Funcionários ativos, salários e vínculos de conta serão recarregados do cadastro atual. Folhas já processadas não podem ser editadas.</p></div>
        {(validacao || erro) && <p className="mensagem-identidade erro" role="alert">{validacao || erro}</p>}
        <div className="acoes-identidade"><button className="botao botao-secundario" type="button" disabled={processando} onClick={fechar}>Cancelar</button><button className="botao botao-principal" type="submit" disabled={processando}>{processando ? 'Atualizando...' : 'Salvar rascunho'}</button></div>
      </form>
    </section>
  </div>
}
