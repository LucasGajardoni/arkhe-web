import { useEffect } from 'react'
import { formatarChavePix } from '../../utils/formatadores.js'

const tipos = [
  ['email', 'E-mail'],
  ['telefone', 'Telefone'],
  ['cpf', 'CPF'],
  ['cnpj', 'CNPJ'],
  ['aleatoria', 'Chave aleatória'],
]

export default function ModalChavePix({ pix, fechar }) {
  const { tipo, alterarTipo, tiposDisponiveis, valor, valorValido, cadastrar, processando, erro } = pix
  const tiposVisiveis = tipos.filter(([valorTipo]) => tiposDisponiveis.includes(valorTipo))

  useEffect(() => {
    function fecharComEsc(evento) {
      if (evento.key === 'Escape') fechar()
    }

    document.addEventListener('keydown', fecharComEsc)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', fecharComEsc)
      document.body.style.overflow = ''
    }
  }, [fechar])

  function fecharAoClicarFora(evento) {
    if (evento.target === evento.currentTarget) fechar()
  }

  const tipoEncontrado = tipos.find(([valorTipo]) => valorTipo === tipo)
  let rotuloTipo = ''
  if (tipoEncontrado) rotuloTipo = tipoEncontrado[1]

  let campoChave = (
    <label className="campo-chave-pix">
      <span>{rotuloTipo}</span>
      <input value={formatarChavePix(tipo, valor)} readOnly />
      <small>Usaremos o dado confirmado no seu cadastro. Ele não pode ser alterado por aqui.</small>
    </label>
  )

  if (tipo === 'aleatoria') {
    campoChave = (
      <div className="aviso-chave-aleatoria">
        <strong>Chave gerada automaticamente</strong>
        <span>O banco criará um código único e seguro para você.</span>
      </div>
    )
  }

  let textoCadastrar = 'Cadastrar chave'
  if (processando) textoCadastrar = 'Cadastrando...'

  return (
    <div className="fundo-modal-perfil" role="presentation" onMouseDown={fecharAoClicarFora}>
      <section className="modal-perfil modal-chave-pix" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-chave">
        <header>
          <div>
            <p>MINHAS CHAVES</p>
            <h2 id="titulo-modal-chave">Cadastrar chave Pix</h2>
            <span>Escolha como você quer receber transferências.</span>
          </div>
          <button type="button" onClick={fechar} aria-label="Fechar modal">×</button>
        </header>
        <form onSubmit={cadastrar}>
          <fieldset>
            <legend>Tipo da chave</legend>
            <div className="tipos-chave-pix">
              {tiposVisiveis.map(([valorTipo, rotulo]) => {
                let classeBotao = ''
                if (tipo === valorTipo) classeBotao = 'ativo'

                return (
                  <button
                    className={classeBotao}
                    type="button"
                    key={valorTipo}
                    onClick={() => alterarTipo(valorTipo)}
                  >
                    {rotulo}
                  </button>
                )
              })}
            </div>
          </fieldset>
          {campoChave}
          {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}
          <footer>
            <button className="botao botao-secundario" type="button" onClick={fechar}>Cancelar</button>
            <button className="botao botao-principal" type="submit" disabled={!valorValido || processando}>
              {textoCadastrar}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
