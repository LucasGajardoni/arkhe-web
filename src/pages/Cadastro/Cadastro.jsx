import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CadastroHeader from '../../components/CadastroHeader/CadastroHeader.jsx'
import IndicadorEtapas from '../../components/IndicadorEtapas/IndicadorEtapas.jsx'
import ReconhecimentoFacial from '../../components/ReconhecimentoFacial/ReconhecimentoFacial.jsx'
import { API_URL, FACE_API_URL, FACE_CLIENT_ID, FACE_CLIENT_SECRET } from '../../App.jsx'
import './Cadastro.css'

const etapasPF = ['Dados pessoais', 'Contato', 'Endereço', 'Acesso', 'Revisão', 'Reconhecimento facial']
const etapasPJ = ['Dados da empresa', 'Responsável', 'Contato', 'Endereço', 'Acesso', 'Revisão', 'Reconhecimento facial']

const dadosIniciaisPF = {
  nome: '', cpf: '', dataNascimento: '', email: '', confirmarEmail: '', telefone: '',
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', senha: '', confirmarSenha: '',
  aceitarTermos: false, aceitarDados: false, aceitarBiometria: false,
}

const dadosIniciaisPJ = {
  cnpj: '', razaoSocial: '', nomeFantasia: '', nomeResponsavel: '', cpfResponsavel: '', dataNascimentoResponsavel: '',
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
  const [mensagemErro, setMensagemErro] = useState('')
  const [consultandoCep, setConsultandoCep] = useState(false)
  const [mensagemCep, setMensagemCep] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [sessaoFacial, setSessaoFacial] = useState(null)
  const [facialConcluido, setFacialConcluido] = useState(false)

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

  function cpfValido(valor) {
    const cpf = valor.replace(/\D/g, '')
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

    function calcularDigito(tamanho) {
      let soma = 0
      for (let indice = 0; indice < tamanho; indice += 1) {
        soma += Number(cpf[indice]) * (tamanho + 1 - indice)
      }
      const resto = (soma * 10) % 11
      return resto === 10 ? 0 : resto
    }

    return calcularDigito(9) === Number(cpf[9])
      && calcularDigito(10) === Number(cpf[10])
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

  function formatarDataBrasileira(data) {
    if (!data) return ''
    const [ano, mes, dia] = data.split('-')
    if (!ano || !mes || !dia) return data
    return `${dia}/${mes}/${ano}`
  }

  function mensagemErroApiFacial(resultado, mensagemPadrao) {
    const detalhe = resultado?.detail
    if (typeof detalhe === 'string') return detalhe
    if (detalhe?.message) return detalhe.message
    if (Array.isArray(detalhe)) {
      return detalhe.map((erro) => {
        const campo = erro.loc?.at(-1)
        return `${campo ? `${campo}: ` : ''}${erro.msg || 'valor inválido'}`
      }).join(' | ')
    }
    return mensagemPadrao
  }

  // Remove acentos, espaços e símbolos para comparar a senha com os dados
  // pessoais de forma consistente. Exemplo: "Sôfia" passa a ser "sofia".
  function normalizarTexto(valor) {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
  }

  // Reúne as regras básicas usadas pelo backend e verifica se a senha contém
  // informações do cadastro. A data também é testada como dia+mês para impedir
  // combinações previsíveis como "Sofia@2704".
  function requisitosDaSenha(dados) {
    const senha = dados.senha || ''
    const senhaNormalizada = normalizarTexto(senha)
    const empresarial = tipoConta === 'PJ'
    const nome = empresarial ? dadosPJ.nomeResponsavel : dadosPF.nome
    const email = empresarial ? dadosPJ.emailEmpresarial : dadosPF.email
    const cpf = empresarial ? dadosPJ.cpfResponsavel : dadosPF.cpf
    const telefone = empresarial ? dadosPJ.telefoneEmpresarial : dadosPF.telefone
    const nascimento = empresarial ? dadosPJ.dataNascimentoResponsavel : dadosPF.dataNascimento
    const [ano = '', mes = '', dia = ''] = nascimento.split('-')

    const palavrasPessoais = [
      ...nome.split(/\s+/),
      ...email.split('@')[0].split(/[^a-zA-ZÀ-ÿ0-9]+/),
      ...(empresarial ? `${dadosPJ.razaoSocial} ${dadosPJ.nomeFantasia}`.split(/\s+/) : []),
    ].map(normalizarTexto).filter((parte) => parte.length >= 3)

    const numerosPessoais = [
      cpf.replace(/\D/g, ''),
      telefone.replace(/\D/g, ''),
      cpf.replace(/\D/g, '').slice(-4),
      telefone.replace(/\D/g, '').slice(-4),
      dia && mes ? `${dia}${mes}` : '',
      dia && mes && ano ? `${dia}${mes}${ano}` : '',
      ano,
      empresarial ? dadosPJ.cnpj.replace(/\D/g, '') : '',
    ].filter((parte) => parte.length >= 4)

    const contemDadosPessoais = [...palavrasPessoais, ...numerosPessoais]
      .some((parte) => senhaNormalizada.includes(parte))

    return {
      tamanho: senha.length >= 8 && senha.length <= 12,
      maiuscula: /[A-ZÀ-Ý]/.test(senha),
      minuscula: /[a-zà-ÿ]/.test(senha),
      numero: /\d/.test(senha),
      especial: /[^A-Za-zÀ-ÿ0-9]/.test(senha),
      semDadosPessoais: !contemDadosPessoais,
    }
  }

  // A etapa de acesso só pode avançar quando todos os requisitos forem verdadeiros.
  function senhaValida(dados) {
    return Object.values(requisitosDaSenha(dados)).every(Boolean)
  }

  function validarEtapa() {
    if (tipoConta === 'PF') {
      if (etapaAtual === 0) return camposPreenchidos(['nome', 'cpf', 'dataNascimento']) && cpfValido(dadosPF.cpf) && maiorDeIdade(dadosPF.dataNascimento)
      if (etapaAtual === 1) return camposPreenchidos(['email', 'confirmarEmail', 'telefone']) && dadosPF.email === dadosPF.confirmarEmail
      if (etapaAtual === 2) return camposPreenchidos(['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'])
      if (etapaAtual === 3) return camposPreenchidos(['senha', 'confirmarSenha']) && senhaValida(dadosPF) && dadosPF.senha === dadosPF.confirmarSenha && dadosPF.aceitarTermos && dadosPF.aceitarDados && dadosPF.aceitarBiometria
    } else {
      if (etapaAtual === 0) return camposPreenchidos(['cnpj', 'razaoSocial', 'nomeFantasia'])
      if (etapaAtual === 1) return camposPreenchidos(['nomeResponsavel', 'cpfResponsavel', 'dataNascimentoResponsavel']) && cpfValido(dadosPJ.cpfResponsavel) && maiorDeIdade(dadosPJ.dataNascimentoResponsavel)
      if (etapaAtual === 2) return camposPreenchidos(['emailEmpresarial', 'confirmarEmailEmpresarial', 'telefoneEmpresarial']) && dadosPJ.emailEmpresarial === dadosPJ.confirmarEmailEmpresarial
      if (etapaAtual === 3) return camposPreenchidos(['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'])
      if (etapaAtual === 4) return camposPreenchidos(['senha', 'confirmarSenha']) && senhaValida(dadosPJ) && dadosPJ.senha === dadosPJ.confirmarSenha && dadosPJ.aceitarTermos && dadosPJ.aceitarDadosPessoais && dadosPJ.aceitarDadosEmpresariais && dadosPJ.aceitarBiometria
    }
    return true
  }

  function mensagemValidacao() {
    const etapaCpf = (tipoConta === 'PF' && etapaAtual === 0) || (tipoConta === 'PJ' && etapaAtual === 1)
    const etapaContato = (tipoConta === 'PF' && etapaAtual === 1) || (tipoConta === 'PJ' && etapaAtual === 2)
    const etapaAcesso = (tipoConta === 'PF' && etapaAtual === 3) || (tipoConta === 'PJ' && etapaAtual === 4)
    if (etapaCpf && !cpfValido(tipoConta === 'PJ' ? dadosPJ.cpfResponsavel : dadosPF.cpf)) return 'Informe um CPF válido para continuar.'
    if (etapaContato) return 'Os e-mails informados precisam ser iguais.'
    if (etapaAcesso) return 'Confira os requisitos da senha, a confirmação e todos os consentimentos.'
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

  function montarDadosCadastro() {
    const empresarial = tipoConta === 'PJ'
    const dados = empresarial ? dadosPJ : dadosPF
    const formData = new FormData()

    formData.append('nome', empresarial ? dadosPJ.nomeResponsavel : dadosPF.nome)
    formData.append('email', empresarial ? dadosPJ.emailEmpresarial : dadosPF.email)
    formData.append('telefone', (empresarial ? dadosPJ.telefoneEmpresarial : dadosPF.telefone).replace(/\D/g, ''))
    formData.append('cpf', (empresarial ? dadosPJ.cpfResponsavel : dadosPF.cpf).replace(/\D/g, ''))
    formData.append('cnpj', empresarial ? dadosPJ.cnpj.replace(/\D/g, '') : '')
    formData.append('senha', dados.senha)
    formData.append('data_nascimento', empresarial ? dadosPJ.dataNascimentoResponsavel : dadosPF.dataNascimento)
    formData.append('cep', dados.cep.replace(/\D/g, ''))
    formData.append('rua', dados.logradouro)
    formData.append('numero', dados.numero)
    formData.append('bairro', dados.bairro)
    formData.append('cidade', dados.cidade)
    formData.append('estado', dados.estado)
    formData.append('complemento', dados.complemento)
    formData.append('nome_fantasia', empresarial ? dadosPJ.nomeFantasia : '')
    formData.append('razao_social', empresarial ? dadosPJ.razaoSocial : '')
    formData.append('representante', empresarial ? dadosPJ.cpfResponsavel.replace(/\D/g, '') : '')
    formData.append('tipo', '1')

    return formData
  }

  async function salvarCadastro() {
    setEnviando(true)
    setMensagemErro('')

    try {
      // O banco só recebe o usuário depois que o scanner facial concluiu.
      // Assim não existe uma conta no Flask sem biometria cadastrada.
      const resposta = await fetch(`${API_URL}/adicionar_usuario`, {
        method: 'POST',
        credentials: 'include',
        body: montarDadosCadastro(),
      })
      const resultado = await resposta.json()
      if (!resposta.ok) {
        setMensagemErro(resultado.mensagem || 'Não foi possível realizar o cadastro.')
        return
      }

      navigate('/login')
    } catch {
      setMensagemErro('Biometria concluída, mas não foi possível conectar ao servidor. Tente salvar novamente.')
    } finally {
      setEnviando(false)
    }
  }

  async function concluirCadastroFacial() {
    setFacialConcluido(true)
    await salvarCadastro()
  }

  async function enviarCadastro() {
    setEnviando(true)
    setMensagemErro('')

    const empresarial = tipoConta === 'PJ'

    try {
      // Primeiro verificamos a disponibilidade da API e criamos a sessão facial.
      // Nenhum dado é gravado no banco principal antes de o rosto ser concluído.
      const respostaFacial = await fetch(`${FACE_API_URL}/v1/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': FACE_CLIENT_ID,
          'X-Client-Secret': FACE_CLIENT_SECRET,
        },
        body: JSON.stringify({
          cpf: (empresarial ? dadosPJ.cpfResponsavel : dadosPF.cpf).replace(/\D/g, ''),
          display_name: empresarial ? dadosPJ.nomeResponsavel : dadosPF.nome,
          email: empresarial ? dadosPJ.emailEmpresarial : dadosPF.email,
          phone: (empresarial ? dadosPJ.telefoneEmpresarial : dadosPF.telefone).replace(/\D/g, ''),
          consent: {
            accepted: true,
            version: 'arkhe-termos-v1',
            purpose: 'Cadastro e autenticação facial no Banco Arkhé',
          },
          ttl_minutes: 15,
        }),
      })
      const resultadoFacial = await respostaFacial.json()
      if (!respostaFacial.ok) {
        setMensagemErro(mensagemErroApiFacial(
          resultadoFacial,
          `Não foi possível iniciar o cadastro facial (erro ${respostaFacial.status}). Nenhum usuário foi salvo.`,
        ))
        return
      }

      setSessaoFacial(resultadoFacial)
      setEtapaAtual(tipoConta === 'PJ' ? 6 : 5)
    } catch {
      setMensagemErro('Não foi possível conectar à API facial. Nenhum usuário foi salvo.')
    } finally {
      setEnviando(false)
    }
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
    const requisitos = requisitosDaSenha(dadosAtuais)
    const itensSenha = [
      ['tamanho', 'Entre 8 e 12 caracteres'],
      ['maiuscula', 'Uma letra maiúscula'],
      ['minuscula', 'Uma letra minúscula'],
      ['numero', 'Um número'],
      ['especial', 'Um caractere especial'],
      ['semDadosPessoais', 'Não conter nome, documentos, telefone, e-mail ou data de nascimento'],
    ]
    return (
      <>
        <div className="grade-formulario">
          <Campo nome="senha" rotulo="Senha" valor={dadosAtuais.senha} alterar={alterarDados} tipo={mostrarSenha ? 'text' : 'password'} autocomplete="new-password" />
          <Campo nome="confirmarSenha" rotulo="Confirmar senha" valor={dadosAtuais.confirmarSenha} alterar={alterarDados} tipo={mostrarSenha ? 'text' : 'password'} autocomplete="new-password" erro={dadosAtuais.confirmarSenha && dadosAtuais.senha !== dadosAtuais.confirmarSenha ? 'As senhas não são iguais.' : ''} />
        </div>
        <div className="requisitos-senha" aria-live="polite">
          <strong>Sua senha precisa ter:</strong>
          <ul>
            {itensSenha.map(([chave, texto]) => (
              <li className={requisitos[chave] ? 'requisito-atendido' : ''} key={chave}>
                <span>{requisitos[chave] ? '✓' : '○'}</span> {texto}
              </li>
            ))}
          </ul>
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
          <label><input name="aceitarBiometria" type="checkbox" checked={dadosAtuais.aceitarBiometria} onChange={alterarDados} /> Autorizo o cadastro e o uso do meu rosto para autenticação.</label>
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
        {empresarial && blocoRevisao('Dados da empresa', [['CNPJ', dadosPJ.cnpj], ['Razão social', dadosPJ.razaoSocial], ['Nome fantasia', dadosPJ.nomeFantasia]], () => setEtapaAtual(0))}
        {blocoRevisao(empresarial ? 'Responsável' : 'Dados pessoais', empresarial
          ? [['Nome', dadosPJ.nomeResponsavel], ['CPF', dadosPJ.cpfResponsavel], ['Nascimento', formatarDataBrasileira(dadosPJ.dataNascimentoResponsavel)]]
          : [['Nome', dadosPF.nome], ['CPF', dadosPF.cpf], ['Nascimento', formatarDataBrasileira(dadosPF.dataNascimento)]], () => setEtapaAtual(empresarial ? 1 : 0))}
        {blocoRevisao('Contato', empresarial
          ? [['E-mail', dadosPJ.emailEmpresarial], ['Telefone', dadosPJ.telefoneEmpresarial]]
          : [['E-mail', dadosPF.email], ['Telefone', dadosPF.telefone]], () => setEtapaAtual(empresarial ? 2 : 1))}
        {blocoRevisao('Endereço', [['CEP', dadosAtuais.cep], ['Logradouro', `${dadosAtuais.logradouro}, ${dadosAtuais.numero}`], ['Complemento', dadosAtuais.complemento], ['Bairro', dadosAtuais.bairro], ['Cidade/Estado', `${dadosAtuais.cidade} - ${dadosAtuais.estado}`]], () => setEtapaAtual(empresarial ? 3 : 2))}
        {blocoRevisao('Acesso', [['Status', 'Senha de acesso criada']], () => setEtapaAtual(empresarial ? 4 : 3))}
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
      </div> : <div className="grade-formulario">
        <Campo nome="nome" rotulo="Nome completo" valor={dadosPF.nome} alterar={alterarDados} autocomplete="name" />
        <Campo nome="cpf" rotulo="CPF" valor={dadosPF.cpf} alterar={alterarDados} erro={dadosPF.cpf.replace(/\D/g, '').length === 11 && !cpfValido(dadosPF.cpf) ? 'CPF inválido.' : ''} />
        <Campo nome="dataNascimento" rotulo="Data de nascimento" valor={dadosPF.dataNascimento} alterar={alterarDados} tipo="date" erro={dadosPF.dataNascimento && !maiorDeIdade(dadosPF.dataNascimento) ? 'É necessário ter 18 anos ou mais.' : ''} />
      </div>
    }
    if (empresarial && etapaAtual === 1) return <div className="grade-formulario">
      <Campo nome="nomeResponsavel" rotulo="Nome completo" valor={dadosPJ.nomeResponsavel} alterar={alterarDados} autocomplete="name" />
      <Campo nome="cpfResponsavel" rotulo="CPF" valor={dadosPJ.cpfResponsavel} alterar={alterarDados} erro={dadosPJ.cpfResponsavel.replace(/\D/g, '').length === 11 && !cpfValido(dadosPJ.cpfResponsavel) ? 'CPF inválido.' : ''} />
      <Campo nome="dataNascimentoResponsavel" rotulo="Data de nascimento" valor={dadosPJ.dataNascimentoResponsavel} alterar={alterarDados} tipo="date" erro={dadosPJ.dataNascimentoResponsavel && !maiorDeIdade(dadosPJ.dataNascimentoResponsavel) ? 'O responsável precisa ter 18 anos ou mais.' : ''} />
    </div>
    if ((!empresarial && etapaAtual === 1) || (empresarial && etapaAtual === 2)) return <div className="grade-formulario">
      <Campo nome={empresarial ? 'emailEmpresarial' : 'email'} rotulo={empresarial ? 'E-mail empresarial' : 'E-mail'} valor={empresarial ? dadosPJ.emailEmpresarial : dadosPF.email} alterar={alterarDados} tipo="email" autocomplete="email" />
      <Campo nome={empresarial ? 'confirmarEmailEmpresarial' : 'confirmarEmail'} rotulo="Confirmar e-mail" valor={empresarial ? dadosPJ.confirmarEmailEmpresarial : dadosPF.confirmarEmail} alterar={alterarDados} tipo="email" erro={(empresarial ? dadosPJ.confirmarEmailEmpresarial : dadosPF.confirmarEmail) && (empresarial ? dadosPJ.emailEmpresarial !== dadosPJ.confirmarEmailEmpresarial : dadosPF.email !== dadosPF.confirmarEmail) ? 'Os e-mails não são iguais.' : ''} />
      <Campo nome={empresarial ? 'telefoneEmpresarial' : 'telefone'} rotulo={empresarial ? 'Telefone empresarial' : 'Telefone celular'} valor={empresarial ? dadosPJ.telefoneEmpresarial : dadosPF.telefone} alterar={alterarDados} tipo="tel" autocomplete="tel" />
    </div>
    if ((!empresarial && etapaAtual === 2) || (empresarial && etapaAtual === 3)) return formularioEndereco()
    if ((!empresarial && etapaAtual === 3) || (empresarial && etapaAtual === 4)) return formularioAcesso()
    if ((!empresarial && etapaAtual === 5) || (empresarial && etapaAtual === 6)) {
      if (facialConcluido) return (
        <div className="resultado-facial-cadastro">
          <h3>Reconhecimento facial concluído</h3>
          <p>{enviando ? 'Salvando seu cadastro...' : mensagemErro || 'Finalizando seu cadastro...'}</p>
          {mensagemErro && <button className="botao botao-principal" type="button" disabled={enviando} onClick={salvarCadastro}>Tentar salvar novamente</button>}
        </div>
      )

      return sessaoFacial && (
        <ReconhecimentoFacial
          modo="cadastro"
          sessao={sessaoFacial}
          aoConcluir={concluirCadastroFacial}
          aoErro={setMensagemErro}
        />
      )
    }
    return revisaoCadastro()
  }

  const etapaRevisao = empresarial => empresarial ? 5 : 4
  const titulos = tipoConta === 'PF'
    ? ['Vamos começar pelos seus dados', 'Como podemos falar com você?', 'Onde você mora?', 'Crie seu acesso', 'Revise seus dados', 'Cadastre seu rosto']
    : ['Conte sobre sua empresa', 'Quem será o responsável?', 'Contato empresarial', 'Endereço da empresa', 'Crie o acesso empresarial', 'Revise os dados empresariais', 'Cadastre o rosto do responsável']

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
            {mensagemErro && !sessaoFacial && <p className="erro-geral">{mensagemErro}</p>}
            {sessaoFacial && !naRevisao ? null : <div className="acoes-formulario">
              <button className="botao botao-secundario" type="button" onClick={voltar}>Voltar</button>
              {naRevisao
                ? <button className="botao botao-principal" type="button" disabled={enviando} onClick={enviarCadastro}>{enviando ? 'Enviando...' : 'Enviar cadastro'}</button>
                : <button className="botao botao-principal" type="button" disabled={!validarEtapa()} onClick={avancar}>Continuar</button>}
            </div>}
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
