import { useRecuperacaoPin } from '../../hooks/useRecuperacaoPin.js'

function CabecalhoRecuperacao({ etapa, titulo, descricao }) {
  return (
    <div className="cabecalho-login">
      <p className="rotulo-secao">RECUPERAÇÃO DE PIN · ETAPA {etapa + 1} DE 3</p>
      <h1>{titulo}</h1>
      <p>{descricao}</p>
    </div>
  )
}

function MensagensRecuperacao({ erro, mensagem }) {
  return (
    <>
      {erro && <p className="mensagem-login erro-recuperacao" role="alert">{erro}</p>}
      {mensagem && <p className="mensagem-login" role="status">{mensagem}</p>}
    </>
  )
}

export default function RecuperacaoPin({ aoCancelar, aoConcluir }) {
  const recuperacao = useRecuperacaoPin({ aoCancelar, aoConcluir })

  if (recuperacao.etapa === 0) {
    return (
      <form onSubmit={recuperacao.enviarCodigo}>
        <CabecalhoRecuperacao
          etapa={recuperacao.etapa}
          titulo="Recupere o acesso à sua conta"
          descricao="Informe o e-mail cadastrado para receber um código de verificação."
        />
        <label className="campo-login">
          <span>E-mail</span>
          <input
            name="email"
            type="email"
            value={recuperacao.email}
            onChange={recuperacao.alterarEmail}
            autoComplete="email"
            placeholder="cliente@email.com"
            autoFocus
          />
        </label>
        <MensagensRecuperacao erro={recuperacao.mensagemErro} mensagem={recuperacao.mensagemEtapa} />
        <div className="acoes-login">
          <button className="botao botao-secundario" type="button" onClick={recuperacao.voltar}>
            Voltar ao login
          </button>
          <button
            className="botao botao-principal"
            type="submit"
            disabled={!recuperacao.emailCorreto || recuperacao.processando}
          >
            {recuperacao.processando ? 'Enviando...' : 'Enviar código'}
          </button>
        </div>
      </form>
    )
  }

  if (recuperacao.etapa === 1) {
    return (
      <form onSubmit={recuperacao.validarCodigo}>
        <CabecalhoRecuperacao
          etapa={recuperacao.etapa}
          titulo="Digite o código recebido"
          descricao={`Enviamos um código de 6 dígitos para ${recuperacao.email.trim()}.`}
        />
        <label className="campo-login">
          <span>Código de verificação</span>
          <input
            name="codigo"
            value={recuperacao.codigo}
            onChange={recuperacao.alterarCodigo}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            autoFocus
          />
        </label>
        <p className="ajuda-pin-login">O código possui exatamente 6 dígitos.</p>
        <MensagensRecuperacao erro={recuperacao.mensagemErro} mensagem={recuperacao.mensagemEtapa} />
        <div className="acoes-login">
          <button className="botao botao-secundario" type="button" onClick={recuperacao.voltar}>
            Voltar
          </button>
          <button
            className="botao botao-principal"
            type="submit"
            disabled={!recuperacao.codigoCorreto || recuperacao.processando}
          >
            {recuperacao.processando ? 'Validando...' : 'Validar código'}
          </button>
        </div>
      </form>
    )
  }

  let classePessoaFisica = ''
  let classePessoaJuridica = ''
  if (recuperacao.tipoConta === 'PF') classePessoaFisica = 'selecionado'
  if (recuperacao.tipoConta === 'PJ') classePessoaJuridica = 'selecionado'

  const pinsDiferentes = recuperacao.confirmarPin && !recuperacao.pinsIguais

  return (
    <form onSubmit={recuperacao.salvarNovoPin}>
      <CabecalhoRecuperacao
        etapa={recuperacao.etapa}
        titulo="Crie seu novo PIN"
        descricao="Escolha a conta e defina um novo PIN de acesso."
      />
      <div className="tipos-acesso tipos-recuperacao" aria-label="Tipo de conta">
        <button
          className={classePessoaFisica}
          type="button"
          aria-pressed={recuperacao.tipoConta === 'PF'}
          onClick={() => recuperacao.escolherTipoConta('PF')}
        >
          <span>PF</span>
          <strong>Conta Pessoa Física</strong>
        </button>
        <button
          className={classePessoaJuridica}
          type="button"
          aria-pressed={recuperacao.tipoConta === 'PJ'}
          onClick={() => recuperacao.escolherTipoConta('PJ')}
        >
          <span>PJ</span>
          <strong>Conta Pessoa Jurídica</strong>
        </button>
      </div>
      <div className="grade-pins-recuperacao">
        <label className="campo-login">
          <span>Novo PIN</span>
          <input
            name="novoPin"
            type={recuperacao.mostrarPins ? 'text' : 'password'}
            value={recuperacao.novoPin}
            onChange={recuperacao.alterarPin}
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={6}
            placeholder="6 dígitos"
          />
        </label>
        <label className="campo-login">
          <span>Confirmar novo PIN</span>
          <input
            name="confirmarPin"
            type={recuperacao.mostrarPins ? 'text' : 'password'}
            value={recuperacao.confirmarPin}
            onChange={recuperacao.alterarPin}
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={6}
            placeholder="Repita o PIN"
          />
        </label>
      </div>
      <p className="ajuda-pin-login">O PIN deve possuir exatamente 6 dígitos.</p>
      {pinsDiferentes && <p className="erro-pin-recuperacao" role="alert">Os PINs não são iguais.</p>}
      <button
        className="alternar-pins-recuperacao"
        type="button"
        onClick={() => recuperacao.setMostrarPins(!recuperacao.mostrarPins)}
      >
        {recuperacao.mostrarPins ? 'Ocultar PINs' : 'Mostrar PINs'}
      </button>
      <MensagensRecuperacao erro={recuperacao.mensagemErro} mensagem={recuperacao.mensagemEtapa} />
      <div className="acoes-login">
        <button className="botao botao-secundario" type="button" onClick={recuperacao.voltar}>
          Voltar
        </button>
        <button
          className="botao botao-principal"
          type="submit"
          disabled={!recuperacao.tipoConta || !recuperacao.pinsCorretos || recuperacao.processando}
        >
          {recuperacao.processando ? 'Alterando...' : 'Alterar PIN'}
        </button>
      </div>
    </form>
  )
}
