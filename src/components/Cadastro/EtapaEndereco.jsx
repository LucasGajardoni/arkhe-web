import Campo from './CampoFormulario.jsx'

export default function EtapaEndereco({ dados, alterar, consultando, mensagem }) {
  return (
    <div className="grade-formulario">
      <Campo nome="cep" rotulo="CEP" valor={dados.cep} alterar={alterar} autocomplete="postal-code" />
      <div className="status-cep">{consultando ? 'Consultando CEP...' : mensagem}</div>
      <Campo nome="logradouro" rotulo="Logradouro" valor={dados.logradouro} alterar={alterar} autocomplete="street-address" />
      <Campo nome="numero" rotulo="Número" valor={dados.numero} alterar={alterar} />
      <Campo nome="complemento" rotulo="Complemento" valor={dados.complemento} alterar={alterar} obrigatorio={false} opcional />
      <Campo nome="bairro" rotulo="Bairro" valor={dados.bairro} alterar={alterar} />
      <Campo nome="cidade" rotulo="Cidade" valor={dados.cidade} alterar={alterar} autocomplete="address-level2" />
      <Campo nome="estado" rotulo="Estado" valor={dados.estado} alterar={alterar} autocomplete="address-level1" />
    </div>
  )
}
