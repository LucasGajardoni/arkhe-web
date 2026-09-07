export default function CampoFormulario({
  nome,
  rotulo,
  valor,
  alterar,
  aoSair,
  tipo = 'text',
  obrigatorio = true,
  opcional = false,
  autocomplete,
  inputMode,
  maxLength,
  somenteLeitura = false,
  erro,
}) {
  return (
    <label className="campo-formulario">
      <span>
        {rotulo} {opcional && <small>(opcional)</small>}
      </span>
      <input
        name={nome}
        type={tipo}
        value={valor}
        onChange={alterar}
        onBlur={aoSair}
        required={obrigatorio}
        autoComplete={autocomplete}
        inputMode={inputMode}
        maxLength={maxLength}
        readOnly={somenteLeitura}
      />
      {erro && <small className="erro-campo">{erro}</small>}
    </label>
  )
}
