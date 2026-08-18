export default function CredenciaisLogin({ login }) {
  const { pessoaFisica, loginPF, loginPJ, dadosLogin, alterarPF, alterarPJ, mostrarSenha, setMostrarSenha, mensagemErro, sessaoFacial, processando, alterarTipoConta, setRecuperandoSenha, voltarEtapa, continuarCredenciais, navigate, tipoConta } = login
  const alterar = pessoaFisica ? alterarPF : alterarPJ
  const documentosPreenchidos = pessoaFisica ? Boolean(loginPF.cpf) : Boolean(loginPJ.cnpj && loginPJ.cpfResponsavel)

  return <>
    <div className="cabecalho-login"><button className="alterar-tipo" type="button" onClick={alterarTipoConta}>{pessoaFisica ? 'Pessoa Física' : 'Pessoa Jurídica'} · Alterar</button><h1>{pessoaFisica ? 'Entre na sua conta' : 'Acesse sua conta empresarial'}</h1><p>Informe seus dados de acesso.</p></div>
    <label className="campo-login"><span>{pessoaFisica ? 'CPF' : 'CNPJ'}</span><input name={pessoaFisica ? 'cpf' : 'cnpj'} value={pessoaFisica ? loginPF.cpf : loginPJ.cnpj} onChange={alterar} inputMode="numeric" autoComplete="username" /></label>
    {!pessoaFisica && <label className="campo-login"><span>CPF do responsável</span><input name="cpfResponsavel" value={loginPJ.cpfResponsavel} onChange={alterarPJ} inputMode="numeric" autoComplete="username" /></label>}
    <label className="campo-login"><span>Senha</span><div className="entrada-senha-login"><input name="senha" type={mostrarSenha ? 'text' : 'password'} value={dadosLogin.senha} onChange={alterar} autoComplete="current-password" /><button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}>{mostrarSenha ? 'Ocultar' : 'Mostrar'}</button></div></label>
    <button className="esqueci-senha" type="button" onClick={() => setRecuperandoSenha(true)}>Esqueci minha senha</button>
    {mensagemErro && !sessaoFacial && <p className="mensagem-login">{mensagemErro}</p>}
    <div className="acoes-login"><button className="botao botao-secundario" type="button" onClick={voltarEtapa}>Voltar</button><button className="botao botao-principal" type="button" disabled={!documentosPreenchidos || !dadosLogin.senha || processando} onClick={continuarCredenciais}>{processando ? 'Validando...' : 'Continuar'}</button></div>
    <button className="link-novo-cliente" type="button" onClick={() => navigate(`/cadastro/${tipoConta.toLowerCase()}`)}>{pessoaFisica ? 'Ainda não sou cliente' : 'Abrir uma conta PJ'}</button>
  </>
}
