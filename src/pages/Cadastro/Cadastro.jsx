import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CadastroHeader from '../../components/CadastroHeader/CadastroHeader.jsx'
import IndicadorEtapas from '../../components/IndicadorEtapas/IndicadorEtapas.jsx'
import CapturaFacial from '../../components/CapturaFacial/CapturaFacial.jsx'
import './Cadastro.css'

const etapasPF = ['Dados pessoais', 'Contato', 'Endereço', 'Acesso', 'Foto facial', 'Revisão']
const etapasPJ = ['Dados da empresa', 'Responsável', 'Contato', 'Endereço', 'Acesso', 'Foto facial', 'Revisão']

const dadosIniciaisPF = {
  nome: '', cpf: '', dataNascimento: '', nomeMae: '', nomePai: '', email: '', confirmarEmail: '', telefone: '',
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', senha: '', confirmarSenha: '',
  aceitarTermos: false, aceitarDados: false, aceitarBiometria: false,
}

const dadosIniciaisPJ = {
  cnpj: '', razaoSocial: '', nomeFantasia: '', dataAbertura: '', tipoJuridico: '', atividadePrincipal: '',
  nomeResponsavel: '', cpfResponsavel: '', dataNascimentoResponsavel: '', nomeMaeResponsavel: '', nomePaiResponsavel: '', cargoResponsavel: '',
  emailEmpresarial: '', confirmarEmailEmpresarial: '', telefoneEmpresarial: '', cep: '', logradouro: '', numero: '', complemento: '',
  bairro: '', cidade: '', estado: '', senha: '', confirmarSenha: '', aceitarTermos: false, aceitarDadosPessoais: false,
  aceitarDadosEmpresariais: false, aceitarBiometria: false,
}

function Campo({ nome, rotulo, valor, alterar, tipo = 'text', obrigatorio = true, opcional = false, autocomplete, erro, opcoes }) {
  return (
    <label className="campo-formulario">
      <span>{rotulo} {opcional && <small>(opcional)</small>}</span>
      {opcoes ? (
        <select name={nome} value={valor} onChange={alterar} required={obrigatorio}>
          <option value="">Selecione</option>
          {opcoes.map((opcao) => <option value={opcao} key={opcao}>{opcao}</option>)}
        </select>
      ) : (
        <input name={nome} type={tipo} value={valor} onChange={alterar} required={obrigatorio} autoComplete={autocomplete} />
      )}
      {erro && <small className="erro-campo">{erro}</small>}
    </label>
  )
}

