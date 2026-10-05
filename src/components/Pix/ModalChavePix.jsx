import { useModalAcessivel } from '../../hooks/useModalAcessivel.js'
import { formatarChavePix } from '../../utils/formatadores.js'

const tipos = [
  ['email', 'E-mail'],
  ['telefone', 'Telefone'],
  ['cpf', 'CPF'],
  ['cnpj', 'CNPJ'],
  ['aleatoria', 'Chave aleatória'],
]

const canais = [
  ['SMS', 'SMS'],
  ['WHATSAPP', 'WhatsApp'],
  ['LIGACAO', 'Ligação'],
]

export default function ModalChavePix({ pix, fechar }) {
  const {
    tipo, alterarTipo, tiposDisponiveis, valor, valorValido, cadastrar,
    processando, erro, canalTelefone, setCanalTelefone, verificacaoTelefone,
    codigoTelefone, setCodigoTelefone, confirmarTelefone,
  } = pix

  const tiposVisiveis = tipos.filter(([valorTipo]) => tiposDisponiveis.includes(valorTipo))
  const { modalRef, fecharAoClicarFora } = useModalAcessivel(fechar, processando)
  const tipoEncontrado = tipos.find(([valorTipo]) => valorTipo === tipo)
  const rotuloTipo = tipoEncontrado ? tipoEncontrado[1] : ''

  if (tipo === 'telefone' && verificacaoTelefone) {
    return (
      <div className="fundo-modal-perfil" role="presentation" onMouseDown={fecharAoClicarFora}>
        <section ref={modalRef} className="modal-perfil modal-chave-pix" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-chave" tabIndex="-1">
          <header>
            <div>
              <p>CONFIRMAÇÃO PIX</p>
              <h2 id="titulo-modal-chave">Confirme seu telefone</h2>
              <span>Digite o código enviado por {verificacaoTelefone.canal === 'LIGACAO' ? 'ligação' : verificacaoTelefone.canal}.</span>
            </div>
            <button type="button" disabled={processando} onClick={fechar} aria-label="Fechar modal">×</button>
          </header>

          <form onSubmit={confirmarTelefone}>
            <label className="campo-chave-pix">
              <span>Código de 6 números</span>
              <input
                value={codigoTelefone}
                onChange={(evento) => setCodigoTelefone(evento.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                autoFocus
              />
              <small>O código expira em 5 minutos.</small>
            </label>

            {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}

            <footer>
              <button className="botao botao-secundario" type="button" onClick={fechar}>Cancelar</button>
              <button className="botao botao-principal" type="submit" disabled={codigoTelefone.length !== 6 || processando}>
                {processando ? 'Confirmando...' : 'Confirmar telefone'}
              </button>
            </footer>
          </form>
        </section>
      </div>
    )
  }

  let campoChave = (
    <label className="campo-chave-pix">
      <span>{rotuloTipo}</span>
      <input value={formatarChavePix(tipo, valor)} readOnly />
      <small>{tipo === 'email' || tipo === 'telefone'
        ? 'Usaremos o contato cadastrado na sua conta e pediremos uma confirmação.'
        : 'Usaremos o dado confirmado no seu cadastro. Ele não pode ser alterado por aqui.'}</small>
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

        <form onSubmit={cadastrar}>
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

          {campoChave}

          {tipo === 'email' && (
            <div className="aviso-confirmacao-chave">
              <strong>Confirmação por e-mail</strong>
              <span>Enviaremos um link válido por 15 minutos. A chave só será cadastrada depois do clique.</span>
            </div>
          )}

          {tipo === 'telefone' && (
            <fieldset className="canais-confirmacao-pix">
              <legend>Como deseja receber o código?</legend>
              <div>
                {canais.map(([valorCanal, rotulo]) => (
                  <button
                    type="button"
                    key={valorCanal}
                    className={canalTelefone === valorCanal ? 'ativo' : ''}
                    onClick={() => setCanalTelefone(valorCanal)}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}

          <footer>
            <button className="botao botao-secundario" type="button" onClick={fechar}>Cancelar</button>
            <button className="botao botao-principal" type="submit" disabled={!valorValido || processando}>
              {processando ? 'Preparando...' : tipo === 'email' || tipo === 'telefone' ? 'Confirmar contato' : 'Cadastrar chave'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
