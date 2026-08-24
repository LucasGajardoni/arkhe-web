import Campo from './CampoFormulario.jsx'
import { emailValido } from '../../utils/validadores.js'

export default function EtapaContato({ empresarial, dados, alterar, erroEmail, verificarEmail }) {
  const email = empresarial ? dados.emailEmpresarial : dados.email
  const confirmarEmail = empresarial ? dados.confirmarEmailEmpresarial : dados.confirmarEmail

  return (
    <div className="grade-formulario">
      <Campo nome={empresarial ? 'emailEmpresarial' : 'email'} rotulo={empresarial ? 'E-mail empresarial' : 'E-mail'} valor={email} alterar={alterar} aoSair={verificarEmail} tipo="email" autocomplete="email" erro={erroEmail || (email && !emailValido(email) ? 'Informe um e-mail válido.' : '')} />
      <Campo nome={empresarial ? 'confirmarEmailEmpresarial' : 'confirmarEmail'} rotulo="Confirmar e-mail" valor={confirmarEmail} alterar={alterar} tipo="email" erro={confirmarEmail && email !== confirmarEmail ? 'Os e-mails não são iguais.' : ''} />
      <Campo nome={empresarial ? 'telefoneEmpresarial' : 'telefone'} rotulo={empresarial ? 'Telefone empresarial' : 'Telefone celular'} valor={empresarial ? dados.telefoneEmpresarial : dados.telefone} alterar={alterar} tipo="tel" autocomplete="tel" />
    </div>
  )
}
