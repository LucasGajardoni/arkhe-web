import Campo from './CampoFormulario.jsx'
import { somenteNumeros } from '../../utils/formatadores.js'
import { cpfValido, maiorDeIdade, nomeValido } from '../../utils/validadores.js'

export default function EtapaDados({ empresarial, dadosPF, dadosPJ, alterar }) {
  if (!empresarial) return (
    <div className="grade-formulario">
      <Campo nome="nome" rotulo="Nome completo" valor={dadosPF.nome} alterar={alterar} autocomplete="name" erro={dadosPF.nome && !nomeValido(dadosPF.nome) ? 'Use apenas letras e espaços.' : ''} />
      <Campo nome="cpf" rotulo="CPF" valor={dadosPF.cpf} alterar={alterar} erro={somenteNumeros(dadosPF.cpf).length === 11 && !cpfValido(dadosPF.cpf) ? 'CPF inválido.' : ''} />
      <Campo nome="dataNascimento" rotulo="Data de nascimento" valor={dadosPF.dataNascimento} alterar={alterar} tipo="date" erro={dadosPF.dataNascimento && !maiorDeIdade(dadosPF.dataNascimento) ? 'É necessário ter 18 anos ou mais.' : ''} />
    </div>
  )

  return (
    <div className="grade-formulario">
      <Campo nome="cnpj" rotulo="CNPJ" valor={dadosPJ.cnpj} alterar={alterar} />
      <Campo nome="razaoSocial" rotulo="Razão social" valor={dadosPJ.razaoSocial} alterar={alterar} />
      <Campo nome="nomeFantasia" rotulo="Nome fantasia" valor={dadosPJ.nomeFantasia} alterar={alterar} />
    </div>
  )
}

export function EtapaResponsavel({ dados, alterar }) {
  return (
    <div className="grade-formulario">
      <Campo nome="nomeResponsavel" rotulo="Nome completo" valor={dados.nomeResponsavel} alterar={alterar} autocomplete="name" erro={dados.nomeResponsavel && !nomeValido(dados.nomeResponsavel) ? 'Use apenas letras e espaços.' : ''} />
      <Campo nome="cpfResponsavel" rotulo="CPF" valor={dados.cpfResponsavel} alterar={alterar} erro={somenteNumeros(dados.cpfResponsavel).length === 11 && !cpfValido(dados.cpfResponsavel) ? 'CPF inválido.' : ''} />
      <Campo nome="dataNascimentoResponsavel" rotulo="Data de nascimento" valor={dados.dataNascimentoResponsavel} alterar={alterar} tipo="date" erro={dados.dataNascimentoResponsavel && !maiorDeIdade(dados.dataNascimentoResponsavel) ? 'O responsável precisa ter 18 anos ou mais.' : ''} />
    </div>
  )
}
