import './ModalTipoConta.css'

function EscolhaConta({ escolherTipo }) {
  return (
    <>
      <p className="rotulo-secao">ABERTURA DE CONTA</p>
      <h2 id="titulo-modal-conta">Qual conta você quer abrir?</h2>
      <p className="texto-modal-conta">Escolha uma opção para continuar seu cadastro.</p>
      <div className="opcoes-modal-conta">
        <button type="button" onClick={() => escolherTipo('PF')}>
          <span>PF</span>
          <div>
            <strong>Pessoa Física</strong>
            <small>Conta para sua vida financeira</small>
          </div>
          <b aria-hidden="true">→</b>
        </button>
        <button type="button" onClick={() => escolherTipo('PJ')}>
          <span>PJ</span>
          <div>
            <strong>Pessoa Jurídica</strong>
            <small>Conta para sua empresa</small>
          </div>
          <b aria-hidden="true">→</b>
        </button>
      </div>
    </>
  )
}

function VerificacaoCpf({ cpf, alterarCpf, continuar, mensagemErro, verificando }) {
  let textoBotao = 'Continuar'
  if (verificando) textoBotao = 'Verificando...'

  return (
    <>
      <p className="rotulo-secao">ABERTURA DE CONTA</p>
      <h2 id="titulo-modal-conta">Primeiro, informe seu CPF</h2>
      <p className="texto-modal-conta">
        Assim identificamos se este é seu primeiro cadastro ou se você já é cliente Arkhé.
      </p>
      <form className="formulario-cpf-conta" onSubmit={continuar}>
        <label>
          <span>CPF</span>
          <input
            name="cpf"
            value={cpf}
            onChange={alterarCpf}
            inputMode="numeric"
            autoComplete="username"
            placeholder="000.000.000-00"
            autoFocus
          />
        </label>
        {mensagemErro && <p className="erro-modal-conta" role="alert">{mensagemErro}</p>}
        <button className="botao botao-principal botao-cpf-conta" type="submit" disabled={verificando}>
          {textoBotao}
        </button>
      </form>
    </>
  )
}

function ClienteExistente({ autenticar }) {
  return (
    <>
      <p className="rotulo-secao">QUE BOM TER VOCÊ AQUI</p>
      <h2 id="titulo-modal-conta">Você já é cliente Arkhé</h2>
      <p className="texto-modal-conta">
        Para abrir o outro tipo de conta, entre primeiro na conta que você já possui.
      </p>
      <div className="cliente-existente-conta">
        <span aria-hidden="true">✓</span>
        <p>
          <strong>Seu cadastro será reaproveitado</strong>
          <small>Você não precisará informar novamente seus dados pessoais.</small>
        </p>
      </div>
      <button className="botao botao-principal botao-cpf-conta" type="button" onClick={autenticar}>
        Entrar e abrir outra conta
      </button>
    </>
  )
}

export default function ModalTipoConta({
  cpf,
  etapa,
  mensagemErro,
  verificando,
  fechar,
  voltar,
  alterarCpf,
  continuarComCpf,
  escolherTipo,
  autenticarClienteExistente,
}) {
  let conteudo = (
    <VerificacaoCpf
      cpf={cpf}
      alterarCpf={alterarCpf}
      continuar={continuarComCpf}
      mensagemErro={mensagemErro}
      verificando={verificando}
    />
  )

  if (etapa === 'tipo') conteudo = <EscolhaConta escolherTipo={escolherTipo} />
  if (etapa === 'existente') conteudo = <ClienteExistente autenticar={autenticarClienteExistente} />

  return (
    <div className="fundo-modal-conta" role="presentation" onMouseDown={fechar}>
      <section
        className="modal-tipo-conta"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-conta"
        onMouseDown={(evento) => evento.stopPropagation()}
      >
        <button className="fechar-modal-conta" type="button" aria-label="Fechar" onClick={fechar}>
          ×
        </button>
        {conteudo}
        {etapa !== 'cpf' && (
          <button className="voltar-modal-conta" type="button" onClick={voltar}>← Voltar</button>
        )}
        <p className="aviso-modal-conta">Ambiente acadêmico. Nenhuma conta bancária real será criada.</p>
      </section>
    </div>
  )
}
