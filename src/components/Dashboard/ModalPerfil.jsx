import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useModalAcessivel } from '../../hooks/useModalAcessivel.js'
import { editarUsuario } from '../../services/authService.js'
import { mascaraCpf, mascaraTelefone, somenteNumeros } from '../../utils/formatadores.js'
import { emailValido, nomeValido } from '../../utils/validadores.js'
import { rotuloConta } from '../../utils/contas.js'

export default function ModalPerfil({ usuario, fechar, aoAtualizar }) {
  const navigate = useNavigate()
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
  const { modalRef, fecharAoClicarFora } = useModalAcessivel(fechar, salvando)

  function alterar(evento) {
    const { name, value } = evento.target
    let novoValor = value
    if (name === 'telefone') novoValor = mascaraTelefone(value)

    setDados((atuais) => ({ ...atuais, [name]: novoValor }))
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
      aoAtualizar({
        ...usuarioAtualizado,
        usuario: resposta.usuario,
      })
      setMensagem(resposta.mensagem || 'Usuário atualizado com sucesso')
    } catch (falha) {
      setErro(falha.message || 'Não foi possível salvar as alterações.')
    } finally {
      setSalvando(false)
    }
  }

  let iniciais = 'AR'
  if (usuario?.nome) {
    iniciais = usuario.nome.split(' ').slice(0, 2).map((nome) => nome[0]).join('')
  }

  let textoSalvar = 'Salvar alterações'
  if (salvando) textoSalvar = 'Salvando...'
  const contextoConta = rotuloConta(usuario)
  const nomeConta = usuario?.tipoConta === 'PJ'
    ? usuario.nomeFantasia || usuario.razaoSocial || ''
    : ''

  return (
    <div className="fundo-modal-perfil" role="presentation" onMouseDown={fecharAoClicarFora}>
      <section ref={modalRef} className="modal-perfil modal-perfil-dados" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-perfil" tabIndex="-1">
        <header>
          <div>
            <p>MEU PERFIL</p>
            <h2 id="titulo-modal-perfil">Seus dados pessoais</h2>
            <span>Consulte e mantenha seus dados de acesso atualizados.</span>
          </div>
          <button type="button" disabled={salvando} onClick={fechar} aria-label="Fechar modal">×</button>
        </header>
        <div className="corpo-modal-perfil-dados">
          <div className="identidade-modal-perfil">
            <div>{iniciais}</div>
            <p>
              <strong>{usuario?.nome}</strong>
              <span>{contextoConta}</span>
              {nomeConta && <small>{nomeConta}</small>}
            </p>
          </div>
          <form onSubmit={salvar}>
            <div className="grade-campos-modal-perfil">
              <div className="campo-modal-perfil">
                <label htmlFor="nome-modal-perfil">Nome completo</label>
                <input id="nome-modal-perfil" name="nome" value={dados.nome} onChange={alterar} autoComplete="name" />
                {dados.nome && !nomeOk && (
                  <small className="erro-campo-modal-perfil">Use apenas letras e espaços.</small>
                )}
              </div>
              <div className="campo-modal-perfil">
                <label htmlFor="email-modal-perfil">E-mail</label>
                <input id="email-modal-perfil" name="email" type="email" value={dados.email} onChange={alterar} autoComplete="email" />
                {dados.email && !emailOk && (
                  <small className="erro-campo-modal-perfil">Informe um e-mail válido.</small>
                )}
              </div>
              <div className="campo-modal-perfil">
                <label htmlFor="telefone-modal-perfil">Telefone</label>
                <input id="telefone-modal-perfil" name="telefone" value={dados.telefone} onChange={alterar} inputMode="tel" autoComplete="tel" />
                {dados.telefone && !telefoneOk && (
                  <small className="erro-campo-modal-perfil">Informe um telefone com DDD.</small>
                )}
              </div>
              <div className="campo-modal-perfil">
                <label htmlFor="cpf-modal-perfil">CPF</label>
                <input id="cpf-modal-perfil" value={mascaraCpf(usuario?.cpf || '')} readOnly aria-describedby="aviso-cpf-perfil" />
                <small id="aviso-cpf-perfil">Seu CPF completo é apenas para consulta e não pode ser alterado.</small>
              </div>
            </div>
            {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}
            {mensagem && <p className="mensagem-modal-perfil sucesso" role="status">{mensagem}</p>}
            <footer className="rodape-modal-perfil-dados">
              <button className="trocar-conta-modal-perfil" type="button" disabled={salvando} onClick={() => { fechar(); navigate('/selecionar-conta') }}>
                Trocar conta
              </button>
              <div>
                <button className="botao botao-secundario" type="button" disabled={salvando} onClick={fechar}>Cancelar</button>
                <button className="botao botao-principal" type="submit" disabled={!podeSalvar}>
                  {textoSalvar}
                </button>
              </div>
            </footer>
          </form>
        </div>
      </section>
    </div>
  )
}
