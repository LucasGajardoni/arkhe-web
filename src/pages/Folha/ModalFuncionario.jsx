import { useState } from 'react'
import { useModalAcessivel } from '../../hooks/useModalAcessivel.js'
import { mascaraCpf, somenteNumeros } from '../../utils/formatadores.js'
import { buscarContasUsuario } from '../../services/pixService.js'
import { centavosDeMoeda, moedaDigitada } from './folhaUtils.js'

export default function ModalFuncionario({ funcionario, fechar, salvar, processando, erro }) {
  const { modalRef, fecharAoClicarFora } = useModalAcessivel(fechar, processando)
  const [nome, setNome] = useState(funcionario?.nome || '')
  const [cpf, setCpf] = useState('')
  const [centavos, setCentavos] = useState(funcionario ? Math.round(Number(funcionario.salario) * 100) : 0)
  const [validacao, setValidacao] = useState('')
  const [busca, setBusca] = useState('')
  const [contas, setContas] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [buscaRealizada, setBuscaRealizada] = useState(false)
  const [contaSelecionada, setContaSelecionada] = useState(null)
  const [erroBusca, setErroBusca] = useState('')

  function enviar(evento) {
    evento.preventDefault()
    if (processando) return
    const valor = centavos / 100
    if (!nome.trim() || (!funcionario && somenteNumeros(cpf).length !== 11) || !Number.isFinite(valor) || valor <= 0) {
      setValidacao(funcionario ? 'Informe o nome e um salário maior que zero.' : 'Informe o nome, um CPF com 11 dígitos e um salário maior que zero.')
      return
    }
    setValidacao('')
    salvar({ ...(funcionario ? { id_funcionario: funcionario.id_funcionario } : { cpf }), nome: nome.trim(), salario: valor })
  }

  async function buscarConta(evento) {
    evento.preventDefault()
    const termo = busca.trim()
    if (!termo || buscando) {
      if (!termo) setValidacao('Digite o nome, CPF, e-mail ou telefone do funcionário.')
      return
    }
    setBuscando(true); setValidacao(''); setErroBusca(''); setBuscaRealizada(false)
    try {
      const resposta = await buscarContasUsuario(somenteNumeros(termo).length === 11 ? somenteNumeros(termo) : termo)
      setContas((Array.isArray(resposta.contas) ? resposta.contas : []).filter((conta) => [0, '0', 'PF'].includes(conta.tipo_conta)))
      setBuscaRealizada(true)
    } catch (falha) {
      setContas([]); setBuscaRealizada(true)
      setErroBusca(falha.status === 404 ? '' : falha.message)
    } finally { setBuscando(false) }
  }

  function selecionarConta(conta) {
    setContaSelecionada(conta)
    setNome(conta.nome || '')
    setCpf(mascaraCpf(conta.cpf || ''))
    setValidacao('')
    setErroBusca('')
  }

  return <div className="fundo-modal-identidade" onMouseDown={fecharAoClicarFora}>
    <section className="modal-identidade modal-folha" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="titulo-funcionario" tabIndex={-1} aria-busy={processando}>
      <p className="rotulo-secao">FUNCIONÁRIOS</p>
      <h2 id="titulo-funcionario">{funcionario ? 'Editar funcionário' : 'Adicionar funcionário'}</h2>
      <p>{funcionario ? 'Atualize os dados para as próximas folhas.' : 'Cadastre quem faz parte da sua equipe.'}</p>
      {!funcionario && <div className="busca-conta-funcionario">
        <div><strong>Encontrar conta PF Arkhé</strong><p>Busque como no Pix para preencher nome e CPF automaticamente.</p></div>
        <form onSubmit={buscarConta} className="busca-conta-funcionario-form">
          <label htmlFor="busca-conta-funcionario">Nome, CPF, e-mail ou telefone</label>
          <div><input id="busca-conta-funcionario" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Ex.: 529.982.247-25" disabled={processando || buscando} /><button className="botao botao-secundario" type="submit" disabled={processando || buscando}>{buscando ? 'Buscando...' : 'Buscar conta'}</button></div>
        </form>
        {buscaRealizada && contas.length === 0 && !validacao && <p className="conta-funcionario-nao-encontrada" role="status">Nenhuma conta PF encontrada. Preencha o cadastro manualmente abaixo.</p>}
        {erroBusca && <p className="mensagem-identidade erro" role="alert">{erroBusca}</p>}
        {contas.length > 0 && <div className="resultados-conta-funcionario" aria-label="Contas PF encontradas">{contas.map((conta) => <button type="button" key={conta.id_conta} className={contaSelecionada?.id_conta === conta.id_conta ? 'selecionada' : ''} onClick={() => selecionarConta(conta)}><span>{String(conta.nome || 'A').slice(0, 1).toUpperCase()}</span><div><strong>{conta.nome}</strong><small>{mascaraCpf(conta.cpf)} · {conta.banco || 'Banco Arkhé'}</small></div><b>{contaSelecionada?.id_conta === conta.id_conta ? 'Selecionada' : 'Usar conta'}</b></button>)}</div>}
      </div>}
      <form onSubmit={enviar}>
        <div className="campo-identidade"><label htmlFor="funcionario-nome">Nome completo</label><input id="funcionario-nome" value={nome} onChange={(e) => setNome(e.target.value)} required disabled={processando} autoComplete="name" /></div>
        {!funcionario && <div className="campo-identidade"><label htmlFor="funcionario-cpf">CPF</label><input id="funcionario-cpf" value={cpf} onChange={(e) => setCpf(mascaraCpf(e.target.value))} inputMode="numeric" maxLength={14} required disabled={processando} /></div>}
        <div className="campo-identidade"><label htmlFor="funcionario-salario">Salário mensal (R$)</label><input id="funcionario-salario" className="campo-moeda-funcionario" value={moedaDigitada(centavos)} onChange={(e) => setCentavos(centavosDeMoeda(e.target.value))} inputMode="numeric" required disabled={processando} aria-describedby="ajuda-salario" /><small id="ajuda-salario">O valor é formatado automaticamente em reais.</small></div>
        {!funcionario && <p className={`vinculo-conta-funcionario ${contaSelecionada ? 'encontrada' : ''}`}>{contaSelecionada ? `Conta PF Arkhé encontrada para ${contaSelecionada.nome}.` : 'Se não houver conta PF Arkhé, o funcionário será cadastrado e ficará pendente na folha até abrir uma conta.'}</p>}
        {(validacao || erro) && <p className="mensagem-identidade erro" role="alert">{validacao || erro}</p>}
        <div className="acoes-identidade">
          <button className="botao botao-secundario" type="button" onClick={fechar} disabled={processando}>Cancelar</button>
          <button className="botao botao-principal" type="submit" disabled={processando}>{processando ? 'Salvando...' : 'Salvar funcionário'}</button>
        </div>
      </form>
    </section>
  </div>
}
