import Campo from './CampoFormulario.jsx'

export default function EtapaContato({ empresarial, dados, alterar }) {
  const email = empresarial ? dados.emailEmpresarial : dados.email
  const confirmarEmail = empresarial ? dados.confirmarEmailEmpresarial : dados.confirmarEmail

  return (
    <div className="grade-formulario">
      <Campo nome={empresarial ? 'emailEmpresarial' : 'email'} rotulo={empresarial ? 'E-mail empresarial' : 'E-mail'} valor={email} alterar={alterar} tipo="email" autocomplete="email" />
      <Campo nome={empresarial ? 'confirmarEmailEmpresarial' : 'confirmarEmail'} rotulo="Confirmar e-mail" valor={confirmarEmail} alterar={alterar} tipo="email" erro={confirmarEmail && email !== confirmarEmail ? 'Os e-mails não são iguais.' : ''} />
      <Campo nome={empresarial ? 'telefoneEmpresarial' : 'telefone'} rotulo={empresarial ? 'Telefone empresarial' : 'Telefone celular'} valor={empresarial ? dados.telefoneEmpresarial : dados.telefone} alterar={alterar} tipo="tel" autocomplete="tel" />
    </div>
  )
}
