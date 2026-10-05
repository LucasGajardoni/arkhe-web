import { useModalAcessivel } from '../../hooks/useModalAcessivel.js'
import { formatarChavePix } from '../../utils/formatadores.js'

const tipos = [
  ['email', 'E-mail'],
  ['telefone', 'Telefone'],
  ['cpf', 'CPF'],
  ['cnpj', 'CNPJ'],
  ['aleatoria', 'Chave aleatória'],
]

export default function ModalChavePix({ pix, fechar }) {
  const {
    tipo, alterarTipo, tiposDisponiveis, valor, valorValido, cadastrar, processando, erro,
    canalTelefone, setCanalTelefone, idVerificacaoTelefone, codigoTelefone, setCodigoTelefone,
    confirmarTelefone,
  } = pix
  const tiposVisiveis = tipos.filter(([valorTipo]) => tiposDisponiveis.includes(valorTipo))
  const { modalRef, fecharAoClicarFora } = useModalAcessivel(fechar, processando)

  const tipoEncontrado = tipos.find(([valorTipo]) => valorTipo === tipo)
  const rotuloTipo = tipoEncontrado ? tipoEncontrado[1] : ''

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

  if (tipo === 'email') {
    campoChave = (
      <>
        <label className="campo-chave-pix">
          <span>E-mail</span>
          <input value={formatarChavePix(tipo, valor)} readOnly />
          <small>Enviaremos um link para este e-mail. A chave só será criada depois da confirmação.</small>
        </label>
        <div className="aviso-chave-aleatoria">
          <strong>Confirmação obrigatória</strong>
          <span>O link expira em 15 minutos e funciona uma única vez.</span>
        </div>
      </>
    )
  }

  if (tipo === 'telefone' && !idVerificacaoTelefone) {
    campoChave = (
      <>
        <label className="campo-chave-pix">
          <span>Telefone</span>
          <input value={formatarChavePix(tipo, valor)} readOnly />
          <small>Escolha como deseja receber o código de 6 números.</small>
        </label>
        <label className="campo-chave-pix">
          <span>Receber código por</span>
          <select value={canalTelefone} onChange={(e) => setCanalTelefone(e.target.value)} disabled={processando}>
            <option value="SMS">SMS</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="LIGACAO">Ligação</option>
          </select>
        </label>
      </>
    )
  }

  if (tipo === 'telefone' && idVerificacaoTelefone) {
    campoChave = (
      <>
        <div className="aviso-chave-aleatoria">
          <strong>Código enviado</strong>
          <span>Digite o código recebido. Ele expira em 5 minutos.</span>
        </div>
        <label className="campo-chave-pix">
          <span>Código de confirmação</span>
          <input
            value={codigoTelefone}
            onChange={(e) => setCodigoTelefone(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            autoFocus
          />
          <small>Você possui até 5 tentativas antes de precisar solicitar outro código.</small>
        </label>
      </>
    )
  }

  const confirmandoTelefone = tipo === 'telefone' && Boolean(idVerificacaoTelefone)
  let textoCadastrar = tipo === 'email' ? 'Enviar link de confirmação' : tipo === 'telefone' ? 'Enviar código' : 'Cadastrar chave'
  if (confirmandoTelefone) textoCadastrar = 'Confirmar telefone'
  if (processando) textoCadastrar = 'Aguarde...'

  return (
    <div className="fundo-modal-perfil" role="presentation" onMouseDown={fecharAoClicarFora}>
      <section ref={modalRef} className="modal-perfil modal-chave-pix" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-chave" tabIndex="-1">
        <header>
          <div>
            <p>MINHAS CHAVES</p>
            <h2 id="titulo-modal-chave">Cadastrar chave Pix</h2>
            <span>Escolha como você quer receber transferências.</span>
          </div>
          <button type="button" disabled={processando} onClick={fechar} aria-label="Fechar modal">×</button>
        </header>

        <form onSubmit={confirmandoTelefone ? confirmarTelefone : cadastrar}>
          {!confirmandoTelefone && (
            <fieldset>
              <legend>Tipo da chave</legend>
              <div className="tipos-chave-pix">
                {tiposVisiveis.map(([valorTipo, rotulo]) => (
                  <button
                    className={tipo === valorTipo ? 'ativo' : ''}
                    type="button"
                    key={valorTipo}
                    onClick={() => alterarTipo(valorTipo)}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {campoChave}

          {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}

          <footer>
            <button className="botao botao-secundario" type="button" onClick={fechar}>Cancelar</button>
            <button
              className="botao botao-principal"
              type="submit"
              disabled={!valorValido || processando || (confirmandoTelefone && codigoTelefone.length !== 6)}
            >
              {textoCadastrar}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
