export default function CredenciaisLogin({ login }) {
  const {
    abrindoOutraConta,
    tipoConta,
    credenciais,
    credenciaisValidas,
    alterarCredencial,
    mostrarPin,
    setMostrarPin,
    mensagemErro,
    sessaoFacial,
    processando,
    alterarTipoConta,
    voltarEtapa,
    continuarCredenciais,
    navigate,
  } = login

  const pessoaFisica = tipoConta === 'PF'
  let tipoContaPorExtenso = 'Pessoa Jurídica'
  let titulo = 'Acesse sua conta empresarial'
  let tipoCampoPin = 'password'
  let textoMostrarPin = 'Mostrar'
  let textoContinuar = 'Continuar'

  if (pessoaFisica) {
    tipoContaPorExtenso = 'Pessoa Física'
    titulo = 'Entre na sua conta'
  }
  if (mostrarPin) {
    tipoCampoPin = 'text'
    textoMostrarPin = 'Ocultar'
  }
  if (processando) textoContinuar = 'Validando...'

  return (
    <>
      <div className="cabecalho-login">
        <button className="alterar-tipo" type="button" onClick={alterarTipoConta}>
          {tipoContaPorExtenso} · Alterar
        </button>
        <h1>{titulo}</h1>
        <p>Informe o CPF e o PIN desta conta.</p>
      </div>
      <label className="campo-login">
        <span>CPF</span>
        <input
          name="cpf"
          value={credenciais.cpf}
          onChange={alterarCredencial}
          inputMode="numeric"
          autoComplete="username"
          placeholder="000.000.000-00"
          readOnly={abrindoOutraConta}
        />
      </label>
      <label className="campo-login">
        <span>PIN da conta</span>
        <div className="entrada-pin-login">
          <input
            name="pin"
            type={tipoCampoPin}
            value={credenciais.pin}
            onChange={alterarCredencial}
            inputMode="numeric"
            autoComplete="current-password"
            maxLength={6}
            placeholder="6 dígitos"
          />
          <button type="button" onClick={() => setMostrarPin(!mostrarPin)}>
            {textoMostrarPin}
          </button>
        </div>
      </label>
      <p className="ajuda-pin-login">O PIN possui exatamente 6 dígitos e é específico desta conta.</p>
      {mensagemErro && !sessaoFacial && <p className="mensagem-login" role="alert">{mensagemErro}</p>}
      <div className="acoes-login">
        <button className="botao botao-secundario" type="button" onClick={voltarEtapa}>
          Voltar
        </button>
        <button
          className="botao botao-principal"
          type="button"
          disabled={!credenciaisValidas || processando}
          onClick={continuarCredenciais}
        >
          {textoContinuar}
        </button>
      </div>
      {!abrindoOutraConta && (
        <button className="link-novo-cliente" type="button" onClick={() => navigate('/cadastro')}>
          Ainda não sou cliente
        </button>
      )}
    </>
  )
}
