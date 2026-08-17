import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CadastroHeader from '../../components/CadastroHeader/CadastroHeader.jsx'
import ReconhecimentoFacial from '../../components/ReconhecimentoFacial/ReconhecimentoFacial.jsx'
import { API_URL, FACE_API_URL, FACE_CLIENT_ID, FACE_CLIENT_SECRET } from '../../App.jsx'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const [tipoConta, setTipoConta] = useState('')
  const [etapa, setEtapa] = useState(0)
  const [loginPF, setLoginPF] = useState({ cpf: '', senha: '' })
  const [loginPJ, setLoginPJ] = useState({ cnpj: '', senha: '', cpfResponsavel: '' })
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [recuperandoSenha, setRecuperandoSenha] = useState(false)
  const [etapaRecuperacao, setEtapaRecuperacao] = useState('email')
  const [dadosRecuperacao, setDadosRecuperacao] = useState({ email: '', codigo: '', novaSenha: '', confirmarSenha: '' })
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false)
  const [mensagemRecuperacao, setMensagemRecuperacao] = useState('')
  const [mensagemDemonstracao, setMensagemDemonstracao] = useState('')
  const [mensagemErro, setMensagemErro] = useState('')
  const [sessaoFacial, setSessaoFacial] = useState(null)

  function mascaraCpf(valor) {
    return valor.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  function mascaraCnpj(valor) {
    return valor.replace(/\D/g, '').slice(0, 14).replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2')
  }

  function alterarPF(evento) {
    const { name, value } = evento.target
    setLoginPF((dados) => ({ ...dados, [name]: name === 'cpf' ? mascaraCpf(value) : value }))
  }

  function alterarPJ(evento) {
    const { name, value } = evento.target
    const valor = name === 'cnpj' ? mascaraCnpj(value) : name === 'cpfResponsavel' ? mascaraCpf(value) : value
    setLoginPJ((dados) => ({ ...dados, [name]: valor }))
  }

  function alterarRecuperacao(evento) {
    const { name, value } = evento.target
    const valor = name === 'codigo' ? value.replace(/\D/g, '').slice(0, 6) : value
    setDadosRecuperacao((dados) => ({ ...dados, [name]: valor }))
    setMensagemRecuperacao('')
  }

  function voltarEtapa() {
    if (etapa === 0) {
      navigate('/')
      return
    }
    setEtapa((etapaAtual) => etapaAtual - 1)
  }

  function alterarTipoConta() {
    setTipoConta('')
    setEtapa(0)
    setLoginPF({ cpf: '', senha: '' })
    setLoginPJ({ cnpj: '', senha: '', cpfResponsavel: '' })
    setMostrarSenha(false)
    setMensagemErro('')
    setSessaoFacial(null)
  }

  async function criarSessaoFacial(cpf) {
    // A API aceita localizar a identidade pelo CPF, portanto este projeto não
    // precisa salvar o identity_id da API facial no banco principal.
    const resposta = await fetch(`${FACE_API_URL}/v1/verifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': FACE_CLIENT_ID,
        'X-Client-Secret': FACE_CLIENT_SECRET,
      },
      body: JSON.stringify({
        cpf: cpf.replace(/\D/g, ''),
        purpose: 'login',
        ttl_minutes: 10,
      }),
    })
    const resultado = await resposta.json()
    if (!resposta.ok) {
      const detalhe = resultado.detail?.message || resultado.detail
      throw new Error(typeof detalhe === 'string' ? detalhe : 'Não foi possível iniciar o reconhecimento facial.')
    }
    return resultado
  }

  async function autenticar(cpf, senha, cadastroFacial = false) {
    setProcessando(true)
    setMensagemErro('')
    try {
      const resposta = await fetch(`${API_URL}/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf: cpf.replace(/\D/g, ''),
          senha,
          cadastro_facial: cadastroFacial,
        }),
      })
      const resultado = await resposta.json()
      if (!resposta.ok) {
        // CPF ou senha inválidos pertencem à tela de credenciais. Isso é
        // importante no fluxo PJ, em que a validação acontece após informar
        // o CPF do responsável em uma etapa separada.
        if (resposta.status === 401) {
          setSessaoFacial(null)
          setEtapa(1)
        }
        setMensagemErro(resultado.mensagem || 'Não foi possível entrar na conta.')
        return
      }

      if (!cadastroFacial && resultado.reconhecimento_facial_pendente) {
        const novaSessao = await criarSessaoFacial(cpf)
        setSessaoFacial(novaSessao)
        setEtapa(tipoConta === 'PF' ? 2 : 3)
        return
      }

      localStorage.setItem('usuario', JSON.stringify(resultado.usuario))
      if (resultado.token) localStorage.setItem('token', resultado.token)
      setEtapa(tipoConta === 'PF' ? 3 : 4)
    } catch {
      setMensagemErro('Não foi possível conectar ao servidor.')
    } finally {
      setProcessando(false)
    }
  }

  function continuarCredenciais() {
    if (tipoConta === 'PF') autenticar(loginPF.cpf, loginPF.senha)
    else autenticar(loginPJ.cpfResponsavel, loginPJ.senha)
  }

  async function concluirReconhecimentoFacial() {
    // Segunda chamada ao Flask. Somente ela envia cadastro_facial=true e faz
    // o backend criar o cookie HttpOnly depois que o SDK encontrou o rosto.
    const cpf = tipoConta === 'PF' ? loginPF.cpf : loginPJ.cpfResponsavel
    const senha = tipoConta === 'PF' ? loginPF.senha : loginPJ.senha
    await autenticar(cpf, senha, true)
  }

  function solicitarRecuperacao(evento) {
    evento.preventDefault()
    if (etapaRecuperacao === 'email') {
      setEtapaRecuperacao('codigo')
      setMensagemRecuperacao('Enviamos um código de 6 dígitos para o e-mail informado. (Simulação)')
      return
    }
    if (etapaRecuperacao === 'codigo') {
      setEtapaRecuperacao('senha')
      setMensagemRecuperacao('Código confirmado. Agora crie uma nova senha.')
      return
    }
    setEtapaRecuperacao('sucesso')
    setMensagemRecuperacao('Sua senha foi alterada com sucesso. (Simulação)')
  }

  function fecharRecuperacao() {
    setRecuperandoSenha(false)
    setEtapaRecuperacao('email')
    setDadosRecuperacao({ email: '', codigo: '', novaSenha: '', confirmarSenha: '' })
    setMensagemRecuperacao('')
    setMostrarNovaSenha(false)
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
    const documentosPreenchidos = pessoaFisica
      ? Boolean(loginPF.cpf)
      : Boolean(loginPJ.cnpj && loginPJ.cpfResponsavel)
    return (
      <>
        <div className="cabecalho-login">
          <button className="alterar-tipo" type="button" onClick={alterarTipoConta}>{pessoaFisica ? 'Pessoa Física' : 'Pessoa Jurídica'} · Alterar</button>
          <h1>{pessoaFisica ? 'Entre na sua conta' : 'Acesse sua conta empresarial'}</h1><p>Informe seus dados de acesso.</p>
        </div>
        <label className="campo-login"><span>{pessoaFisica ? 'CPF' : 'CNPJ'}</span><input name={pessoaFisica ? 'cpf' : 'cnpj'} value={pessoaFisica ? loginPF.cpf : loginPJ.cnpj} onChange={pessoaFisica ? alterarPF : alterarPJ} inputMode="numeric" autoComplete="username" /></label>
        {!pessoaFisica && <label className="campo-login"><span>CPF do responsável</span><input name="cpfResponsavel" value={loginPJ.cpfResponsavel} onChange={alterarPJ} inputMode="numeric" autoComplete="username" /></label>}
        <label className="campo-login"><span>Senha</span><div className="entrada-senha-login"><input name="senha" type={mostrarSenha ? 'text' : 'password'} value={dados.senha} onChange={pessoaFisica ? alterarPF : alterarPJ} autoComplete="current-password" /><button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}>{mostrarSenha ? 'Ocultar' : 'Mostrar'}</button></div></label>
        <button className="esqueci-senha" type="button" onClick={() => setRecuperandoSenha(true)}>Esqueci minha senha</button>
        {mensagemErro && !sessaoFacial && <p className="mensagem-login">{mensagemErro}</p>}
        <div className="acoes-login"><button className="botao botao-secundario" type="button" onClick={voltarEtapa}>Voltar</button><button className="botao botao-principal" type="button" disabled={!documentosPreenchidos || !dados.senha || processando} onClick={continuarCredenciais}>{processando ? 'Validando...' : 'Continuar'}</button></div>
        <button className="link-novo-cliente" type="button" onClick={() => navigate(`/cadastro/${tipoConta.toLowerCase()}`)}>{pessoaFisica ? 'Ainda não sou cliente' : 'Abrir uma conta PJ'}</button>
      </>
    )
  }

  function reconhecimentoFacial() {
    return (
      <>
        <div className="cabecalho-login"><p className="rotulo-secao">RECONHECIMENTO FACIAL</p><h1>Confirme sua identidade</h1><p>Olhe para a câmera e siga as orientações do scanner.</p></div>
        {sessaoFacial && (
          <ReconhecimentoFacial
            modo="login"
            sessao={sessaoFacial}
            aoConcluir={concluirReconhecimentoFacial}
            aoErro={setMensagemErro}
          />
        )}
        {mensagemErro && !sessaoFacial && <p className="mensagem-login">{mensagemErro}</p>}
        {processando && <p className="mensagem-login">Criando sua sessão...</p>}
      </>
    )
  }

  function acessoFinalizado() {
    return (
      <div className="login-finalizado">
        <span className="icone-acesso">✓</span><p className="rotulo-secao">ACESSO CONFIRMADO</p><h1>Login realizado</h1><p>Você entrou na sua conta do Banco Arkhé.</p>
        <dl>
          <div><dt>Tipo de conta</dt><dd>{tipoConta === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</dd></div>
          <div><dt>{tipoConta === 'PF' ? 'Documento' : 'Empresa'}</dt><dd>{tipoConta === 'PF' ? loginPF.cpf : loginPJ.cnpj}</dd></div>
          {tipoConta === 'PJ' && <div><dt>Responsável</dt><dd>{loginPJ.cpfResponsavel}</dd></div>}
          <div><dt>Autenticação</dt><dd>Concluída</dd></div>
        </dl>
        {mensagemDemonstracao && <p className="mensagem-demonstracao">{mensagemDemonstracao}</p>}
        <div className="acoes-login"><button className="botao botao-secundario" type="button" onClick={() => navigate('/')}>Voltar para a Home</button><button className="botao botao-principal" type="button" onClick={() => setMensagemDemonstracao('O ambiente da conta será integrado em uma próxima etapa.')}>Entrar na demonstração</button></div>
      </div>
    )
  }

  function recuperacaoSenha() {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dadosRecuperacao.email)
    const codigoValido = dadosRecuperacao.codigo.length === 6
    const senhaValida = dadosRecuperacao.novaSenha.length >= 8
      && dadosRecuperacao.novaSenha === dadosRecuperacao.confirmarSenha
    const numeroEtapa = etapaRecuperacao === 'email' ? 1 : etapaRecuperacao === 'codigo' ? 2 : 3

    if (etapaRecuperacao === 'sucesso') return (
      <div className="login-finalizado recuperacao-finalizada">
        <span className="icone-acesso">✓</span>
        <p className="rotulo-secao">SENHA REDEFINIDA</p>
        <h1>Tudo certo!</h1>
        <p>Sua nova senha foi cadastrada. Você já pode voltar e acessar sua conta.</p>
        <p className="mensagem-login">{mensagemRecuperacao}</p>
        <button className="botao botao-principal botao-largo" type="button" onClick={fecharRecuperacao}>Voltar ao login</button>
      </div>
    )

    return (
      <>
        <div className="cabecalho-login">
          <p className="rotulo-secao">RECUPERAÇÃO DE SENHA</p>
          <h1>{etapaRecuperacao === 'email' ? 'Recupere seu acesso' : etapaRecuperacao === 'codigo' ? 'Digite o código' : 'Crie uma nova senha'}</h1>
          <p>{etapaRecuperacao === 'email' ? 'Informe o e-mail usado no cadastro.' : etapaRecuperacao === 'codigo' ? `Enviamos o código para ${dadosRecuperacao.email}.` : 'Escolha uma senha segura para sua conta.'}</p>
        </div>
        <div className="etapas-recuperacao" aria-label={`Etapa ${numeroEtapa} de 3`}><span className="ativa">1</span><i /><span className={numeroEtapa >= 2 ? 'ativa' : ''}>2</span><i /><span className={numeroEtapa >= 3 ? 'ativa' : ''}>3</span></div>
        <form onSubmit={solicitarRecuperacao}>
          {etapaRecuperacao === 'email' && <label className="campo-login"><span>E-mail</span><input name="email" type="email" value={dadosRecuperacao.email} onChange={alterarRecuperacao} placeholder="seuemail@exemplo.com" autoComplete="email" autoFocus /></label>}
          {etapaRecuperacao === 'codigo' && <label className="campo-login campo-codigo"><span>Código de verificação</span><input name="codigo" value={dadosRecuperacao.codigo} onChange={alterarRecuperacao} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" autoFocus /></label>}
          {etapaRecuperacao === 'senha' && <>
            <label className="campo-login"><span>Nova senha</span><div className="entrada-senha-login"><input name="novaSenha" type={mostrarNovaSenha ? 'text' : 'password'} value={dadosRecuperacao.novaSenha} onChange={alterarRecuperacao} autoComplete="new-password" autoFocus /><button type="button" onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}>{mostrarNovaSenha ? 'Ocultar' : 'Mostrar'}</button></div></label>
            <label className="campo-login"><span>Confirmar nova senha</span><input name="confirmarSenha" type={mostrarNovaSenha ? 'text' : 'password'} value={dadosRecuperacao.confirmarSenha} onChange={alterarRecuperacao} autoComplete="new-password" /></label>
            <small className="ajuda-senha">Use pelo menos 8 caracteres.</small>
            {dadosRecuperacao.confirmarSenha && dadosRecuperacao.novaSenha !== dadosRecuperacao.confirmarSenha && <p className="mensagem-erro-recuperacao">As senhas não coincidem.</p>}
          </>}
          {mensagemRecuperacao && <p className="mensagem-login">{mensagemRecuperacao}</p>}
          <button className="botao botao-principal botao-largo" type="submit" disabled={etapaRecuperacao === 'email' ? !emailValido : etapaRecuperacao === 'codigo' ? !codigoValido : !senhaValida}>{etapaRecuperacao === 'email' ? 'Enviar código' : etapaRecuperacao === 'codigo' ? 'Confirmar código' : 'Redefinir senha'}</button>
        </form>
        {etapaRecuperacao === 'codigo' && <button className="link-novo-cliente" type="button" onClick={() => setMensagemRecuperacao('Um novo código foi enviado. (Simulação)')}>Reenviar código</button>}
        <button className="link-novo-cliente" type="button" onClick={fecharRecuperacao}>Voltar ao login</button>
      </>
    )
  }

  let conteudo = escolhaTipo()
  if (recuperandoSenha) conteudo = recuperacaoSenha()
  else if (etapa === 1) conteudo = credenciais()
  else if ((tipoConta === 'PF' && etapa === 2) || (tipoConta === 'PJ' && etapa === 3)) conteudo = reconhecimentoFacial()
  else if ((tipoConta === 'PF' && etapa === 3) || (tipoConta === 'PJ' && etapa === 4)) conteudo = acessoFinalizado()

  return (
    <div className="pagina-login">
      <CadastroHeader voltarParaHome={() => navigate('/')} textoAviso="ACESSO SIMULADO" />
      <main className="conteudo area-login">
        <aside className="lateral-login"><p className="rotulo-secao">BANCO ARKHÉ</p><h2>Seu acesso, protegido em cada etapa.</h2><p>O Arkhé reúne credenciais e confirmação facial em uma experiência simples.</p><ul><li>Acesso PF e PJ</li><li>Confirmação facial</li><li>Controle de sessão</li><li>Proteção dos dados</li></ul><small>Recursos apresentados para fins acadêmicos. A autenticação real será integrada posteriormente.</small></aside>
        <section className="cartao-login">{conteudo}</section>
      </main>
    </div>
  )
}
