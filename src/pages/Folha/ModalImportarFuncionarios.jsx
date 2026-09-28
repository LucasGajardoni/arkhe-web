import { useMemo, useRef, useState } from 'react'
import { useModalAcessivel } from '../../hooks/useModalAcessivel.js'
import { useSessao } from '../../hooks/useSessao.js'
import { importarCsvFuncionarios, previewCsvFuncionarios } from '../../services/folhaService.js'
import { mascaraCpf, somenteNumeros } from '../../utils/formatadores.js'
import { baixarModeloFuncionarios } from './csvFuncionarios.js'
import { moeda, possuiConta } from './folhaUtils.js'

const filtros = [
  ['todos', 'Todos'],
  ['novo', 'Novos'],
  ['existente', 'Existentes'],
  ['erro', 'Erros'],
]

const chaveItem = (item) => `${item.linha}:${item.cpf || ''}`
const normalizar = (texto) => String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

function tamanhoArquivo(tamanho) {
  if (tamanho < 1024) return `${tamanho} bytes`
  if (tamanho < 1024 * 1024) return `${(tamanho / 1024).toFixed(1).replace('.', ',')} KB`
  return `${(tamanho / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}

function descricaoSituacao(item) {
  if (item.situacao === 'novo') return ['Novo funcionário', 'positivo']
  if (item.situacao === 'existente') return ['Já cadastrado', 'pendente']
  return ['Erro na linha', 'erro']
}

export default function ModalImportarFuncionarios({ fechar, aoImportar }) {
  const { tratarErroSessao } = useSessao()
  const [etapa, setEtapa] = useState('arquivo')
  const [arquivo, setArquivo] = useState(null)
  const [previa, setPrevia] = useState(null)
  const [acoes, setAcoes] = useState({})
  const [filtro, setFiltro] = useState('todos')
  const [busca, setBusca] = useState('')
  const [arrastando, setArrastando] = useState(false)
  const [confirmarMassa, setConfirmarMassa] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState(null)
  const arquivoRef = useRef(null)
  const { modalRef, fecharAoClicarFora } = useModalAcessivel(fechar, processando)

  const itens = useMemo(() => previa?.itens || [], [previa])
  const contagens = useMemo(() => ({
    total: Number(previa?.total_linhas ?? itens.length),
    novo: Number(previa?.novos ?? itens.filter((item) => item.situacao === 'novo').length),
    existente: Number(previa?.existentes ?? itens.filter((item) => item.situacao === 'existente').length),
    erro: Number(previa?.erros ?? itens.filter((item) => item.situacao === 'erro').length),
  }), [itens, previa])
  const resumo = useMemo(() => ({
    criar: itens.filter((item) => item.situacao === 'novo').length,
    atualizar: itens.filter((item) => item.situacao === 'existente' && acoes[chaveItem(item)] === 'atualizar').length,
    ignorar: itens.filter((item) => item.situacao === 'existente' && acoes[chaveItem(item)] !== 'atualizar').length,
    erros: itens.filter((item) => item.situacao === 'erro').length,
  }), [acoes, itens])
  const itensFiltrados = useMemo(() => {
    const termo = busca.trim()
    const cpf = somenteNumeros(termo)
    return itens.filter((item) => (filtro === 'todos' || item.situacao === filtro)
      && (!termo || normalizar(item.nome).includes(normalizar(termo)) || (cpf && somenteNumeros(item.cpf).includes(cpf))))
  }, [busca, filtro, itens])

  function escolherArquivo(novoArquivo) {
    setErro('')
    setPrevia(null)
    setAcoes({})
    if (!novoArquivo) { setArquivo(null); return }
    if (!novoArquivo.name.toLowerCase().endsWith('.csv')) {
      setArquivo(null)
      setErro('Escolha um arquivo no formato CSV.')
      if (arquivoRef.current) arquivoRef.current.value = ''
      return
    }
    setArquivo(novoArquivo)
  }

  function removerArquivo() {
    escolherArquivo(null)
    if (arquivoRef.current) arquivoRef.current.value = ''
  }

  async function analisar() {
    if (!arquivo || processando) return
    setProcessando(true); setErro('')
    try {
      const resposta = await previewCsvFuncionarios(arquivo)
      if (!Array.isArray(resposta.itens)) throw new Error('O servidor retornou uma prévia inválida.')
      setPrevia(resposta)
      setAcoes(Object.fromEntries(resposta.itens.filter((item) => item.situacao !== 'erro').map((item) => [chaveItem(item), item.situacao === 'novo' ? 'criar' : 'ignorar'])))
      setFiltro('todos'); setBusca(''); setEtapa('previa')
    } catch (falha) {
      setErro(falha.message || 'Não foi possível analisar o arquivo.')
      tratarErroSessao(falha)
    } finally { setProcessando(false) }
  }

  function atualizarAcao(item, acao) {
    setAcoes((atuais) => ({ ...atuais, [chaveItem(item)]: acao }))
  }

  function atualizarTodos() {
    setAcoes((atuais) => ({
      ...atuais,
      ...Object.fromEntries(itens.filter((item) => item.situacao === 'existente').map((item) => [chaveItem(item), 'atualizar'])),
    }))
    setConfirmarMassa(false)
  }

  function ignorarTodos() {
    setAcoes((atuais) => ({
      ...atuais,
      ...Object.fromEntries(itens.filter((item) => item.situacao === 'existente').map((item) => [chaveItem(item), 'ignorar'])),
    }))
    setConfirmarMassa(false)
  }

  async function importar() {
    if (processando) return
    const selecionados = itens.filter((item) => item.situacao !== 'erro').map((item) => ({
      linha: item.linha,
      cpf: somenteNumeros(item.cpf),
      nome: String(item.nome || '').trim(),
      salario: Number(item.salario),
      acao: item.situacao === 'novo' ? 'criar' : acoes[chaveItem(item)] === 'atualizar' ? 'atualizar' : 'ignorar',
    }))
    setProcessando(true); setErro('')
    try {
      const resposta = await importarCsvFuncionarios(selecionados)
      setResultado(resposta)
      setEtapa('resultado')
      await aoImportar(resposta)
    } catch (falha) {
      setErro(falha.message || 'Não foi possível importar os funcionários.')
      tratarErroSessao(falha)
    } finally { setProcessando(false) }
  }

  function soltarArquivo(evento) {
    evento.preventDefault()
    setArrastando(false)
    escolherArquivo(evento.dataTransfer.files?.[0])
  }

  const titulo = etapa === 'arquivo' ? 'Importe sua equipe em poucos minutos'
    : etapa === 'previa' ? 'Confira os funcionários'
      : etapa === 'confirmacao' ? 'Confirmar importação?'
        : 'Importação concluída'

  return <div className="fundo-modal-identidade" onMouseDown={fecharAoClicarFora}>
    <section className="modal-identidade modal-folha modal-importacao" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="titulo-importacao" tabIndex={-1} aria-busy={processando}>
      <header className="importacao-cabecalho">
        <div><p className="rotulo-secao">IMPORTAR FUNCIONÁRIOS</p><h2 id="titulo-importacao">{titulo}</h2></div>
        <button type="button" className="importacao-fechar" aria-label="Fechar importação" onClick={fechar} disabled={processando}>×</button>
      </header>
      {etapa !== 'resultado' && <ol className="importacao-etapas" aria-label="Etapas da importação">
        <li className={etapa === 'arquivo' ? 'atual' : ''}><span>1</span>Enviar arquivo</li>
        <li className={etapa === 'previa' ? 'atual' : ''}><span>2</span>Conferir dados</li>
        <li className={etapa === 'confirmacao' ? 'atual' : ''}><span>3</span>Confirmar</li>
      </ol>}

      {etapa === 'arquivo' && <div className="importacao-inicio">
        <p>Baixe o modelo, preencha nome, CPF e salário dos funcionários e envie o arquivo novamente.</p>
        <div className="importacao-preparo">
          <div><strong>1</strong><span>Baixe o modelo</span></div><div><strong>2</strong><span>Preencha no Excel</span></div><div><strong>3</strong><span>Salve como CSV</span></div><div><strong>4</strong><span>Envie o arquivo aqui</span></div>
        </div>
        <button className="botao botao-secundario" type="button" onClick={baixarModeloFuncionarios}>Baixar modelo CSV</button>
        <p className="importacao-ajuda">Abra o arquivo no Excel ou Google Sheets, preencha os funcionários e salve ou exporte novamente como CSV UTF-8.</p>
        <div className={`importacao-dropzone${arrastando ? ' arrastando' : ''}`} onDragEnter={(e) => { e.preventDefault(); setArrastando(true) }} onDragOver={(e) => e.preventDefault()} onDragLeave={() => setArrastando(false)} onDrop={soltarArquivo}>
          <input ref={arquivoRef} id="arquivo-funcionarios" type="file" accept=".csv,text/csv" onChange={(e) => escolherArquivo(e.target.files?.[0])} disabled={processando} />
          {!arquivo ? <><strong>Arraste seu arquivo CSV aqui</strong><span>ou selecione no computador</span><label className="botao botao-secundario" htmlFor="arquivo-funcionarios">Selecionar arquivo</label></> : <div className="importacao-arquivo"><span>CSV</span><div><strong>{arquivo.name}</strong><small>{tamanhoArquivo(arquivo.size)}</small></div><button type="button" onClick={removerArquivo} disabled={processando}>Remover</button></div>}
        </div>
        <details className="importacao-como-preparar"><summary>Como preparar o arquivo</summary><ul><li>Não altere os nomes das colunas.</li><li>Use um funcionário por linha.</li><li>CPF pode ser digitado com ou sem pontuação.</li><li>Use salário como 2500,00 ou 2500.00.</li><li>Salve em CSV UTF-8.</li></ul></details>
        {erro && <p className="mensagem-identidade erro" role="alert">{erro}</p>}
        <div className="acoes-identidade"><button className="botao botao-secundario" type="button" onClick={fechar} disabled={processando}>Cancelar</button><button className="botao botao-principal" type="button" onClick={analisar} disabled={!arquivo || processando}>{processando ? 'Analisando arquivo...' : 'Analisar arquivo'}</button></div>
      </div>}

      {etapa === 'previa' && <div className="importacao-previa">
        <p>Revise os dados antes de importar. Funcionários já cadastrados estão marcados para ignorar.</p>
        <dl className="importacao-resumo"><div><dt>Total de linhas</dt><dd>{contagens.total}</dd></div><div><dt>Novos</dt><dd>{contagens.novo}</dd></div><div><dt>Já cadastrados</dt><dd>{contagens.existente}</dd></div><div><dt>Com erro</dt><dd>{contagens.erro}</dd></div></dl>
        {contagens.existente > 0 && <div className="importacao-massa">
          {!confirmarMassa ? <><p>Escolha o que fazer com os funcionários existentes.</p><div><button className="botao botao-secundario" type="button" onClick={() => setConfirmarMassa(true)}>Atualizar todos os existentes</button><button className="botao botao-secundario" type="button" onClick={ignorarTodos}>Ignorar todos</button></div></> : <div className="importacao-confirmacao-massa" role="alertdialog" aria-label="Confirmar atualização em massa"><strong>Atualizar todos os existentes?</strong><p>Isso atualizará nome e salário dos funcionários existentes usando os dados do CSV. O status ativo ou inativo não será alterado.</p><div><button className="botao botao-secundario" type="button" onClick={() => setConfirmarMassa(false)}>Cancelar</button><button className="botao botao-principal" type="button" onClick={atualizarTodos}>Confirmar atualização</button></div></div>}
        </div>}
        <div className="importacao-filtros"><div><label htmlFor="buscar-importacao">Buscar na prévia</label><input id="buscar-importacao" type="search" placeholder="Nome ou CPF" value={busca} onChange={(e) => setBusca(e.target.value)} /></div><div className="importacao-filtro-botoes" aria-label="Filtrar prévia">{filtros.map(([valor, texto]) => <button type="button" key={valor} aria-pressed={filtro === valor} onClick={() => setFiltro(valor)}>{texto}</button>)}</div></div>
        <div className="importacao-tabela" role="table" aria-label="Prévia dos funcionários">
          <div className="importacao-linha importacao-tabela-cabecalho" role="row"><span role="columnheader">Funcionário</span><span role="columnheader">Salário</span><span role="columnheader">Situação</span><span role="columnheader">Conta Arkhé</span><span role="columnheader">Ação</span></div>
          {itensFiltrados.map((item) => {
            const [situacao, tom] = descricaoSituacao(item)
            return <div className={`importacao-linha ${item.situacao}`} role="row" key={chaveItem(item)}>
              <div role="cell" data-label="Funcionário"><strong>{item.nome || 'Nome não informado'}</strong><small>{item.cpf ? mascaraCpf(item.cpf) : `Linha ${item.linha}`}</small>{item.situacao === 'erro' && item.cpf && <small>Linha {item.linha}</small>}</div>
              <div role="cell" data-label="Salário">{item.situacao === 'existente' ? <><small>Atual: {moeda.format(item.salario_atual)}</small><strong>No arquivo: {moeda.format(item.salario)}</strong></> : item.salario ? <strong>{moeda.format(item.salario)}</strong> : <span>—</span>}</div>
              <div role="cell" data-label="Situação"><span className={`folha-badge ${tom}`}>{situacao}</span>{item.erro && <small className="importacao-erro-item">{item.erro}</small>}</div>
              <div role="cell" data-label="Conta Arkhé">{item.situacao === 'erro' ? <span>—</span> : <span className={`folha-badge ${possuiConta(item) ? 'positivo' : 'neutro'}`}>{possuiConta(item) ? 'Conta Arkhé' : 'Não encontrada'}</span>}</div>
              <div role="cell" data-label="Ação">{item.situacao === 'novo' ? <strong>Importar</strong> : item.situacao === 'existente' ? <div className="importacao-escolha"><button type="button" aria-pressed={acoes[chaveItem(item)] === 'atualizar'} onClick={() => atualizarAcao(item, 'atualizar')}>Atualizar</button><button type="button" aria-pressed={acoes[chaveItem(item)] !== 'atualizar'} onClick={() => atualizarAcao(item, 'ignorar')}>Ignorar</button></div> : <small>Não importar</small>}</div>
            </div>
          })}
          {itensFiltrados.length === 0 && <p className="folha-estado" role="status">Nenhum item encontrado neste filtro.</p>}
        </div>
        {erro && <p className="mensagem-identidade erro" role="alert">{erro}</p>}
        <div className="acoes-identidade importacao-acoes-fixas"><button className="botao botao-secundario" type="button" onClick={() => { setEtapa('arquivo'); setErro('') }}>Trocar arquivo</button><button className="botao botao-principal" type="button" onClick={() => setEtapa('confirmacao')} disabled={resumo.criar + resumo.atualizar + resumo.ignorar === 0}>Continuar</button></div>
      </div>}

      {etapa === 'confirmacao' && <div className="importacao-confirmacao">
        <p>Confira o resumo. A importação não altera o status ativo ou inativo dos funcionários existentes.</p>
        <dl className="folha-confirmacao-resumo"><div><dt>Novos funcionários que serão cadastrados</dt><dd>{resumo.criar}</dd></div><div><dt>Funcionários existentes que serão atualizados</dt><dd>{resumo.atualizar}</dd></div><div><dt>Funcionários existentes que serão ignorados</dt><dd>{resumo.ignorar}</dd></div><div><dt>Linhas com erro que não serão importadas</dt><dd>{resumo.erros}</dd></div></dl>
        {erro && <p className="mensagem-identidade erro" role="alert">{erro}</p>}
        {processando && <p className="importacao-processando" role="status">Importando funcionários...</p>}
        <div className="acoes-identidade"><button className="botao botao-secundario" type="button" onClick={() => { setEtapa('previa'); setErro('') }} disabled={processando}>Voltar</button><button className="botao botao-principal" type="button" onClick={importar} disabled={processando}>{processando ? 'Importando...' : 'Confirmar importação'}</button></div>
      </div>}

      {etapa === 'resultado' && resultado && <div className="importacao-resultado">
        <span className="importacao-sucesso" aria-hidden="true">✓</span>
        <p>Sua lista de funcionários foi atualizada.</p>
        <dl className="folha-confirmacao-resumo"><div><dt>Funcionários adicionados</dt><dd>{Number(resultado.criados || 0)}</dd></div><div><dt>Atualizados</dt><dd>{Number(resultado.atualizados || 0)}</dd></div><div><dt>Ignorados</dt><dd>{Number(resultado.ignorados || 0)}</dd></div></dl>
        {Array.isArray(resultado.erros) && resultado.erros.length > 0 && <div className="importacao-erros-parciais" role="alert"><h3>Alguns funcionários não puderam ser importados.</h3><ul>{resultado.erros.map((item, indice) => <li key={`${item.linha}:${indice}`}><strong>Linha {item.linha}{item.cpf ? ` — CPF ${mascaraCpf(item.cpf)}` : ''}</strong><span>Motivo: {item.erro || item.motivo || 'Não informado'}</span></li>)}</ul></div>}
        <div className="acoes-identidade"><button className="botao botao-principal" type="button" onClick={fechar}>Concluir</button></div>
      </div>}
    </section>
  </div>
}
