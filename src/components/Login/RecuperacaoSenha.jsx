import RequisitosSenha from '../RequisitosSenha/RequisitosSenha.jsx'
import { emailValido, requisitosSenha } from '../../utils/validadores.js'

export default function RecuperacaoSenha({ login }) {
  const { etapaRecuperacao, dadosRecuperacao, alterarRecuperacao, mostrarNovaSenha, setMostrarNovaSenha, mensagemRecuperacao, processandoRecuperacao, solicitarRecuperacao, reenviarCodigo, fecharRecuperacao } = login
  if (etapaRecuperacao === 'sucesso') return <div className="login-finalizado recuperacao-finalizada"><span className="icone-acesso">✓</span><p className="rotulo-secao">SENHA REDEFINIDA</p><h1>Tudo certo!</h1><p>Sua nova senha foi cadastrada. Você já pode voltar e acessar sua conta.</p><p className="mensagem-login">{mensagemRecuperacao}</p><button className="botao botao-principal botao-largo" type="button" onClick={fecharRecuperacao}>Voltar ao login</button></div>

  const numeroEtapa = etapaRecuperacao === 'email' ? 1 : etapaRecuperacao === 'codigo' ? 2 : 3
  const requisitos = requisitosSenha({ senha: dadosRecuperacao.novaSenha, email: dadosRecuperacao.email })
  const novaSenhaValida = Object.values(requisitos).every(Boolean)
  const formularioValido = etapaRecuperacao === 'email' ? emailValido(dadosRecuperacao.email) : etapaRecuperacao === 'codigo' ? dadosRecuperacao.codigo.length === 6 : novaSenhaValida && dadosRecuperacao.novaSenha === dadosRecuperacao.confirmarSenha
  const titulo = etapaRecuperacao === 'email' ? 'Recupere seu acesso' : etapaRecuperacao === 'codigo' ? 'Digite o código' : 'Crie uma nova senha'
  const descricao = etapaRecuperacao === 'email' ? 'Informe o e-mail usado no cadastro.' : etapaRecuperacao === 'codigo' ? `Enviamos o código para ${dadosRecuperacao.email}.` : 'Escolha uma senha segura para sua conta.'

  return <>
    <div className="cabecalho-login"><p className="rotulo-secao">RECUPERAÇÃO DE SENHA</p><h1>{titulo}</h1><p>{descricao}</p></div>
    <div className="etapas-recuperacao" aria-label={`Etapa ${numeroEtapa} de 3`}><span className="ativa">1</span><i /><span className={numeroEtapa >= 2 ? 'ativa' : ''}>2</span><i /><span className={numeroEtapa >= 3 ? 'ativa' : ''}>3</span></div>
    <form onSubmit={solicitarRecuperacao}>
      {etapaRecuperacao === 'email' && <label className="campo-login"><span>E-mail</span><input name="email" type="email" value={dadosRecuperacao.email} onChange={alterarRecuperacao} placeholder="seuemail@exemplo.com" autoComplete="email" autoFocus /></label>}
      {etapaRecuperacao === 'codigo' && <label className="campo-login campo-codigo"><span>Código de verificação</span><input name="codigo" value={dadosRecuperacao.codigo} onChange={alterarRecuperacao} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" autoFocus /></label>}
      {etapaRecuperacao === 'senha' && <><label className="campo-login"><span>Nova senha</span><div className="entrada-senha-login"><input name="novaSenha" type={mostrarNovaSenha ? 'text' : 'password'} value={dadosRecuperacao.novaSenha} onChange={alterarRecuperacao} autoComplete="new-password" autoFocus /><button type="button" onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}>{mostrarNovaSenha ? 'Ocultar' : 'Mostrar'}</button></div></label><label className="campo-login"><span>Confirmar nova senha</span><input name="confirmarSenha" type={mostrarNovaSenha ? 'text' : 'password'} value={dadosRecuperacao.confirmarSenha} onChange={alterarRecuperacao} autoComplete="new-password" /></label><RequisitosSenha requisitos={requisitos} />{dadosRecuperacao.confirmarSenha && dadosRecuperacao.novaSenha !== dadosRecuperacao.confirmarSenha && <p className="mensagem-erro-recuperacao">As senhas não coincidem.</p>}</>}
      {mensagemRecuperacao && <p className="mensagem-login">{mensagemRecuperacao}</p>}
      <button className="botao botao-principal botao-largo" type="submit" disabled={!formularioValido || processandoRecuperacao}>{processandoRecuperacao ? 'Aguarde...' : etapaRecuperacao === 'email' ? 'Enviar código' : etapaRecuperacao === 'codigo' ? 'Confirmar código' : 'Redefinir senha'}</button>
    </form>
    {etapaRecuperacao === 'codigo' && <button className="link-novo-cliente" type="button" disabled={processandoRecuperacao} onClick={reenviarCodigo}>Reenviar código</button>}
    <button className="link-novo-cliente" type="button" onClick={fecharRecuperacao}>Voltar ao login</button>
  </>
}
