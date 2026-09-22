export default function CredenciaisLogin({ login }) {
  return <form onSubmit={login.continuarCredenciais}>
    <div className="cabecalho-login">
      <p className="rotulo-secao">SEU ACESSO ARKHÉ</p>
      <h1>Entre com seu acesso pessoal</h1>
      <p>Depois da confirmação facial, escolha a conta que deseja operar.</p>
    </div>
    <label className="campo-login">
      <span>CPF</span>
      <input name="cpf" value={login.credenciais.cpf} onChange={login.alterarCredencial}
        inputMode="numeric" autoComplete="username" placeholder="000.000.000-00" disabled={login.processando} />
    </label>
    <div className="campo-login">
      <label htmlFor="pin-pessoal-login">PIN pessoal</label>
      <div className="entrada-pin-login">
        <input id="pin-pessoal-login" name="pin" type={login.mostrarPin ? 'text' : 'password'} value={login.credenciais.pin}
          onChange={login.alterarCredencial} inputMode="numeric" autoComplete="current-password"
          maxLength={6} placeholder="6 dígitos" disabled={login.processando} />
        <button type="button" onClick={() => login.setMostrarPin(!login.mostrarPin)} aria-pressed={login.mostrarPin}>
          {login.mostrarPin ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
    </div>
    <div className="linha-ajuda-pin-login">
      <p className="ajuda-pin-login">Use o PIN pessoal de 6 dígitos do seu acesso Arkhé.</p>
      <button className="esqueci-pin-login" type="button" disabled={login.processando} onClick={login.abrirRecuperacaoPin}>Esqueci meu PIN</button>
    </div>
    {login.mensagemErro && <p className="mensagem-login" role="alert">{login.mensagemErro}</p>}
    {login.mensagemSucesso && <p className="mensagem-login" role="status">{login.mensagemSucesso}</p>}
    <div className="acoes-login">
      <button className="botao botao-secundario" type="button" disabled={login.processando} onClick={login.voltarEtapa}>Voltar</button>
      <button className="botao botao-principal" type="submit" disabled={!login.credenciaisValidas || login.processando}>
        {login.processando ? 'Validando...' : 'Continuar'}
      </button>
    </div>
    <button className="link-novo-cliente" type="button" disabled={login.processando} onClick={login.irParaCadastro}>Abrir minha conta</button>
  </form>
}
