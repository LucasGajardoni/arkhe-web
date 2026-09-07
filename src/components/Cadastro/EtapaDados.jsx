import Campo from './CampoFormulario.jsx'
import { somenteNumeros } from '../../utils/formatadores.js'
import { cnpjValido, cpfValido, maiorDeIdade, nomeValido } from '../../utils/validadores.js'

export default function EtapaDados({ empresarial, dadosPF, dadosPJ, alterar, cpfSomenteLeitura = false }) {
  if (!empresarial) {
    let erroNome = ''
    let erroCpf = ''
    let erroNascimento = ''

    if (dadosPF.nome && !nomeValido(dadosPF.nome)) {
      erroNome = 'Use apenas letras e espaços.'
    }
    if (somenteNumeros(dadosPF.cpf).length === 11 && !cpfValido(dadosPF.cpf)) {
      erroCpf = 'CPF inválido.'
    }
    if (dadosPF.dataNascimento && !maiorDeIdade(dadosPF.dataNascimento)) {
      erroNascimento = 'É necessário ter 18 anos ou mais.'
    }

    return (
      <div className="grade-formulario">
        <Campo
          nome="nome"
          rotulo="Nome completo"
          valor={dadosPF.nome}
          alterar={alterar}
          autocomplete="name"
          erro={erroNome}
        />
        <Campo
          nome="cpf"
          rotulo="CPF"
          valor={dadosPF.cpf}
          alterar={alterar}
          inputMode="numeric"
          somenteLeitura={cpfSomenteLeitura}
          erro={erroCpf}
        />
        <Campo
          nome="dataNascimento"
          rotulo="Data de nascimento"
          valor={dadosPF.dataNascimento}
          alterar={alterar}
          tipo="date"
          erro={erroNascimento}
        />
      </div>
    )
  }

  let erroCnpj = ''
  if (somenteNumeros(dadosPJ.cnpj).length === 14 && !cnpjValido(dadosPJ.cnpj)) {
    erroCnpj = 'CNPJ inválido.'
  }

  return (
    <div className="grade-formulario">
      <Campo
        nome="cnpj"
        rotulo="CNPJ"
        valor={dadosPJ.cnpj}
        alterar={alterar}
        inputMode="numeric"
        erro={erroCnpj}
      />
      <Campo nome="razaoSocial" rotulo="Razão social" valor={dadosPJ.razaoSocial} alterar={alterar} />
      <Campo nome="nomeFantasia" rotulo="Nome fantasia" valor={dadosPJ.nomeFantasia} alterar={alterar} />
    </div>
  )
}

export function EtapaResponsavel({ dados, alterar, cpfSomenteLeitura = false }) {
  let erroNome = ''
  let erroCpf = ''
  let erroNascimento = ''

  if (dados.nomeResponsavel && !nomeValido(dados.nomeResponsavel)) {
    erroNome = 'Use apenas letras e espaços.'
  }
  if (somenteNumeros(dados.cpfResponsavel).length === 11 && !cpfValido(dados.cpfResponsavel)) {
    erroCpf = 'CPF inválido.'
  }
  if (dados.dataNascimentoResponsavel && !maiorDeIdade(dados.dataNascimentoResponsavel)) {
    erroNascimento = 'O responsável precisa ter 18 anos ou mais.'
  }

  return (
    <div className="grade-formulario">
      <Campo
        nome="nomeResponsavel"
        rotulo="Nome completo"
        valor={dados.nomeResponsavel}
        alterar={alterar}
        autocomplete="name"
        erro={erroNome}
      />
      <Campo
        nome="cpfResponsavel"
        rotulo="CPF"
        valor={dados.cpfResponsavel}
        alterar={alterar}
        inputMode="numeric"
        somenteLeitura={cpfSomenteLeitura}
        erro={erroCpf}
      />
      <Campo
        nome="dataNascimentoResponsavel"
        rotulo="Data de nascimento"
        valor={dados.dataNascimentoResponsavel}
        alterar={alterar}
        tipo="date"
        erro={erroNascimento}
      />
    </div>
  )
}
