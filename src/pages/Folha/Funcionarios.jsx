import { useState } from 'react'
import Paginacao from './Paginacao.jsx'
import Icone from '../../components/Dashboard/Icone.jsx'
import { mascaraCpf, somenteNumeros } from '../../utils/formatadores.js'
import { exportarFuncionarios } from './csvFuncionarios.js'
import { moeda, possuiConta } from './folhaUtils.js'

export default function Funcionarios({ funcionarios, carregando, erro, atualizar, editar, alterarStatus, bloqueado, adicionar, importar, abrirFolha }) {
  const [busca, setBusca] = useState('')
  const [situacao, setSituacao] = useState('todos')
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(5)
  const ativos = funcionarios.filter((item) => Number(item.status) === 1).length
  const comConta = funcionarios.filter(possuiConta).length
  const cadastrosInvalidos = funcionarios.filter((item) => item.cadastro_valido === false).length
  const salarios = funcionarios.filter((item) => Number(item.status) === 1).reduce((total, item) => total + Number(item.salario || 0), 0)
  const normalizar = (texto) => String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const lista = funcionarios.filter((item) => {
    const nomeEncontrado = normalizar(item.nome).includes(normalizar(busca.trim()))
    const cpfBuscado = somenteNumeros(busca)
    const cpfEncontrado = cpfBuscado.length > 0 && somenteNumeros(item.cpf).includes(cpfBuscado)
    return (nomeEncontrado || cpfEncontrado) && (situacao === 'todos' || Number(item.status) === Number(situacao))
  })
  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const inicio = (paginaAtual - 1) * porPagina
  const listaPaginada = lista.slice(inicio, inicio + porPagina)

  function alterarBusca(valor) {
    setBusca(valor)
    setPagina(1)
  }

  function alterarSituacao(valor) {
    setSituacao(valor)
    setPagina(1)
  }

  function alterarPorPagina(valor) {
    setPorPagina(valor)
    setPagina(1)
  }
  if (carregando) return <p className="folha-estado" role="status">Carregando funcionários...</p>
  if (erro) return <div className="mensagem-identidade erro" role="alert">{erro} <button className="botao botao-secundario" type="button" onClick={atualizar} disabled={bloqueado}>Tentar novamente</button></div>
  return <>
    <dl className="folha-resumos funcionarios-resumos" aria-label="Resumo dos funcionários">
      {[
        ['Funcionários ativos', ativos, 'Incluídos nas próximas folhas', 'folha'],
        ['Funcionários inativos', funcionarios.length - ativos, 'Cadastros preservados', 'pessoa'],
        ['Com conta Arkhé', comConta, 'Conta encontrada', 'conferir'],
        ['Sem conta Arkhé', funcionarios.length - comConta, 'Aguardando abertura de conta', 'chave'],
      ].map(([rotulo, valor, detalhe, icone]) => <div key={rotulo}><dt>{rotulo}<Icone nome={icone} tamanho={18} /></dt><dd>{valor}</dd><dd className="funcionarios-resumo-detalhe">{detalhe}</dd></div>)}
    </dl>
    {cadastrosInvalidos > 0 && <div className="mensagem-identidade erro funcionarios-aviso-cadastro" role="alert">
      <strong>{cadastrosInvalidos} {cadastrosInvalidos === 1 ? 'cadastro precisa' : 'cadastros precisam'} de correção.</strong>
      <span>Esses registros antigos não entram em novas folhas enquanto CPF, nome e salário não estiverem válidos. Use “Editar” para corrigir.</span>
    </div>}
    <div className="funcionarios-layout">
      <section className="bloco-dashboard folha-painel funcionarios-painel">
        <header className="folha-topo-painel"><div><p className="rotulo-secao">PESSOAS DA SUA EMPRESA</p><h2>Sua equipe</h2></div><div className="funcionarios-acoes-lista"><button type="button" className="botao botao-secundario" disabled={bloqueado} onClick={importar}>Importar CSV</button><button type="button" className="botao botao-secundario" disabled={bloqueado} onClick={() => exportarFuncionarios(funcionarios)}>Exportar funcionários</button><button type="button" className="botao botao-secundario" disabled={bloqueado} onClick={atualizar}>Atualizar funcionários</button></div></header>
        {funcionarios.length === 0 ? <div className="folha-estado funcionarios-vazio">
          <span className="funcionarios-vazio-icone"><Icone nome="folha" tamanho={38} /></span>
          <h3>Nenhum funcionário cadastrado ainda.</h3><p>Adicione o primeiro funcionário para preparar sua folha de pagamento.</p>
          <button type="button" className="botao botao-principal" disabled={bloqueado} onClick={adicionar}><Icone nome="mais" tamanho={18} />Cadastrar primeiro funcionário</button>
          <small>Você só precisa do nome, CPF e salário mensal.</small>
        </div> : <>
          <div className="funcionarios-filtros">
            <div className="funcionarios-busca"><label htmlFor="buscar-funcionario">Buscar funcionário</label><input id="buscar-funcionario" type="search" placeholder="Nome ou CPF" value={busca} onChange={(e) => alterarBusca(e.target.value)} /></div>
            <div><label htmlFor="situacao-funcionario">Situação</label><select id="situacao-funcionario" value={situacao} onChange={(e) => alterarSituacao(e.target.value)}><option value="todos">Todos os funcionários</option><option value="1">Ativos</option><option value="0">Inativos</option></select></div>
          </div>
          <p className="funcionarios-contagem" role="status">{lista.length} {lista.length === 1 ? 'funcionário encontrado' : 'funcionários encontrados'}</p>
          {lista.length === 0 ? <div className="folha-estado"><h3>Nenhum funcionário encontrado.</h3><p>Tente outro nome, CPF ou situação.</p><button type="button" className="botao botao-secundario" onClick={() => { setBusca(''); setSituacao('todos'); setPagina(1) }}>Limpar filtros</button></div> : <ul className="folha-lista funcionarios-lista">
            {listaPaginada.map((funcionario) => {
              const ativo = Number(funcionario.status) === 1
              const cadastroValido = funcionario.cadastro_valido !== false
              const iniciais = String(funcionario.nome || '').trim().split(/\s+/).slice(0, 2).map((nome) => nome[0]).join('')
              return <li className="folha-funcionario" key={funcionario.id_funcionario}>
                <div className="funcionario-identidade"><span className="funcionario-avatar" aria-hidden="true">{iniciais}</span><div><h3>{funcionario.nome}</h3><p>{mascaraCpf(funcionario.cpf)}</p></div></div>
                <div className="funcionario-salario"><small>Salário mensal</small><strong>{moeda.format(funcionario.salario)}</strong></div>
                <div className="folha-badges"><span className={`folha-badge ${ativo ? 'positivo' : 'neutro'}`}>{ativo ? 'Ativo' : 'Inativo'}</span>{!cadastroValido && <span className="folha-badge erro">Cadastro inválido</span>}<span className={`folha-badge ${possuiConta(funcionario) ? 'positivo' : 'pendente'}`}>{possuiConta(funcionario) ? 'Conta Arkhé' : 'Conta não encontrada'}</span></div>
                <div className="folha-acoes"><button className="botao botao-secundario" type="button" disabled={bloqueado} onClick={() => editar(funcionario)} aria-label={`Editar ${funcionario.nome || 'funcionário'}`}>Editar</button><button className="botao botao-secundario" type="button" disabled={bloqueado || (!ativo && !cadastroValido)} title={!ativo && !cadastroValido ? 'Corrija o cadastro antes de reativar.' : undefined} onClick={() => alterarStatus(funcionario)} aria-label={`${ativo ? 'Desativar' : 'Reativar'} ${funcionario.nome || 'funcionário'}`}>{ativo ? 'Desativar' : 'Reativar'}</button></div>
              </li>
            })}
          </ul>}
          {lista.length > 0 && <Paginacao
            total={lista.length}
            pagina={paginaAtual}
            porPagina={porPagina}
            onPagina={setPagina}
            onPorPagina={alterarPorPagina}
            rotulo="funcionários"
          />}
        </>}
      </section>
      <aside className="funcionarios-orientacao" aria-label="Preparar pagamentos">
        <div className="funcionarios-previsao"><span className="folha-icone"><Icone nome="extrato" tamanho={25} /></span><p>SALÁRIOS DA EQUIPE ATIVA</p><strong>{moeda.format(salarios)}</strong><small>Base mensal de {ativos} {ativos === 1 ? 'funcionário ativo' : 'funcionários ativos'}.</small></div>
        <div className="funcionarios-passos"><h2>Do cadastro ao pagamento</h2><ol>
          <li><span>1</span><div><strong>Cadastre sua equipe</strong><p>Informe nome, CPF e salário.</p></div></li>
          <li><span>2</span><div><strong>Confira a folha</strong><p>Escolha o mês e revise os valores.</p></div></li>
          <li><span>3</span><div><strong>Confirme o pagamento</strong><p>Pague quem já tem conta PF Arkhé.</p></div></li>
        </ol><button type="button" className="botao botao-principal" disabled={bloqueado} onClick={abrirFolha}>Preparar folha<Icone nome="seta" tamanho={16} /></button>
        <p className="funcionarios-nota">Alterações no cadastro valem para as próximas folhas. As anteriores são preservadas.</p></div>
      </aside>
    </div>
  </>
}
