import { mascaraCpf } from '../../utils/formatadores.js'
import { moeda, possuiConta } from './folhaUtils.js'

export default function Funcionarios({ funcionarios, carregando, erro, atualizar, editar, alterarStatus, bloqueado }) {
  const ativos = funcionarios.filter((item) => Number(item.status) === 1).length
  const comConta = funcionarios.filter(possuiConta).length
  if (carregando) return <p className="folha-estado" role="status">Carregando funcionários...</p>
  if (erro) return <div className="mensagem-identidade erro" role="alert">{erro} <button className="botao botao-secundario" type="button" onClick={atualizar} disabled={bloqueado}>Tentar novamente</button></div>
  return <>
    <dl className="folha-resumos" aria-label="Resumo dos funcionários">
      {[
        ['Funcionários ativos', ativos], ['Funcionários inativos', funcionarios.length - ativos],
        ['Com conta Arkhé', comConta], ['Sem conta Arkhé', funcionarios.length - comConta],
      ].map(([rotulo, valor]) => <div key={rotulo}><dt>{rotulo}</dt><dd>{valor}</dd></div>)}
    </dl>
    <section className="bloco-dashboard folha-painel">
      <header className="folha-topo-painel"><h2>Sua equipe</h2><button type="button" className="botao botao-secundario" disabled={bloqueado} onClick={atualizar}>Atualizar funcionários</button></header>
      {funcionarios.length === 0 ? <div className="folha-estado"><h3>Nenhum funcionário cadastrado ainda.</h3><p>Adicione o primeiro funcionário para preparar sua folha de pagamento.</p></div> : <ul className="folha-lista">
        {funcionarios.map((funcionario) => {
          const ativo = Number(funcionario.status) === 1
          return <li className="folha-funcionario" key={funcionario.id_funcionario}>
            <div><h3>{funcionario.nome}</h3><p>{mascaraCpf(funcionario.cpf)}</p></div>
            <div><small>Salário mensal</small><strong>{moeda.format(funcionario.salario)}</strong></div>
            <div className="folha-badges"><span className={`folha-badge ${ativo ? 'positivo' : 'neutro'}`}>{ativo ? 'Ativo' : 'Inativo'}</span><span className={`folha-badge ${possuiConta(funcionario) ? 'positivo' : 'pendente'}`}>{possuiConta(funcionario) ? 'Conta Arkhé' : 'Conta não encontrada'}</span></div>
            <div className="folha-acoes"><button className="botao botao-secundario" type="button" disabled={bloqueado} onClick={() => editar(funcionario)} aria-label={`Editar ${funcionario.nome}`}>Editar</button><button className="botao botao-secundario" type="button" disabled={bloqueado} onClick={() => alterarStatus(funcionario)} aria-label={`${ativo ? 'Desativar' : 'Reativar'} ${funcionario.nome}`}>{ativo ? 'Desativar' : 'Reativar'}</button></div>
          </li>
        })}
      </ul>}
    </section>
  </>
}
