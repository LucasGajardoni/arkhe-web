export default function EscolhaTipoConta({ abrindoOutraConta, tipoConta, escolher, continuar }) {
  let classePessoaFisica = ''
  let classePessoaJuridica = ''

  if (tipoConta === 'PF') classePessoaFisica = 'selecionado'
  if (tipoConta === 'PJ') classePessoaJuridica = 'selecionado'

  let rotulo = 'ACESSO À CONTA'
  let titulo = 'Acesse sua conta Arkhé'
  let descricao = 'Escolha o tipo de conta que deseja acessar.'

  if (abrindoOutraConta) {
    rotulo = 'CONFIRMAÇÃO DE IDENTIDADE'
    titulo = 'Qual conta você já possui?'
    descricao = 'Entre na conta atual. Depois, abriremos automaticamente o outro tipo para você.'
  }

  return (
    <>
      <div className="cabecalho-login">
        <p className="rotulo-secao">{rotulo}</p>
        <h1>{titulo}</h1>
        <p>{descricao}</p>
      </div>
      <div className="tipos-acesso">
        <button className={classePessoaFisica} type="button" onClick={() => escolher('PF')}>
          <span>PF</span>
          <strong>Conta Pessoa Física</strong>
        </button>
        <button className={classePessoaJuridica} type="button" onClick={() => escolher('PJ')}>
          <span>PJ</span>
          <strong>Conta Pessoa Jurídica</strong>
        </button>
      </div>
      <button className="botao botao-principal botao-largo" type="button" disabled={!tipoConta} onClick={continuar}>
        Continuar
      </button>
    </>
  )
}
