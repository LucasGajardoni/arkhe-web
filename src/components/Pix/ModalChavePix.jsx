import { useModalAcessivel } from '../../hooks/useModalAcessivel.js'
import { formatarChavePix } from '../../utils/formatadores.js'

const tipos = [
  ['email', 'E-mail'],
  ['telefone', 'Telefone'],
  ['cpf', 'CPF'],
  ['cnpj', 'CNPJ'],
  ['aleatoria', 'Chave aleatória'],
]

const canaisTelefone = [
  ['SMS', 'SMS', 'Receba o código por mensagem de texto.'],
  ['LIGACAO', 'Ligação', 'Receba uma ligação automática com o código.'],
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
        <div className="bloco-canal-pix">
          <div className="cabecalho-canal-pix">
            <strong>Como deseja receber o código?</strong>
            <span>Escolha um canal de confirmação.</span>
          </div>

          <div className="canais-confirmacao-pix" role="radiogroup" aria-label="Canal de confirmação">
            {canaisTelefone.map(([valorCanal, titulo, descricao]) => (
              <button
                className={canalTelefone === valorCanal ? 'canal-confirmacao-pix ativo' : 'canal-confirmacao-pix'}
                type="button"
                role="radio"
                aria-checked={canalTelefone === valorCanal}
                key={valorCanal}
                disabled={processando}
                onClick={() => setCanalTelefone(valorCanal)}
              >
                <span className="icone-canal-pix" aria-hidden="true">
                  {valorCanal === 'SMS' ? 'SMS' : 'TEL'}
                </span>
                <span className="texto-canal-pix">
                  <strong>{titulo}</strong>
                  <small>{descricao}</small>
                </span>
                <span className="seletor-canal-pix" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </>
    )
  }

  if (tipo === 'telefone' && idVerificacaoTelefone) {
    campoChave = (
      <>
        <div className="aviso-chave-aleatoria">
          <strong>Código enviado</strong>
          <span>Digite o código recebido. A verificação expira em aproximadamente 10 minutos.</span>
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

          {erro && (
            <div className="erro-confirmacao-pix" role="alert">
              <span aria-hidden="true">!</span>
              <div>
                <strong>Não foi possível concluir esta etapa</strong>
                <p>{erro}</p>
              </div>
            </div>
          )}

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