export default function Cadastro({ tipoConta }) {
  const navigate = useNavigate()
  const [etapaAtual, setEtapaAtual] = useState(0)
  const [dadosPF, setDadosPF] = useState(dadosIniciaisPF)
  const [dadosPJ, setDadosPJ] = useState(dadosIniciaisPJ)
  const [capturasFaciais, setCapturasFaciais] = useState({ frontal: '' })
  const [mensagemErro, setMensagemErro] = useState('')
  const [consultandoCep, setConsultandoCep] = useState(false)
  const [mensagemCep, setMensagemCep] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const etapas = tipoConta === 'PJ' ? etapasPJ : etapasPF
  const dadosAtuais = tipoConta === 'PJ' ? dadosPJ : dadosPF
  const setDadosAtuais = tipoConta === 'PJ' ? setDadosPJ : setDadosPF

  function aplicarMascaraDocumento(valor, tamanho) {
    const numeros = valor.replace(/\D/g, '').slice(0, tamanho)
    if (tamanho === 11) return numeros.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    return numeros.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2')
  }

  function aplicarMascaraTelefone(valor) {
    return valor.replace(/\D/g, '').slice(0, 11).replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
  }

  function aplicarMascaraCep(valor) {
    return valor.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')
  }

  function alterarDados(evento) {
    const { name, value, type, checked } = evento.target
    let novoValor = type === 'checkbox' ? checked : value
    if (name === 'cpf' || name === 'cpfResponsavel') novoValor = aplicarMascaraDocumento(value, 11)
    if (name === 'cnpj') novoValor = aplicarMascaraDocumento(value, 14)
    if (name === 'telefone' || name === 'telefoneEmpresarial') novoValor = aplicarMascaraTelefone(value)
    if (name === 'cep') {
      novoValor = aplicarMascaraCep(value)
      if (novoValor.replace(/\D/g, '').length === 8) consultarCep(novoValor)
    }
    setDadosAtuais((dados) => ({ ...dados, [name]: novoValor }))
    setMensagemErro('')
  }

  async function consultarCep(cep) {
    setConsultandoCep(true)
    setMensagemCep('')
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`)
      if (!resposta.ok) throw new Error()
      const endereco = await resposta.json()
      if (endereco.erro) {
        setMensagemCep('CEP não encontrado. Preencha o endereço manualmente.')
        return
      }
      setDadosAtuais((dados) => ({
        ...dados,
        logradouro: dados.logradouro || endereco.logradouro || '',
        bairro: dados.bairro || endereco.bairro || '',
        cidade: dados.cidade || endereco.localidade || '',
        estado: dados.estado || endereco.uf || '',
      }))
    } catch {
      setMensagemCep('Não foi possível consultar o CEP. Preencha o endereço manualmente.')
    } finally {
      setConsultandoCep(false)
    }
  }

  function camposPreenchidos(campos) {
    return campos.every((campo) => String(dadosAtuais[campo] || '').trim())
  }

  function maiorDeIdade(dataNascimento) {
    if (!dataNascimento) return false
    const nascimento = new Date(`${dataNascimento}T00:00:00`)
    const hoje = new Date()
    let idade = hoje.getFullYear() - nascimento.getFullYear()
    const aniversarioAindaNaoChegou = hoje.getMonth() < nascimento.getMonth()
      || (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate())
    if (aniversarioAindaNaoChegou) idade -= 1
    return idade >= 18
  }

  function validarEtapa() {
    if (tipoConta === 'PF') {
      if (etapaAtual === 0) return camposPreenchidos(['nome', 'cpf', 'dataNascimento', 'nomeMae']) && maiorDeIdade(dadosPF.dataNascimento)
      if (etapaAtual === 1) return camposPreenchidos(['email', 'confirmarEmail', 'telefone']) && dadosPF.email === dadosPF.confirmarEmail
      if (etapaAtual === 2) return camposPreenchidos(['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'])
      if (etapaAtual === 3) return camposPreenchidos(['senha', 'confirmarSenha']) && dadosPF.senha === dadosPF.confirmarSenha && dadosPF.aceitarTermos && dadosPF.aceitarDados && dadosPF.aceitarBiometria
      if (etapaAtual === 4) return Boolean(capturasFaciais.frontal)
    } else {
      if (etapaAtual === 0) return camposPreenchidos(['cnpj', 'razaoSocial', 'nomeFantasia', 'dataAbertura', 'tipoJuridico', 'atividadePrincipal'])
      if (etapaAtual === 1) return camposPreenchidos(['nomeResponsavel', 'cpfResponsavel', 'dataNascimentoResponsavel', 'nomeMaeResponsavel', 'cargoResponsavel']) && maiorDeIdade(dadosPJ.dataNascimentoResponsavel)
      if (etapaAtual === 2) return camposPreenchidos(['emailEmpresarial', 'confirmarEmailEmpresarial', 'telefoneEmpresarial']) && dadosPJ.emailEmpresarial === dadosPJ.confirmarEmailEmpresarial
      if (etapaAtual === 3) return camposPreenchidos(['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'])
      if (etapaAtual === 4) return camposPreenchidos(['senha', 'confirmarSenha']) && dadosPJ.senha === dadosPJ.confirmarSenha && dadosPJ.aceitarTermos && dadosPJ.aceitarDadosPessoais && dadosPJ.aceitarDadosEmpresariais && dadosPJ.aceitarBiometria
      if (etapaAtual === 5) return Boolean(capturasFaciais.frontal)
    }
    return true
  }

  function mensagemValidacao() {
    const etapaContato = (tipoConta === 'PF' && etapaAtual === 1) || (tipoConta === 'PJ' && etapaAtual === 2)
    const etapaAcesso = (tipoConta === 'PF' && etapaAtual === 3) || (tipoConta === 'PJ' && etapaAtual === 4)
    const etapaFacial = (tipoConta === 'PF' && etapaAtual === 4) || (tipoConta === 'PJ' && etapaAtual === 5)
    if (etapaContato) return 'Os e-mails informados precisam ser iguais.'
    if (etapaAcesso) return 'As senhas precisam ser iguais e todos os consentimentos devem ser aceitos.'
    if (etapaFacial) return 'Capture a foto facial para continuar.'
    return 'Preencha todos os campos obrigatórios.'
  }

  function avancar() {
    if (!validarEtapa()) {
      setMensagemErro(mensagemValidacao())
      return
    }
    setMensagemErro('')
    setEtapaAtual((etapa) => etapa + 1)
    window.scrollTo(0, 0)
  }

  function voltar() {
    setMensagemErro('')
    if (etapaAtual === 0) {
      navigate('/cadastro')
    } else {
      setEtapaAtual((etapa) => etapa - 1)
    }
    window.scrollTo(0, 0)
  }

  function enviarCadastro() {
    setEnviando(true)
    setTimeout(() => {
      setEnviando(false)
      navigate('/login')
    }, 900)
  }

  function formularioEndereco() {
    return (
      <div className="grade-formulario">
        <Campo nome="cep" rotulo="CEP" valor={dadosAtuais.cep} alterar={alterarDados} autocomplete="postal-code" />
        <div className="status-cep">{consultandoCep ? 'Consultando CEP...' : mensagemCep}</div>
        <Campo nome="logradouro" rotulo="Logradouro" valor={dadosAtuais.logradouro} alterar={alterarDados} autocomplete="street-address" />
        <Campo nome="numero" rotulo="Número" valor={dadosAtuais.numero} alterar={alterarDados} />
        <Campo nome="complemento" rotulo="Complemento" valor={dadosAtuais.complemento} alterar={alterarDados} obrigatorio={false} opcional />
        <Campo nome="bairro" rotulo="Bairro" valor={dadosAtuais.bairro} alterar={alterarDados} />
        <Campo nome="cidade" rotulo="Cidade" valor={dadosAtuais.cidade} alterar={alterarDados} autocomplete="address-level2" />
        <Campo nome="estado" rotulo="Estado" valor={dadosAtuais.estado} alterar={alterarDados} autocomplete="address-level1" />
      </div>
    )
  }

  function formularioAcesso() {
    const empresarial = tipoConta === 'PJ'
    return (
      <>
        <div className="grade-formulario">
          <Campo nome="senha" rotulo="Senha" valor={dadosAtuais.senha} alterar={alterarDados} tipo={mostrarSenha ? 'text' : 'password'} autocomplete="new-password" />
          <Campo nome="confirmarSenha" rotulo="Confirmar senha" valor={dadosAtuais.confirmarSenha} alterar={alterarDados} tipo={mostrarSenha ? 'text' : 'password'} autocomplete="new-password" erro={dadosAtuais.confirmarSenha && dadosAtuais.senha !== dadosAtuais.confirmarSenha ? 'As senhas não são iguais.' : ''} />
        </div>
        <button className="mostrar-senha" type="button" onClick={() => setMostrarSenha(!mostrarSenha)}>{mostrarSenha ? 'Ocultar senhas' : 'Mostrar senhas'}</button>
        <div className="consentimentos">
          <label><input name="aceitarTermos" type="checkbox" checked={dadosAtuais.aceitarTermos} onChange={alterarDados} /> Li e aceito os termos de uso do projeto acadêmico.</label>
          {empresarial ? (
            <>
              <label><input name="aceitarDadosPessoais" type="checkbox" checked={dadosPJ.aceitarDadosPessoais} onChange={alterarDados} /> Autorizo o tratamento dos dados pessoais nesta simulação.</label>
              <label><input name="aceitarDadosEmpresariais" type="checkbox" checked={dadosPJ.aceitarDadosEmpresariais} onChange={alterarDados} /> Autorizo o tratamento dos dados empresariais nesta simulação.</label>
            </>
          ) : <label><input name="aceitarDados" type="checkbox" checked={dadosPF.aceitarDados} onChange={alterarDados} /> Autorizo o tratamento dos meus dados pessoais para esta simulação.</label>}
          <label><input name="aceitarBiometria" type="checkbox" checked={dadosAtuais.aceitarBiometria} onChange={alterarDados} /> Autorizo a captura e o uso da imagem facial nesta simulação acadêmica.</label>
        </div>
        <p className="aviso-simulacao">Este projeto é acadêmico e não representa uma instituição financeira real.</p>
      </>
    )
  }

  function blocoRevisao(titulo, itens, editar) {
    return (
      <section className="bloco-revisao">
        <div className="topo-revisao"><h3>{titulo}</h3><button type="button" onClick={editar}>Editar</button></div>
        <dl>{itens.filter((item) => item[1]).map(([nome, valor]) => <div key={nome}><dt>{nome}</dt><dd>{valor}</dd></div>)}</dl>
      </section>
    )
  }

  function revisaoCadastro() {
    const empresarial = tipoConta === 'PJ'
    return (
      <div className="revisao-cadastro">
        {empresarial && blocoRevisao('Dados da empresa', [['CNPJ', dadosPJ.cnpj], ['Razão social', dadosPJ.razaoSocial], ['Nome fantasia', dadosPJ.nomeFantasia], ['Data de abertura', dadosPJ.dataAbertura], ['Tipo jurídico', dadosPJ.tipoJuridico], ['Atividade', dadosPJ.atividadePrincipal]], () => setEtapaAtual(0))}
        {blocoRevisao(empresarial ? 'Responsável' : 'Dados pessoais', empresarial
          ? [['Nome', dadosPJ.nomeResponsavel], ['CPF', dadosPJ.cpfResponsavel], ['Nascimento', dadosPJ.dataNascimentoResponsavel], ['Nome da mãe', dadosPJ.nomeMaeResponsavel], ['Nome do pai', dadosPJ.nomePaiResponsavel], ['Cargo', dadosPJ.cargoResponsavel]]
          : [['Nome', dadosPF.nome], ['CPF', dadosPF.cpf], ['Nascimento', dadosPF.dataNascimento], ['Nome da mãe', dadosPF.nomeMae], ['Nome do pai', dadosPF.nomePai]], () => setEtapaAtual(empresarial ? 1 : 0))}
        {blocoRevisao('Contato', empresarial
          ? [['E-mail', dadosPJ.emailEmpresarial], ['Telefone', dadosPJ.telefoneEmpresarial]]
          : [['E-mail', dadosPF.email], ['Telefone', dadosPF.telefone]], () => setEtapaAtual(empresarial ? 2 : 1))}
        {blocoRevisao('Endereço', [['CEP', dadosAtuais.cep], ['Logradouro', `${dadosAtuais.logradouro}, ${dadosAtuais.numero}`], ['Complemento', dadosAtuais.complemento], ['Bairro', dadosAtuais.bairro], ['Cidade/Estado', `${dadosAtuais.cidade} - ${dadosAtuais.estado}`]], () => setEtapaAtual(empresarial ? 3 : 2))}
        {blocoRevisao('Acesso', [['Status', 'Senha de acesso criada']], () => setEtapaAtual(empresarial ? 4 : 3))}
        <section className="bloco-revisao">
          <div className="topo-revisao"><h3>Biometria</h3><button type="button" onClick={() => setEtapaAtual(empresarial ? 5 : 4)}>Refazer</button></div>
          <p>Foto facial concluída</p>
          <div className="miniaturas-revisao">{Object.entries(capturasFaciais).map(([nome, imagem]) => <figure key={nome}><img src={imagem} alt={`Captura ${nome}`} /><figcaption>{nome}</figcaption></figure>)}</div>
        </section>
      </div>
    )
  }

  function conteudoEtapa() {
    const empresarial = tipoConta === 'PJ'
    if ((!empresarial && etapaAtual === 0) || (empresarial && etapaAtual === 0)) {
      return empresarial ? <div className="grade-formulario">
        <Campo nome="cnpj" rotulo="CNPJ" valor={dadosPJ.cnpj} alterar={alterarDados} />
        <Campo nome="razaoSocial" rotulo="Razão social" valor={dadosPJ.razaoSocial} alterar={alterarDados} />
        <Campo nome="nomeFantasia" rotulo="Nome fantasia" valor={dadosPJ.nomeFantasia} alterar={alterarDados} />
        <Campo nome="dataAbertura" rotulo="Data de abertura" valor={dadosPJ.dataAbertura} alterar={alterarDados} tipo="date" />
        <Campo nome="tipoJuridico" rotulo="Tipo jurídico" valor={dadosPJ.tipoJuridico} alterar={alterarDados} opcoes={['MEI', 'Empresário Individual', 'Sociedade Limitada', 'Sociedade Anônima', 'Outro']} />
        <Campo nome="atividadePrincipal" rotulo="Atividade principal" valor={dadosPJ.atividadePrincipal} alterar={alterarDados} />
      </div> : <div className="grade-formulario">
        <Campo nome="nome" rotulo="Nome completo" valor={dadosPF.nome} alterar={alterarDados} autocomplete="name" />
        <Campo nome="cpf" rotulo="CPF" valor={dadosPF.cpf} alterar={alterarDados} />
        <Campo nome="dataNascimento" rotulo="Data de nascimento" valor={dadosPF.dataNascimento} alterar={alterarDados} tipo="date" erro={dadosPF.dataNascimento && !maiorDeIdade(dadosPF.dataNascimento) ? 'É necessário ter 18 anos ou mais.' : ''} />
        <Campo nome="nomeMae" rotulo="Nome da mãe" valor={dadosPF.nomeMae} alterar={alterarDados} />
        <Campo nome="nomePai" rotulo="Nome do pai" valor={dadosPF.nomePai} alterar={alterarDados} obrigatorio={false} opcional />
      </div>
    }
    if (empresarial && etapaAtual === 1) return <div className="grade-formulario">
      <Campo nome="nomeResponsavel" rotulo="Nome completo" valor={dadosPJ.nomeResponsavel} alterar={alterarDados} autocomplete="name" />
      <Campo nome="cpfResponsavel" rotulo="CPF" valor={dadosPJ.cpfResponsavel} alterar={alterarDados} />
      <Campo nome="dataNascimentoResponsavel" rotulo="Data de nascimento" valor={dadosPJ.dataNascimentoResponsavel} alterar={alterarDados} tipo="date" erro={dadosPJ.dataNascimentoResponsavel && !maiorDeIdade(dadosPJ.dataNascimentoResponsavel) ? 'O responsável precisa ter 18 anos ou mais.' : ''} />
      <Campo nome="nomeMaeResponsavel" rotulo="Nome da mãe" valor={dadosPJ.nomeMaeResponsavel} alterar={alterarDados} />
      <Campo nome="nomePaiResponsavel" rotulo="Nome do pai" valor={dadosPJ.nomePaiResponsavel} alterar={alterarDados} obrigatorio={false} opcional />
      <Campo nome="cargoResponsavel" rotulo="Cargo na empresa" valor={dadosPJ.cargoResponsavel} alterar={alterarDados} opcoes={['Sócio', 'Administrador', 'Diretor', 'Representante legal', 'Outro']} />
    </div>
    if ((!empresarial && etapaAtual === 1) || (empresarial && etapaAtual === 2)) return <div className="grade-formulario">
      <Campo nome={empresarial ? 'emailEmpresarial' : 'email'} rotulo={empresarial ? 'E-mail empresarial' : 'E-mail'} valor={empresarial ? dadosPJ.emailEmpresarial : dadosPF.email} alterar={alterarDados} tipo="email" autocomplete="email" />
      <Campo nome={empresarial ? 'confirmarEmailEmpresarial' : 'confirmarEmail'} rotulo="Confirmar e-mail" valor={empresarial ? dadosPJ.confirmarEmailEmpresarial : dadosPF.confirmarEmail} alterar={alterarDados} tipo="email" erro={(empresarial ? dadosPJ.confirmarEmailEmpresarial : dadosPF.confirmarEmail) && (empresarial ? dadosPJ.emailEmpresarial !== dadosPJ.confirmarEmailEmpresarial : dadosPF.email !== dadosPF.confirmarEmail) ? 'Os e-mails não são iguais.' : ''} />
      <Campo nome={empresarial ? 'telefoneEmpresarial' : 'telefone'} rotulo={empresarial ? 'Telefone empresarial' : 'Telefone celular'} valor={empresarial ? dadosPJ.telefoneEmpresarial : dadosPF.telefone} alterar={alterarDados} tipo="tel" autocomplete="tel" />
    </div>
    if ((!empresarial && etapaAtual === 2) || (empresarial && etapaAtual === 3)) return formularioEndereco()
    if ((!empresarial && etapaAtual === 3) || (empresarial && etapaAtual === 4)) return formularioAcesso()
    if ((!empresarial && etapaAtual === 4) || (empresarial && etapaAtual === 5)) return <CapturaFacial capturasFaciais={capturasFaciais} setCapturasFaciais={setCapturasFaciais} contaEmpresarial={empresarial} />
    return revisaoCadastro()
  }

  const etapaRevisao = empresarial => empresarial ? 6 : 5
  const titulos = tipoConta === 'PF'
    ? ['Vamos começar pelos seus dados', 'Como podemos falar com você?', 'Onde você mora?', 'Crie seu acesso', 'Agora precisamos confirmar seu rosto', 'Revise seus dados']
    : ['Conte sobre sua empresa', 'Quem será o responsável?', 'Contato empresarial', 'Endereço da empresa', 'Crie o acesso empresarial', 'Confirmação do responsável', 'Revise os dados empresariais']

  const naRevisao = etapaAtual === etapaRevisao(tipoConta === 'PJ')

  return (
    <div className="pagina-cadastro">
      <CadastroHeader voltarParaHome={() => navigate('/')} />
      <main className="conteudo area-cadastro">
        <IndicadorEtapas etapas={etapas} etapaAtual={etapaAtual} />
        <div className="layout-cadastro">
          <section className="cartao-formulario">
            <div className="titulo-formulario"><p>ETAPA {etapaAtual + 1}</p><h1>{titulos[etapaAtual]}</h1><span>{etapaAtual === 0 ? 'Preencha as informações para iniciar a abertura da conta.' : 'Confira os dados e continue quando estiver pronto.'}</span></div>
            {conteudoEtapa()}
            {mensagemErro && <p className="erro-geral">{mensagemErro}</p>}
            <div className="acoes-formulario">
              <button className="botao botao-secundario" type="button" onClick={voltar}>Voltar</button>
              {naRevisao
                ? <button className="botao botao-principal" type="button" disabled={enviando} onClick={enviarCadastro}>{enviando ? 'Enviando...' : 'Enviar cadastro'}</button>
                : <button className="botao botao-principal" type="button" disabled={!validarEtapa()} onClick={avancar}>Continuar</button>}
            </div>
          </section>
          <aside className="apoio-cadastro">
            <span>{String(etapaAtual + 1).padStart(2, '0')}</span>
            <h2>{etapas[etapaAtual]}</h2>
            <p>Seus dados permanecem apenas nesta simulação enquanto você navega pelo cadastro.</p>
            <hr />
            <strong>Ambiente acadêmico</strong>
            <p>Não atualize a página durante o preenchimento, pois os dados não são armazenados.</p>
          </aside>
        </div>
      </main>
    </div>
  )
}
