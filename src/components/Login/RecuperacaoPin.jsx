import { useRecuperacaoPin } from '../../hooks/useRecuperacaoPin.js'

export default function RecuperacaoPin({ aoCancelar }) {
  const recuperacao = useRecuperacaoPin({ aoCancelar })

  return (
    <form onSubmit={recuperacao.enviarLink}>
      <div className="cabecalho-login">
        <p className="rotulo-secao">RECUPERAÇÃO DE PIN</p>
        <h1>Recupere seu PIN pessoal</h1>
        <p>Informe o e-mail cadastrado. Enviaremos um link seguro, válido por 15 minutos.</p>
      </div>

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

      <p className="ajuda-pin-login">Por segurança, a resposta é a mesma mesmo quando o e-mail não está cadastrado.</p>

      {recuperacao.mensagemErro && (
        <p className="mensagem-login erro-recuperacao" role="alert">{recuperacao.mensagemErro}</p>
      )}

      {recuperacao.mensagemEtapa && (
        <p className="mensagem-login" role="status">{recuperacao.mensagemEtapa}</p>
      )}

      <div className="acoes-login">
        <button className="botao botao-secundario" type="button" onClick={recuperacao.voltar}>
          Voltar ao login
        </button>
        <button
          className="botao botao-principal"
          type="submit"
          disabled={!recuperacao.emailCorreto || recuperacao.processando}
        >
          {recuperacao.processando ? 'Enviando...' : 'Enviar link seguro'}
        </button>
      </div>
    </form>
  )
}
