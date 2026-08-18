import { useEffect, useState } from 'react'
import { mascaraCpf, mascaraTelefone } from '../../utils/formatadores.js'

export default function ModalPerfil({ usuario, fechar }) {
  const [dados, setDados] = useState(() => ({
    nome: usuario?.nome || '',
    email: usuario?.email || '',
    telefone: mascaraTelefone(usuario?.telefone || ''),
  }))

  useEffect(() => {
    function fecharComEsc(evento) { if (evento.key === 'Escape') fechar() }
    document.addEventListener('keydown', fecharComEsc)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', fecharComEsc); document.body.style.overflow = '' }
  }, [fechar])

  function alterar(evento) {
    const { name, value } = evento.target
    setDados((atuais) => ({ ...atuais, [name]: name === 'telefone' ? mascaraTelefone(value) : value }))
  }

  return <div className="fundo-modal-perfil" role="presentation" onMouseDown={(evento) => { if (evento.target === evento.currentTarget) fechar() }}>
    <section className="modal-perfil" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-perfil">
      <header><div><p>MINHA CONTA</p><h2 id="titulo-modal-perfil">Dados pessoais</h2><span>Confira e mantenha suas informações atualizadas.</span></div><button type="button" onClick={fechar} aria-label="Fechar modal">×</button></header>
      <div className="identidade-modal-perfil"><div>{usuario?.nome?.split(' ').slice(0, 2).map((nome) => nome[0]).join('') || 'AR'}</div><p><strong>{usuario?.nome}</strong><span>Cliente Arkhé · Conta pessoal</span></p></div>
      <form onSubmit={(evento) => evento.preventDefault()}>
        <label><span>Nome completo</span><input name="nome" value={dados.nome} onChange={alterar} autoComplete="name" /></label>
        <label><span>E-mail</span><input name="email" type="email" value={dados.email} onChange={alterar} autoComplete="email" /></label>
        <label><span>Telefone</span><input name="telefone" value={dados.telefone} onChange={alterar} inputMode="tel" autoComplete="tel" /></label>
        <label><span>CPF</span><input value={mascaraCpf(usuario?.cpf || '')} readOnly /><small>O CPF não pode ser alterado.</small></label>
        <div className="aviso-modal-perfil"><span>i</span><p>A edição já está preparada. O salvamento será liberado quando a rota do backend estiver concluída.</p></div>
        <footer><button className="botao botao-secundario" type="button" onClick={fechar}>Cancelar</button><button className="botao botao-principal" type="submit" disabled>Salvar alterações</button></footer>
      </form>
    </section>
  </div>
}
