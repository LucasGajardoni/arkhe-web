import Campo from './CampoFormulario.jsx'
import { pinValido } from '../../utils/validadores.js'

export default function EtapaAcesso({
  empresarial,
  clienteExistente,
  dadosPF,
  dadosPJ,
  dadosAtuais,
  pinSeguroCadastro,
  alterar,
  mostrarPin,
  alternarPin,
}) {
  let tipoCampoPin = 'password'
  let textoBotaoPin = 'Mostrar PINs'
  let erroConfirmacao = ''
  let erroPin = ''

  if (mostrarPin) {
    tipoCampoPin = 'text'
    textoBotaoPin = 'Ocultar PINs'
  }

  if (dadosAtuais.confirmarPin && dadosAtuais.pin !== dadosAtuais.confirmarPin) {
    erroConfirmacao = 'Os PINs não são iguais.'
  }

  if (pinValido(dadosAtuais.pin) && !pinSeguroCadastro) {
    erroPin = 'Esse PIN aparece em um dos seus dados. Escolha outro.'
  }

  let consentimentoDados = (
    <label>
      <input name="aceitarDados" type="checkbox" checked={dadosPF.aceitarDados} onChange={alterar} />
      {' '}Autorizo o tratamento dos meus dados pessoais para esta simulação.
    </label>
  )

  if (empresarial) {
    consentimentoDados = (
      <>
        <label>
          <input
            name="aceitarDadosPessoais"
            type="checkbox"
            checked={dadosPJ.aceitarDadosPessoais}
            onChange={alterar}
          />
          {' '}Autorizo o tratamento dos dados pessoais nesta simulação.
        </label>
        <label>
          <input
            name="aceitarDadosEmpresariais"
            type="checkbox"
            checked={dadosPJ.aceitarDadosEmpresariais}
            onChange={alterar}
          />
          {' '}Autorizo o tratamento dos dados empresariais nesta simulação.
        </label>
      </>
    )
  }

  return (
    <>
      <div className="grade-formulario">
        <Campo
          nome="pin"
          rotulo="PIN de 6 dígitos"
          valor={dadosAtuais.pin}
          alterar={alterar}
          tipo={tipoCampoPin}
          autocomplete="new-password"
          inputMode="numeric"
          maxLength={6}
          erro={erroPin}
        />
        <Campo
          nome="confirmarPin"
          rotulo="Confirmar PIN"
          valor={dadosAtuais.confirmarPin}
          alterar={alterar}
          tipo={tipoCampoPin}
          autocomplete="new-password"
          inputMode="numeric"
          maxLength={6}
          erro={erroConfirmacao}
        />
      </div>
      <p className="aviso-simulacao">
        O PIN deve ter 6 dígitos e não pode aparecer no CPF, nascimento, telefone, CNPJ, CEP ou número do endereço.
      </p>
      <button className="mostrar-pin" type="button" onClick={alternarPin}>
        {textoBotaoPin}
      </button>
      {!clienteExistente && (
        <div className="consentimentos">
          <label>
            <input name="aceitarTermos" type="checkbox" checked={dadosAtuais.aceitarTermos} onChange={alterar} />
            {' '}Li e aceito os termos de uso do projeto acadêmico.
          </label>
          {consentimentoDados}
          <label>
            <input name="aceitarBiometria" type="checkbox" checked={dadosAtuais.aceitarBiometria} onChange={alterar} />
            {' '}Autorizo o cadastro ou a validação do meu rosto para autenticação.
          </label>
        </div>
      )}
      <p className="aviso-simulacao">Este projeto é acadêmico e não representa uma instituição financeira real.</p>
    </>
  )
}
