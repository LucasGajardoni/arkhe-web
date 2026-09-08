import { useEffect, useState } from 'react'
import { realizarPix } from '../../services/pixService.js'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export default function ModalPagamentoPix({ usuario, fechar, aoConcluir }) {
  const [etapa, setEtapa] = useState('chave')
  const [chave, setChave] = useState('')
  const [centavos, setCentavos] = useState(0)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    function fecharComEsc(evento) {
      if (evento.key === 'Escape' && !processando) fechar()
    }
    document.addEventListener('keydown', fecharComEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', fecharComEsc)
      document.body.style.overflow = ''
    }
  }, [fechar, processando])

  function fecharAoClicarFora(evento) {
    if (evento.target === evento.currentTarget && !processando) fechar()
  }

  function alterarValor(evento) {
    const digitos = evento.target.value.replace(/\D/g, '').slice(0, 13)
    setCentavos(Number(digitos) || 0)
    setErro('')
  }

  async function enviar() {
    if (processando || centavos <= 0 || !chave.trim()) return
    setProcessando(true)
    setErro('')
    try {
      await realizarPix(chave, centavos / 100)
      await aoConcluir()
      setEtapa('sucesso')
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setProcessando(false)
    }
  }

  let conteudo
  if (etapa === 'chave') {
    conteudo = (
      <form onSubmit={(evento) => { evento.preventDefault(); if (chave.trim()) setEtapa('valor') }}>
        <label className="campo-chave-pix">
          <span>Chave Pix do destinatário</span>
          <input autoFocus value={chave} onChange={(evento) => setChave(evento.target.value)} placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória" />
        </label>
        <footer>
          <button className="botao botao-secundario" type="button" onClick={fechar}>Cancelar</button>
          <button className="botao botao-principal" type="submit" disabled={!chave.trim()}>Continuar</button>
        </footer>
      </form>
    )
  } else if (etapa === 'valor') {
    conteudo = (
      <form onSubmit={(evento) => { evento.preventDefault(); if (centavos > 0) setEtapa('confirmacao') }}>
        <label className="campo-chave-pix campo-valor-pix">
          <span>Valor do Pix</span>
          <input autoFocus inputMode="decimal" value={moeda.format(centavos / 100)} onChange={alterarValor} aria-label="Valor do Pix" />
          <small>Informe um valor maior que zero.</small>
        </label>
        <footer>
          <button className="botao botao-secundario" type="button" onClick={() => setEtapa('chave')}>Voltar</button>
          <button className="botao botao-principal" type="submit" disabled={centavos <= 0}>Revisar Pix</button>
        </footer>
      </form>
    )
  } else if (etapa === 'confirmacao') {
    conteudo = (
      <div className="confirmacao-pagamento-pix">
        <dl>
          <div><dt>Chave Pix</dt><dd>{chave}</dd></div>
          <div><dt>Valor</dt><dd>{moeda.format(centavos / 100)}</dd></div>
          {usuario?.tipoConta && <div><dt>Conta de origem</dt><dd>Conta {usuario.tipoConta}</dd></div>}
        </dl>
        {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}
        <footer>
          <button className="botao botao-secundario" type="button" disabled={processando} onClick={() => setEtapa('valor')}>Voltar</button>
          <button className="botao botao-principal" type="button" disabled={processando} onClick={enviar}>
            {processando ? 'Enviando...' : 'Confirmar e enviar'}
          </button>
        </footer>
      </div>
    )
  } else {
    conteudo = (
      <div className="sucesso-pagamento-pix" role="status">
        <span>✓</span>
        <h3>Pix enviado com sucesso</h3>
        <strong>{moeda.format(centavos / 100)}</strong>
        <p>O pagamento foi concluído e suas movimentações já foram atualizadas.</p>
        <button className="botao botao-principal" type="button" onClick={fechar}>Concluir</button>
      </div>
    )
  }

  return (
    <div className="fundo-modal-perfil" role="presentation" onMouseDown={fecharAoClicarFora}>
      <section className="modal-perfil modal-chave-pix modal-pagamento-pix" role="dialog" aria-modal="true" aria-labelledby="titulo-pagamento-pix">
        <header>
          <div><p>PAGAR COM PIX</p><h2 id="titulo-pagamento-pix">Enviar um Pix</h2><span>Transferência instantânea pela sua conta atual.</span></div>
          <button type="button" disabled={processando} onClick={fechar} aria-label="Fechar modal">×</button>
        </header>
        {conteudo}
      </section>
    </div>
  )
}
