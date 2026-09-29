import { useState } from 'react'
import { mascaraCpf } from '../../utils/formatadores.js'
import { formatarDataHoraMovimentacao } from '../../utils/movimentacoes.js'
import AcoesComprovante from '../../components/Comprovante/AcoesComprovante.jsx'
import { competencia, formatarDataFolha, moeda, podePagar, statusFolha, statusItem, tonsFolha } from './folhaUtils.js'
import Paginacao from './Paginacao.jsx'

const tonsItem = ['pendente', 'positivo', 'positivo', 'erro']

export default function PreviaFolha({ folha, bloqueado, pagar, revalidar, atualizar, outraCompetencia, editarRascunho, excluirRascunho }) {
  const status = Number(folha.status)
  const encerrada = status === 2 || status === 3
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(5)
  const itens = Array.isArray(folha.itens) ? folha.itens : []
  const totalPaginas = Math.max(1, Math.ceil(itens.length / porPagina))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const inicio = (paginaAtual - 1) * porPagina
  const itensPaginados = itens.slice(inicio, inicio + porPagina)

  function alterarPorPagina(valor) {
    setPorPagina(valor)
    setPagina(1)
  }
  return <>
    <header className="folha-topo-painel folha-cabecalho-previa">
      <div><p className="rotulo-secao">FOLHA ABERTA AGORA</p><h2>Folha de {competencia(folha)}</h2><div className="folha-metadados"><span className={`folha-badge ${tonsFolha[status] || 'neutro'}`}>{statusFolha[status] || 'Situação não informada'}</span><span>Criada em {formatarDataFolha(folha.data_criacao) || 'data não informada'}</span>{folha.data_pagamento && <span>Último pagamento em {formatarDataFolha(folha.data_pagamento)}</span>}</div></div>
      <div className="folha-acoes"><button className="botao botao-secundario" type="button" disabled={bloqueado} onClick={atualizar}>Atualizar situação</button>{status === 0 && <button className="botao botao-secundario" type="button" disabled={bloqueado} onClick={editarRascunho}>Editar rascunho</button>}{status === 0 && <button className="botao botao-perigo" type="button" disabled={bloqueado} onClick={excluirRascunho}>Excluir rascunho</button>}<button className="botao botao-secundario" type="button" disabled={bloqueado} onClick={outraCompetencia}>Criar outra folha</button></div>
    </header>
    <dl className="folha-resumos" aria-label="Resumo financeiro da folha">
      {[
        ['Total da folha', folha.total], ['Pago', folha.total_pago], ['Pronto para pagar', folha.total_valido], ['Pendente', folha.total_pendente],
      ].map(([rotulo, valor]) => <div key={rotulo}><dt>{rotulo}</dt><dd>{moeda.format(valor)}</dd></div>)}
    </dl>
    {status === 2 && <p className="folha-aviso" role="status">Folha em processamento. Atualize a folha para acompanhar a conclusão.</p>}
    {status === 3 && <p className="mensagem-identidade" role="status">Folha paga com sucesso.</p>}
    {status === 4 && <p className="folha-aviso">Os pagamentos disponíveis foram concluídos. {Number(folha.quantidade_pendentes) > 0 ? 'Ainda existem funcionários pendentes.' : 'Confira os itens restantes antes de continuar.'}</p>}
    {Number(folha.quantidade_pendentes) > 0 && <div className="folha-aviso folha-topo-painel"><p>Alguns funcionários ainda não possuem uma conta PF Arkhé vinculada.</p><button type="button" className="botao botao-secundario" disabled={bloqueado || encerrada} onClick={revalidar}>Verificar novamente</button></div>}
    <section className="bloco-dashboard folha-painel">
      <header className="folha-topo-painel"><div><h2>Pagamentos da equipe</h2><p>{folha.quantidade_funcionarios} {Number(folha.quantidade_funcionarios) === 1 ? 'funcionário' : 'funcionários'} · {folha.quantidade_pagos} {Number(folha.quantidade_pagos) === 1 ? 'pago' : 'pagos'} · {folha.quantidade_validos} {Number(folha.quantidade_validos) === 1 ? 'pronto' : 'prontos'} · {folha.quantidade_pendentes} {Number(folha.quantidade_pendentes) === 1 ? 'pendente' : 'pendentes'}</p>{Number(folha.quantidade_pagos) > 0 && <p className="folha-ajuda-comprovante">Cada pagamento concluído possui seu próprio comprovante.</p>}</div></header>
      {itens.length === 0 ? <p className="folha-estado">Esta folha não possui funcionários. Cadastre sua equipe na área Funcionários.</p> : <ul className="folha-lista">
        {itensPaginados.map((item) => <li className="folha-item" key={item.id_item}>
          <div><h3>{item.nome}</h3><p>{mascaraCpf(item.cpf)}</p></div>
          <div><small>Valor</small><strong>{moeda.format(item.valor)}</strong></div>
          <div><span className={`folha-badge ${tonsItem[Number(item.status)] || 'neutro'}`}>{statusItem[Number(item.status)] || 'Situação não informada'}</span>
            {item.erro && <p>{item.erro}</p>}
            {Number(item.status) === 2 && item.data_pagamento && <p>{formatarDataHoraMovimentacao({ data_movimentacao: item.data_pagamento })}</p>}
            {Number(item.status) === 2 && item.id_movimentacao && <AcoesComprovante idMovimentacao={item.id_movimentacao} />}
          </div>
        </li>)}
      </ul>}
      {itens.length > 0 && <Paginacao
        total={itens.length}
        pagina={paginaAtual}
        porPagina={porPagina}
        onPagina={setPagina}
        onPorPagina={alterarPorPagina}
        rotulo="pagamentos"
      />}
      {podePagar(folha) && <footer className="folha-rodape-pagamento"><p>O pagamento inclui apenas os funcionários prontos.</p><button className="botao botao-principal" type="button" disabled={bloqueado} onClick={pagar}>Pagar {moeda.format(folha.total_valido)}</button></footer>}
    </section>
  </>
}
