import { useState } from 'react'
import CadastroHeader from '../../components/CadastroHeader/CadastroHeader.jsx'
import CapturaFacial from '../../components/CapturaFacial/CapturaFacial.jsx'
import './Login.css'

function Login({ voltarParaHome, abrirCadastro }) {
  const [tipoConta, setTipoConta] = useState('')
  const [etapa, setEtapa] = useState(0)
  const [loginPF, setLoginPF] = useState({ cpf: '', senha: '', lembrarCpf: false })
  const [loginPJ, setLoginPJ] = useState({ cnpj: '', senha: '', cpfResponsavel: '' })
  const [capturaLogin, setCapturaLogin] = useState({ frontal: '' })
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [recuperandoSenha, setRecuperandoSenha] = useState(false)
  const [tipoRecuperacao, setTipoRecuperacao] = useState('PF')
  const [dadosRecuperacao, setDadosRecuperacao] = useState({ cpf: '', cnpj: '', cpfResponsavel: '', email: '' })
  const [mensagemRecuperacao, setMensagemRecuperacao] = useState('')
  const [mensagemDemonstracao, setMensagemDemonstracao] = useState('')

  function mascaraCpf(valor) {
    return valor.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  function mascaraCnpj(valor) {
    return valor.replace(/\D/g, '').slice(0, 14).replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2')
  }

  function alterarPF(evento) {
    const { name, value, type, checked } = evento.target
    setLoginPF((dados) => ({ ...dados, [name]: type === 'checkbox' ? checked : name === 'cpf' ? mascaraCpf(value) : value }))
  }

  function alterarPJ(evento) {
    const { name, value } = evento.target
    const valor = name === 'cnpj' ? mascaraCnpj(value) : name === 'cpfResponsavel' ? mascaraCpf(value) : value
    setLoginPJ((dados) => ({ ...dados, [name]: valor }))
  }

  function alterarRecuperacao(evento) {
    const { name, value } = evento.target
    const valor = name === 'cnpj' ? mascaraCnpj(value) : name.includes('cpf') || name.includes('Cpf') ? mascaraCpf(value) : value
    setDadosRecuperacao((dados) => ({ ...dados, [name]: valor }))
  }

  function voltarEtapa() {
    if (etapa === 0) {
      voltarParaHome()
      return
    }
    const etapaFacial = (tipoConta === 'PF' && etapa === 2) || (tipoConta === 'PJ' && etapa === 3)
    if (etapaFacial) setCapturaLogin({ frontal: '' })
    setEtapa((etapaAtual) => etapaAtual - 1)
  }

  function alterarTipoConta() {
    setTipoConta('')
    setEtapa(0)
    setLoginPF({ cpf: '', senha: '', lembrarCpf: false })
    setLoginPJ({ cnpj: '', senha: '', cpfResponsavel: '' })
    setCapturaLogin({ frontal: '' })
    setMostrarSenha(false)
  }

  function continuarCredenciais() {
    if (tipoConta === 'PF') setEtapa(2)
    else setEtapa(2)
  }

  function concluirConfirmacao() {
    if (!capturaLogin.frontal) return
    setProcessando(true)
    setTimeout(() => {
      setProcessando(false)
      setLoginPF((dados) => ({ ...dados, senha: '' }))
      setLoginPJ((dados) => ({ ...dados, senha: '' }))
      setEtapa(tipoConta === 'PF' ? 3 : 4)
    }, 800)
  }

  function solicitarRecuperacao(evento) {
    evento.preventDefault()
    setMensagemRecuperacao('A recuperação de senha será habilitada quando o backend estiver disponível.')
  }

  function escolhaTipo() {
    return (
      <>
        <div className="cabecalho-login"><p className="rotulo-secao">ACESSO À CONTA</p><h1>Acesse sua conta Arkhé</h1><p>Escolha o tipo de conta que deseja acessar.</p></div>
        <div className="tipos-acesso">
          <button className={tipoConta === 'PF' ? 'selecionado' : ''} type="button" onClick={() => setTipoConta('PF')}><span>PF</span><strong>Pessoa Física</strong></button>
          <button className={tipoConta === 'PJ' ? 'selecionado' : ''} type="button" onClick={() => setTipoConta('PJ')}><span>PJ</span><strong>Pessoa Jurídica</strong></button>
        </div>
        <button className="botao botao-principal botao-largo" type="button" disabled={!tipoConta} onClick={() => setEtapa(1)}>Continuar</button>
      </>
    )
  }

  function credenciais() {
    const pessoaFisica = tipoConta === 'PF'
    const dados = pessoaFisica ? loginPF : loginPJ
    const documentoPreenchido = pessoaFisica ? loginPF.cpf : loginPJ.cnpj
    return (
      <>
        <div className="cabecalho-login">
          <button className="alterar-tipo" type="button" onClick={alterarTipoConta}>{pessoaFisica ? 'Pessoa Física' : 'Pessoa Jurídica'} · Alterar</button>
          <h1>{pessoaFisica ? 'Entre na sua conta' : 'Acesse sua conta empresarial'}</h1><p>Informe seus dados de acesso.</p>
        </div>
        <label className="campo-login"><span>{pessoaFisica ? 'CPF' : 'CNPJ'}</span><input name={pessoaFisica ? 'cpf' : 'cnpj'} value={pessoaFisica ? loginPF.cpf : loginPJ.cnpj} onChange={pessoaFisica ? alterarPF : alterarPJ} inputMode="numeric" autoComplete="username" /></label>
        <label className="campo-login"><span>Senha</span><div className="entrada-senha-login"><input name="senha" type={mostrarSenha ? 'text' : 'password'} value={dados.senha} onChange={pessoaFisica ? alterarPF : alterarPJ} autoComplete="current-password" /><button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}>{mostrarSenha ? 'Ocultar' : 'Mostrar'}</button></div></label>
        {pessoaFisica && <label className="lembrar-documento"><input name="lembrarCpf" type="checkbox" checked={loginPF.lembrarCpf} onChange={alterarPF} /> Lembrar meu CPF neste dispositivo</label>}
        <button className="esqueci-senha" type="button" onClick={() => setRecuperandoSenha(true)}>Esqueci minha senha</button>
        <div className="acoes-login"><button className="botao botao-secundario" type="button" onClick={voltarEtapa}>Voltar</button><button className="botao botao-principal" type="button" disabled={!documentoPreenchido || !dados.senha} onClick={continuarCredenciais}>Continuar</button></div>
        <button className="link-novo-cliente" type="button" onClick={abrirCadastro}>{pessoaFisica ? 'Ainda não sou cliente' : 'Abrir uma conta PJ'}</button>
      </>
    )
  }

  function responsavelPJ() {
    return (
      <>
        <div className="cabecalho-login"><p className="rotulo-secao">CONTA EMPRESARIAL SELECIONADA</p><h1>Quem está acessando a conta?</h1><p>Informe o CPF do responsável autorizado.</p></div>
        <div className="empresa-selecionada"><span>CNPJ da empresa</span><strong>{loginPJ.cnpj}</strong></div>
        <label className="campo-login"><span>CPF do responsável</span><input name="cpfResponsavel" value={loginPJ.cpfResponsavel} onChange={alterarPJ} inputMode="numeric" /></label>
        <div className="acoes-login"><button className="botao botao-secundario" type="button" onClick={voltarEtapa}>Voltar</button><button className="botao botao-principal" type="button" disabled={!loginPJ.cpfResponsavel} onClick={() => setEtapa(3)}>Continuar</button></div>
      </>
    )
  }

  function confirmacaoFacial() {
    return (
      <>
        <div className="cabecalho-login"><p className="rotulo-secao">CONFIRMAÇÃO FACIAL</p><h1>{tipoConta === 'PF' ? 'Confirme que é você' : 'Confirme a identidade do responsável'}</h1><p>{tipoConta === 'PF' ? 'Faça uma captura frontal para simular a confirmação da sua identidade.' : 'A captura será utilizada para simular a identificação do responsável.'}</p></div>
        <CapturaFacial capturasFaciais={capturaLogin} setCapturasFaciais={setCapturaLogin} contaEmpresarial={tipoConta === 'PJ'} />
        <p className="aviso-facial-login">Esta é uma simulação acadêmica. Nenhuma validação biométrica real está sendo executada.</p>
        <div className="acoes-login"><button className="botao botao-secundario" type="button" onClick={voltarEtapa}>Voltar</button><button className="botao botao-principal" type="button" disabled={!capturaLogin.frontal || processando} onClick={concluirConfirmacao}>{processando ? 'Confirmando sua identidade...' : 'Continuar'}</button></div>
      </>
    )
  }

  function acessoFinalizado() {
    return (
      <div className="login-finalizado">
        <span className="icone-acesso">✓</span><p className="rotulo-secao">ACESSO SIMULADO</p><h1>Acesso confirmado</h1><p>Você concluiu o fluxo de acesso do Banco Arkhé.</p><small>Como este é um ambiente acadêmico, nenhuma autenticação bancária real foi realizada.</small>
        <dl>
          <div><dt>Tipo de conta</dt><dd>{tipoConta === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</dd></div>
          <div><dt>{tipoConta === 'PF' ? 'Documento' : 'Empresa'}</dt><dd>{tipoConta === 'PF' ? loginPF.cpf : loginPJ.cnpj}</dd></div>
          {tipoConta === 'PJ' && <div><dt>Responsável</dt><dd>{loginPJ.cpfResponsavel}</dd></div>}
          <div><dt>Captura facial</dt><dd>Concluída</dd></div><div><dt>Autenticação</dt><dd>Simulação finalizada</dd></div>
        </dl>
        {mensagemDemonstracao && <p className="mensagem-demonstracao">{mensagemDemonstracao}</p>}
        <div className="acoes-login"><button className="botao botao-secundario" type="button" onClick={voltarParaHome}>Voltar para a Home</button><button className="botao botao-principal" type="button" onClick={() => setMensagemDemonstracao('O ambiente da conta será integrado em uma próxima etapa.')}>Entrar na demonstração</button></div>
      </div>
    )
  }

  function recuperacaoSenha() {
    const pj = tipoRecuperacao === 'PJ'
    const valido = pj ? dadosRecuperacao.cnpj && dadosRecuperacao.cpfResponsavel && dadosRecuperacao.email : dadosRecuperacao.cpf && dadosRecuperacao.email
    return (
      <>
        <div className="cabecalho-login"><p className="rotulo-secao">RECUPERAÇÃO</p><h1>Recuperar acesso</h1><p>Informe os dados usados no cadastro.</p></div>
        <div className="abas-recuperacao"><button className={!pj ? 'selecionado' : ''} type="button" onClick={() => setTipoRecuperacao('PF')}>Pessoa Física</button><button className={pj ? 'selecionado' : ''} type="button" onClick={() => setTipoRecuperacao('PJ')}>Pessoa Jurídica</button></div>
        <form onSubmit={solicitarRecuperacao}>
          <label className="campo-login"><span>{pj ? 'CNPJ' : 'CPF'}</span><input name={pj ? 'cnpj' : 'cpf'} value={pj ? dadosRecuperacao.cnpj : dadosRecuperacao.cpf} onChange={alterarRecuperacao} inputMode="numeric" /></label>
          {pj && <label className="campo-login"><span>CPF do responsável</span><input name="cpfResponsavel" value={dadosRecuperacao.cpfResponsavel} onChange={alterarRecuperacao} inputMode="numeric" /></label>}
          <label className="campo-login"><span>{pj ? 'E-mail empresarial' : 'E-mail'}</span><input name="email" type="email" value={dadosRecuperacao.email} onChange={alterarRecuperacao} /></label>
          {mensagemRecuperacao && <p className="mensagem-login">{mensagemRecuperacao}</p>}
          <button className="botao botao-principal botao-largo" type="submit" disabled={!valido}>Solicitar recuperação</button>
        </form>
        <button className="link-novo-cliente" type="button" onClick={() => { setRecuperandoSenha(false); setMensagemRecuperacao('') }}>Voltar ao login</button>
      </>
    )
  }

  let conteudo = escolhaTipo()
  if (recuperandoSenha) conteudo = recuperacaoSenha()
  else if (etapa === 1) conteudo = credenciais()
  else if (tipoConta === 'PJ' && etapa === 2) conteudo = responsavelPJ()
  else if ((tipoConta === 'PF' && etapa === 2) || (tipoConta === 'PJ' && etapa === 3)) conteudo = confirmacaoFacial()
  else if ((tipoConta === 'PF' && etapa === 3) || (tipoConta === 'PJ' && etapa === 4)) conteudo = acessoFinalizado()

  return (
    <div className="pagina-login">
      <CadastroHeader voltarParaHome={voltarParaHome} textoAviso="ACESSO SIMULADO" />
      <main className="conteudo area-login">
        <aside className="lateral-login"><p className="rotulo-secao">BANCO ARKHÉ</p><h2>Seu acesso, protegido em cada etapa.</h2><p>O Arkhé reúne credenciais e confirmação facial em uma experiência simples.</p><ul><li>Acesso PF e PJ</li><li>Confirmação facial</li><li>Controle de sessão</li><li>Proteção dos dados</li></ul><small>Recursos apresentados para fins acadêmicos. A autenticação real será integrada posteriormente.</small></aside>
        <section className="cartao-login">{conteudo}</section>
      </main>
    </div>
  )
}

export default Login
