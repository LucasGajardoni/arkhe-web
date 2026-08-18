export default function CampoFormulario({ nome, rotulo, valor, alterar, tipo = 'text', obrigatorio = true, opcional = false, autocomplete, erro }) {
  return (
    <label className="campo-formulario">
      <span>{rotulo} {opcional && <small>(opcional)</small>}</span>
      <input name={nome} type={tipo} value={valor} onChange={alterar} required={obrigatorio} autoComplete={autocomplete} />
      {erro && <small className="erro-campo">{erro}</small>}
    </label>
  )
}
