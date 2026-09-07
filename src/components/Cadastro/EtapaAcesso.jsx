import Campo from './CampoFormulario.jsx'

export default function EtapaAcesso({
  empresarial,
  clienteExistente,
  dadosPF,
  dadosPJ,
  dadosAtuais,
  alterar,
  mostrarPin,
  alternarPin,
}) {
  let tipoCampoPin = 'password'
  let textoBotaoPin = 'Mostrar PINs'
  let erroConfirmacao = ''

  if (mostrarPin) {
    tipoCampoPin = 'text'
    textoBotaoPin = 'Ocultar PINs'
  }

  if (dadosAtuais.confirmarPin && dadosAtuais.pin !== dadosAtuais.confirmarPin) {
    erroConfirmacao = 'Os PINs não são iguais.'
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
        O PIN deve ter exatamente 6 dígitos. Zeros no início também são válidos.
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
            {' '}Autorizo o cadastro e o uso do meu rosto para autenticação.
          </label>
        </div>
      )}
      <p className="aviso-simulacao">Este projeto é acadêmico e não representa uma instituição financeira real.</p>
    </>
  )
}
