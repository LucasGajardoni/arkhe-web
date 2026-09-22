import { useState } from 'react'
import { useModalAcessivel } from '../../hooks/useModalAcessivel.js'
import { convidarAcesso, reenviarConvite, verificarUsuarioParaAcesso } from '../../services/acessosService.js'
import { CARGOS, STATUS_ACESSO } from '../../utils/contas.js'
import { mascaraCpf, mascaraTelefone, somenteNumeros } from '../../utils/formatadores.js'
import { cpfValido, emailValido, nomeValido } from '../../utils/validadores.js'

export default function ConvidarPessoa({ fechar, aoConcluir, tratarErroSessao }) {
  const [cpf, setCpf] = useState('')
  const [consulta, setConsulta] = useState(null)
  const [dados, setDados] = useState({ nome: '', email: '', telefone: '', cargo: '0' })
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')
  const { modalRef, fecharAoClicarFora } = useModalAcessivel(fechar, processando)
  const status = consulta?.possui_vinculo ? Number(consulta.acesso?.status) : null
  const podeConvidar = consulta && !consulta.proprietario && (status === null || status === 3)
  const novoValido = nomeValido(dados.nome) && emailValido(dados.email) && [10, 11].includes(somenteNumeros(dados.telefone).length)

  async function consultar(evento) {
    evento.preventDefault()
    if (!cpfValido(cpf) || processando) return
    setProcessando(true); setErro('')
    try { setConsulta(await verificarUsuarioParaAcesso(cpf)) }
    catch (falha) { setErro(falha.message); tratarErroSessao(falha) }
    finally { setProcessando(false) }
  }
  async function enviar(evento, reenviar = false) {
    evento.preventDefault()
    if (processando || (!reenviar && (!podeConvidar || (!consulta.usuario_existente && !novoValido)))) return
    setProcessando(true); setErro('')
    try {
      const resultado = reenviar ? await reenviarConvite(consulta.acesso.id_acesso) : await convidarAcesso({
        cpf: somenteNumeros(cpf), cargo: Number(dados.cargo),
        ...(!consulta.usuario_existente ? { nome: dados.nome.trim(), email: dados.email.trim().toLowerCase(), telefone: somenteNumeros(dados.telefone) } : {}),
      })
      aoConcluir(resultado.usuario_novo
        ? 'O usuário foi criado sem conta própria e recebeu um PIN temporário por email.'
        : resultado.mensagem || 'Convite enviado com sucesso.')
    } catch (falha) { setErro(falha.message); tratarErroSessao(falha) }
    finally { setProcessando(false) }
  }
  function alterar({ target: { name, value } }) {
    setDados((atuais) => ({ ...atuais, [name]: name === 'telefone' ? mascaraTelefone(value) : value }))
  }
  return <div className="fundo-modal-identidade" onMouseDown={fecharAoClicarFora}>
    <section className="modal-identidade" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="titulo-convidar" tabIndex={-1}>
      <h2 id="titulo-convidar">Adicionar pessoa</h2>
      {!consulta ? <form onSubmit={consultar}>
        <p>Informe o CPF de quem poderá operar esta conta empresarial.</p>
        <label className="campo-identidade">CPF<input inputMode="numeric" value={cpf} onChange={(e) => setCpf(mascaraCpf(e.target.value))} disabled={processando} /></label>
        <button type="submit" className="botao botao-principal" disabled={processando || !cpfValido(cpf)}>{processando ? 'Verificando...' : 'Verificar CPF'}</button>
      </form> : <form onSubmit={enviar}>
        <p>CPF {cpf}</p>
        {consulta.proprietario ? <p role="status">{consulta.mensagem || 'Este CPF pertence ao proprietário da conta.'}</p> : <>
          {consulta.usuario_existente ? <div className="cartao-identidade"><strong>{consulta.usuario?.nome}</strong><p>{consulta.usuario?.email}</p><p>{mascaraTelefone(consulta.usuario?.telefone || '')}</p></div> : <>
            <p>Esta pessoa ainda não possui cadastro no Arkhé. Criaremos apenas sua identidade de acesso; nenhuma conta bancária será aberta.</p>
            <label className="campo-identidade">Nome<input name="nome" autoComplete="name" value={dados.nome} onChange={alterar} disabled={processando} required /></label>
            <label className="campo-identidade">Email<input name="email" type="email" autoComplete="email" value={dados.email} onChange={alterar} disabled={processando} required /></label>
            <label className="campo-identidade">Telefone<input name="telefone" inputMode="tel" autoComplete="tel" value={dados.telefone} onChange={alterar} disabled={processando} required /></label>
          </>}
          {status !== null && <p role="status">{status === 1 ? 'Esta pessoa já possui acesso.' : status === 2 ? 'Acesso bloqueado. Reative esta pessoa na lista da equipe.' : `Vínculo atual: ${STATUS_ACESSO[status]}.`}</p>}
          {status === 0 && <button type="button" className="botao botao-principal" disabled={processando} onClick={(e) => enviar(e, true)}>Reenviar convite</button>}
          {podeConvidar && <>
            <div className="campo-identidade"><label htmlFor="cargo-convite">Cargo</label><select id="cargo-convite" name="cargo" value={dados.cargo} onChange={alterar} disabled={processando}>{CARGOS.map((cargo, i) => <option key={cargo} value={i}>{cargo}</option>)}</select></div>
            <button type="submit" className="botao botao-principal" disabled={processando || (!consulta.usuario_existente && !novoValido)}>{processando ? 'Enviando...' : 'Enviar convite'}</button>
          </>}
        </>}
        <div className="acoes-identidade"><button type="button" className="botao botao-secundario" disabled={processando} onClick={() => { setConsulta(null); setErro('') }}>Alterar CPF</button></div>
      </form>}
      {erro && <p role="alert" className="mensagem-identidade erro">{erro}</p>}
      <div className="acoes-identidade"><button type="button" className="botao botao-secundario" disabled={processando} onClick={fechar}>Fechar</button></div>
    </section>
  </div>
}
