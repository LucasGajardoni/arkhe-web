import { useEffect, useState } from 'react'
import { editarUsuario } from '../../services/authService.js'
import { mascaraCpfParcial, mascaraTelefone, somenteNumeros } from '../../utils/formatadores.js'
import { emailValido, nomeValido } from '../../utils/validadores.js'

export default function ModalPerfil({ usuario, fechar, aoAtualizar }) {
  const [dados, setDados] = useState(() => ({
    nome: usuario?.nome || '',
    email: usuario?.email || '',
    telefone: mascaraTelefone(usuario?.telefone || ''),
  }))
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  const nomeOk = nomeValido(dados.nome)
  const emailOk = emailValido(dados.email)
  const telefoneOk = [10, 11].includes(somenteNumeros(dados.telefone).length)
  const alterado = dados.nome.trim() !== String(usuario?.nome || '').trim()
    || dados.email.trim().toLowerCase() !== String(usuario?.email || '').trim().toLowerCase()
    || somenteNumeros(dados.telefone) !== somenteNumeros(usuario?.telefone)
  const podeSalvar = nomeOk && emailOk && telefoneOk && alterado && !salvando

  useEffect(() => {
    function fecharComEsc(evento) { if (evento.key === 'Escape') fechar() }
    document.addEventListener('keydown', fecharComEsc)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', fecharComEsc); document.body.style.overflow = '' }
  }, [fechar])

  function alterar(evento) {
    const { name, value } = evento.target
    setDados((atuais) => ({ ...atuais, [name]: name === 'telefone' ? mascaraTelefone(value) : value }))
    setMensagem('')
    setErro('')
  }

  async function salvar(evento) {
    evento.preventDefault()
    if (!podeSalvar) return

    setSalvando(true)
    setErro('')
    setMensagem('')

    try {
      const resposta = await editarUsuario({
        idUsuario: usuario.id_usuario,
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        cpf: usuario.cpf,
      })
      const usuarioAtualizado = {
        ...usuario,
        nome: dados.nome.trim(),
        email: dados.email.trim().toLowerCase(),
        telefone: somenteNumeros(dados.telefone),
      }
      localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado))
      aoAtualizar(usuarioAtualizado)
      setMensagem(resposta.mensagem || 'Usuário atualizado com sucesso')
    } catch (falha) {
      setErro(falha.message || 'Não foi possível salvar as alterações.')
    } finally {
      setSalvando(false)
    }
  }

  return <div className="fundo-modal-perfil" role="presentation" onMouseDown={(evento) => { if (evento.target === evento.currentTarget) fechar() }}>
    <section className="modal-perfil" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-perfil">
      <header><div><p>MINHA CONTA</p><h2 id="titulo-modal-perfil">Dados pessoais</h2><span>Confira e mantenha suas informações atualizadas.</span></div><button type="button" onClick={fechar} aria-label="Fechar modal">×</button></header>
      <div className="identidade-modal-perfil"><div>{usuario?.nome?.split(' ').slice(0, 2).map((nome) => nome[0]).join('') || 'AR'}</div><p><strong>{usuario?.nome}</strong><span>Cliente Arkhé · Conta pessoal</span></p></div>
      <form onSubmit={salvar}>
        <label><span>Nome completo</span><input name="nome" value={dados.nome} onChange={alterar} autoComplete="name" />{dados.nome && !nomeOk && <small className="erro-campo-modal-perfil">Use apenas letras e espaços.</small>}</label>
        <label><span>E-mail</span><input name="email" type="email" value={dados.email} onChange={alterar} autoComplete="email" />{dados.email && !emailOk && <small className="erro-campo-modal-perfil">Informe um e-mail válido.</small>}</label>
        <label><span>Telefone</span><input name="telefone" value={dados.telefone} onChange={alterar} inputMode="tel" autoComplete="tel" />{dados.telefone && !telefoneOk && <small className="erro-campo-modal-perfil">Informe um telefone com DDD.</small>}</label>
        <label><span>CPF</span><input value={mascaraCpfParcial(usuario?.cpf || '')} readOnly /><small>O CPF não pode ser alterado.</small></label>
        {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}
        {mensagem && <p className="mensagem-modal-perfil sucesso" role="status">{mensagem}</p>}
        <footer><button className="botao botao-secundario" type="button" onClick={fechar}>Cancelar</button><button className="botao botao-principal" type="submit" disabled={!podeSalvar}>{salvando ? 'Salvando...' : 'Salvar alterações'}</button></footer>
      </form>
    </section>
  </div>
}
