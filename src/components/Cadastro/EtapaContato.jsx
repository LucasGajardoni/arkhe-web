import Campo from './CampoFormulario.jsx'
import { emailValido } from '../../utils/validadores.js'

export default function EtapaContato({ empresarial, dados, alterar, erroEmail, verificarEmail }) {
  let nomeEmail = 'email'
  let nomeConfirmacao = 'confirmarEmail'
  let nomeTelefone = 'telefone'
  let rotuloEmail = 'E-mail'
  let rotuloTelefone = 'Telefone celular'
  let email = dados.email
  let confirmarEmail = dados.confirmarEmail
  let telefone = dados.telefone

  if (empresarial) {
    nomeEmail = 'emailEmpresarial'
    nomeConfirmacao = 'confirmarEmailEmpresarial'
    nomeTelefone = 'telefoneEmpresarial'
    rotuloEmail = 'E-mail empresarial'
    rotuloTelefone = 'Telefone empresarial'
    email = dados.emailEmpresarial
    confirmarEmail = dados.confirmarEmailEmpresarial
    telefone = dados.telefoneEmpresarial
  }

  let mensagemErroEmail = erroEmail
  let mensagemErroConfirmacao = ''

  if (!mensagemErroEmail && email && !emailValido(email)) {
    mensagemErroEmail = 'Informe um e-mail válido.'
  }
  if (confirmarEmail && email !== confirmarEmail) {
    mensagemErroConfirmacao = 'Os e-mails não são iguais.'
  }

  return (
    <div className="grade-formulario">
      <Campo
        nome={nomeEmail}
        rotulo={rotuloEmail}
        valor={email}
        alterar={alterar}
        aoSair={verificarEmail}
        tipo="email"
        autocomplete="email"
        erro={mensagemErroEmail}
      />
      <Campo
        nome={nomeConfirmacao}
        rotulo="Confirmar e-mail"
        valor={confirmarEmail}
        alterar={alterar}
        tipo="email"
        erro={mensagemErroConfirmacao}
      />
      <Campo
        nome={nomeTelefone}
        rotulo={rotuloTelefone}
        valor={telefone}
        alterar={alterar}
        tipo="tel"
        autocomplete="tel"
      />
    </div>
  )
}
