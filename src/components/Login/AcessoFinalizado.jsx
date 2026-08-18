export default function AcessoFinalizado({ login }) {
  const { tipoConta, loginPF, loginPJ, mensagemDemonstracao, setMensagemDemonstracao, navigate } = login
  return <div className="login-finalizado">
    <span className="icone-acesso">✓</span><p className="rotulo-secao">ACESSO CONFIRMADO</p><h1>Login realizado</h1><p>Você entrou na sua conta do Banco Arkhé.</p>
    <dl><div><dt>Tipo de conta</dt><dd>{tipoConta === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</dd></div><div><dt>{tipoConta === 'PF' ? 'Documento' : 'Empresa'}</dt><dd>{tipoConta === 'PF' ? loginPF.cpf : loginPJ.cnpj}</dd></div>{tipoConta === 'PJ' && <div><dt>Responsável</dt><dd>{loginPJ.cpfResponsavel}</dd></div>}<div><dt>Autenticação</dt><dd>Concluída</dd></div></dl>
    {mensagemDemonstracao && <p className="mensagem-demonstracao">{mensagemDemonstracao}</p>}
    <div className="acoes-login"><button className="botao botao-secundario" type="button" onClick={() => navigate('/')}>Voltar para a Home</button><button className="botao botao-principal" type="button" onClick={() => setMensagemDemonstracao('O ambiente da conta será integrado em uma próxima etapa.')}>Entrar na demonstração</button></div>
  </div>
}
