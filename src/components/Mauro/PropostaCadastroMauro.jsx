import { useEffect, useRef, useState } from 'react'
import { cancelarCadastroMauro, confirmarCadastroMauro, verificarChaveCadastroMauro } from '../../services/mauroService.js'
import { confirmarTelefonePix, iniciarConfirmacaoEmailPix, iniciarConfirmacaoTelefonePix } from '../../services/pixService.js'

const rotulos = {
  COLETANDO: 'Faltam dados', PREPARADA: 'Confira antes de confirmar',
  VERIFICANDO: 'Aguardando verificação de posse', EXECUTADA: 'Concluída',
  CANCELADA: 'Cancelada', EXPIRADA: 'Expirada', RECUSADA: 'Recusada', ALTERADA: 'Substituída',
}

export default function PropostaCadastroMauro({ proposta, idConversa, desabilitado, aoAtualizar }) {
  const [pin, setPin] = useState('')
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [idVerificacao, setIdVerificacao] = useState(null)
  const [codigo, setCodigo] = useState('')
  const [canal, setCanal] = useState('SMS')
  const enviandoRef = useRef(false)
  const ativoRef = useRef(true)
  const entradaPinRef = useRef(null)
  useEffect(() => {
    ativoRef.current = true
    return () => { ativoRef.current = false }
  }, [])

  async function confirmar(evento) {
    evento.preventDefault()
    if (enviandoRef.current || desabilitado || !/^\d{6}$/.test(pin)) return
    enviandoRef.current = true
    setProcessando(true)
    setErro('')
    try {
      const resultado = await confirmarCadastroMauro(idConversa, proposta.id, pin)
      if (ativoRef.current) aoAtualizar(resultado)
    } catch (falha) {
      if (ativoRef.current) {
        if (falha.dados?.proposta_cadastro) aoAtualizar({ proposta_cadastro: falha.dados.proposta_cadastro })
        setErro(falha.message || 'Não foi possível confirmar a operação.')
        entradaPinRef.current?.focus()
      }
    } finally {
      enviandoRef.current = false
      if (ativoRef.current) {
        setPin('')
        setProcessando(false)
      }
    }
  }

  async function cancelar() {
    if (enviandoRef.current || desabilitado) return
    enviandoRef.current = true
    setProcessando(true)
    setErro('')
    try {
      const resultado = await cancelarCadastroMauro(idConversa, proposta.id)
      if (ativoRef.current) aoAtualizar(resultado)
    } catch (falha) {
      if (ativoRef.current) setErro(falha.message || 'Não foi possível cancelar a proposta.')
    } finally {
      enviandoRef.current = false
      if (ativoRef.current) setProcessando(false)
    }
  }

  async function iniciarVerificacao() {
    if (enviandoRef.current || desabilitado) return
    enviandoRef.current = true
    setProcessando(true)
    setErro('')
    try {
      const estado = await verificarChaveCadastroMauro(idConversa, proposta.id)
      if (!ativoRef.current) return
      if (estado.proposta_cadastro?.status !== 'VERIFICANDO') {
        aoAtualizar(estado)
        return
      }
      const resultado = proposta.tipo_chave === 'email'
        ? await iniciarConfirmacaoEmailPix()
        : await iniciarConfirmacaoTelefonePix(canal)
      if (ativoRef.current) {
        setIdVerificacao(resultado.id_verificacao || null)
        setAviso(resultado.mensagem)
      }
    } catch (falha) {
      if (ativoRef.current) setErro(falha.message)
    } finally {
      enviandoRef.current = false
      if (ativoRef.current) setProcessando(false)
    }
  }

  async function conferirVerificacao(evento) {
    evento?.preventDefault()
    if (enviandoRef.current || desabilitado) return
    enviandoRef.current = true
    setProcessando(true)
    setErro('')
    try {
      if (proposta.tipo_chave === 'telefone' && idVerificacao) {
        await confirmarTelefonePix(idVerificacao, codigo)
      }
      const resultado = await verificarChaveCadastroMauro(idConversa, proposta.id)
      if (ativoRef.current) {
        if (resultado.proposta_cadastro?.status === 'EXECUTADA') aoAtualizar(resultado)
        else setAviso('A confirmação ainda está pendente. Confira o link ou código recebido.')
      }
    } catch (falha) {
      if (ativoRef.current) setErro(falha.message)
    } finally {
      enviandoRef.current = false
      if (ativoRef.current) {
        setCodigo('')
        setProcessando(false)
      }
    }
  }

  const bloqueado = processando || desabilitado
  return (
    <section className="mauro-pix-proposta mauro-cadastro-proposta" aria-label="Proposta de cadastro" aria-busy={processando}>
      <div className="mauro-pix-proposta-topo">
        <div><small>PROPOSTA DE CADASTRO</small><b>{rotulos[proposta.status] || proposta.status}</b></div>
      </div>
      <p>{proposta.resumo}</p>
      {proposta.status === 'PREPARADA' && (
        <form className="mauro-pix-pin" onSubmit={confirmar}>
          <label htmlFor="mauro-pin-cadastro">PIN pessoal para confirmar esta alteração</label>
          <input
            ref={entradaPinRef}
            id="mauro-pin-cadastro"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            pattern="[0-9]{6}"
            value={pin}
            disabled={bloqueado}
            onChange={(evento) => setPin(evento.target.value.replace(/\D/g, '').slice(0, 6))}
            aria-describedby="mauro-cadastro-aviso"
          />
          <small id="mauro-cadastro-aviso">O PIN vai diretamente ao banco. Ele não entra no chat nem no histórico.</small>
          <button className="mauro-pix-confirmar" type="submit" disabled={bloqueado || pin.length !== 6}>
            {processando ? 'Validando…' : 'Confirmar alteração'}
          </button>
        </form>
      )}
      {['COLETANDO', 'PREPARADA', 'VERIFICANDO'].includes(proposta.status) && (
        <button className="mauro-pix-cancelar" type="button" disabled={bloqueado} onClick={cancelar}>Cancelar proposta</button>
      )}
      {proposta.status === 'VERIFICANDO' && (
        <div className="mauro-cadastro-verificacao">
          <p>Confirme a posse da chave usando o mesmo processo de verificação do banco.</p>
          {proposta.tipo_chave === 'telefone' && !idVerificacao && (
            <label>Receber código por
              <select value={canal} onChange={(evento) => setCanal(evento.target.value)} disabled={bloqueado}>
                <option value="SMS">SMS</option><option value="LIGACAO">Ligação</option>
              </select>
            </label>
          )}
          <button type="button" disabled={bloqueado} onClick={iniciarVerificacao}>
            {proposta.tipo_chave === 'email' ? 'Enviar link de confirmação' : 'Enviar novo código'}
          </button>
          {proposta.tipo_chave === 'telefone' && idVerificacao && (
            <form onSubmit={conferirVerificacao}>
              <label htmlFor="mauro-codigo-chave">Código recebido</label>
              <input id="mauro-codigo-chave" inputMode="numeric" autoComplete="one-time-code" value={codigo} maxLength={6}
                disabled={bloqueado} onChange={(evento) => setCodigo(evento.target.value.replace(/\D/g, '').slice(0, 6))} />
              <button type="submit" disabled={bloqueado || codigo.length !== 6}>Confirmar telefone</button>
            </form>
          )}
          {proposta.tipo_chave === 'email' && (
            <button type="button" disabled={bloqueado} onClick={conferirVerificacao}>Já confirmei o e-mail</button>
          )}
        </div>
      )}
      {aviso && <p role="status">{aviso}</p>}
      {proposta.resultado && <p role="status">{proposta.resultado}</p>}
      {erro && <p className="mauro-erro" role="alert">{erro}</p>}
    </section>
  )
}
