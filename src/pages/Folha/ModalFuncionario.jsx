import { useState } from 'react'
import { useModalAcessivel } from '../../hooks/useModalAcessivel.js'
import { mascaraCpf, somenteNumeros } from '../../utils/formatadores.js'

export default function ModalFuncionario({ funcionario, fechar, salvar, processando, erro }) {
  const { modalRef, fecharAoClicarFora } = useModalAcessivel(fechar, processando)
  const [nome, setNome] = useState(funcionario?.nome || '')
  const [cpf, setCpf] = useState('')
  const [salario, setSalario] = useState(funcionario ? String(funcionario.salario).replace('.', ',') : '')
  const [validacao, setValidacao] = useState('')

  function enviar(evento) {
    evento.preventDefault()
    if (processando) return
    const valor = Number(salario.replace(/\./g, '').replace(',', '.'))
    if (!nome.trim() || (!funcionario && somenteNumeros(cpf).length !== 11) || !Number.isFinite(valor) || valor <= 0) {
      setValidacao(funcionario ? 'Informe o nome e um salário maior que zero.' : 'Informe o nome, um CPF com 11 dígitos e um salário maior que zero.')
      return
    }
    setValidacao('')
    salvar({ ...(funcionario ? { id_funcionario: funcionario.id_funcionario } : { cpf }), nome: nome.trim(), salario: valor })
  }

  return <div className="fundo-modal-identidade" onMouseDown={fecharAoClicarFora}>
    <section className="modal-identidade modal-folha" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="titulo-funcionario" tabIndex={-1} aria-busy={processando}>
      <p className="rotulo-secao">FUNCIONÁRIOS</p>
      <h2 id="titulo-funcionario">{funcionario ? 'Editar funcionário' : 'Adicionar funcionário'}</h2>
      <p>{funcionario ? 'Atualize os dados para as próximas folhas.' : 'Cadastre quem faz parte da sua equipe.'}</p>
      <form onSubmit={enviar}>
        <div className="campo-identidade"><label htmlFor="funcionario-nome">Nome completo</label><input id="funcionario-nome" value={nome} onChange={(e) => setNome(e.target.value)} required disabled={processando} autoComplete="name" /></div>
        {!funcionario && <div className="campo-identidade"><label htmlFor="funcionario-cpf">CPF</label><input id="funcionario-cpf" value={cpf} onChange={(e) => setCpf(mascaraCpf(e.target.value))} inputMode="numeric" maxLength={14} required disabled={processando} /></div>}
        <div className="campo-identidade"><label htmlFor="funcionario-salario">Salário mensal (R$)</label><input id="funcionario-salario" value={salario} onChange={(e) => setSalario(e.target.value)} inputMode="decimal" placeholder="2.500,00" pattern="[0-9]+(\.[0-9]{3})*(,[0-9]{1,2})?" required disabled={processando} aria-describedby="ajuda-salario" /><small id="ajuda-salario">Use vírgula para os centavos. Ex.: 2.500,00.</small></div>
        {(validacao || erro) && <p className="mensagem-identidade erro" role="alert">{validacao || erro}</p>}
        <div className="acoes-identidade">
          <button className="botao botao-secundario" type="button" onClick={fechar} disabled={processando}>Cancelar</button>
          <button className="botao botao-principal" type="submit" disabled={processando}>{processando ? 'Salvando...' : 'Salvar funcionário'}</button>
        </div>
      </form>
    </section>
  </div>
}
