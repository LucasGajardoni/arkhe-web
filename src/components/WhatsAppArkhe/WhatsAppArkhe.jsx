import { useEffect, useRef, useState } from 'react'
import { requisitarApi } from '../../services/authService.js'
import './WhatsAppArkhe.css'

const niveis = [
  { valor: 1, titulo: 'Consultas', detalhe: 'Consultas de saldo, extrato e outras informações da conta, após vinculação.' },
  { valor: 2, titulo: 'Serviços', detalhe: 'Consultas e transações bancárias, quando habilitadas na integração.' },
  { valor: 3, titulo: 'Movimentações', detalhe: 'Para PJ: consultas, transações e emissão de boletos e cobranças, quando habilitadas.' },
]

export default function WhatsAppArkhe() {
  const [config, setConfig] = useState(null)
  const [nivel, setNivel] = useState(1)
  const [tipoConta, setTipoConta] = useState(0)
  const [aberta, setAberta] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const fecharRef = useRef(null)

  useEffect(() => {
    let ativo = true
    requisitarApi('/whatsapp/configuracao').then(dados => {
      if (!ativo) return
      setConfig(dados)
      setTipoConta(Number(dados.tipo_conta) || 0)
      setNivel(Number(dados.tipo_conta) === 0 ? Math.min(2, Number(dados.nivel) || 1) : Number(dados.nivel) || 1)
      // Convite apenas para quem ainda nao autorizou. Reaparece ao voltar para a pagina.
      if (!Boolean(dados.autorizado)) setAberta(true)
    }).catch(() => {
      // Nunca interromper o banco com uma modal se a API de WhatsApp falhar.
    })
    return () => { ativo = false }
  }, [])

  useEffect(() => {
    if (!aberta) return undefined
    const anterior = document.activeElement
    fecharRef.current?.focus()
    function teclado(e) { if (e.key === 'Escape' && !salvando) setAberta(false) }
    document.addEventListener('keydown', teclado)
    return () => {
      document.removeEventListener('keydown', teclado)
      if (anterior?.isConnected) anterior.focus()
    }
  }, [aberta, salvando])

  async function autorizar() {
    if (salvando) return
    setSalvando(true)
    setErro('')
    setMensagem('')
    try {
      const dados = await requisitarApi('/whatsapp/configuracao', {
        method: 'PUT', dados: { autorizado: true, nivel },
      })
      setConfig(dados)
      const envio = await requisitarApi('/whatsapp/ativar', { method: 'POST' })
      setMensagem(envio.mensagem || 'Mensagem enviada. Confira seu WhatsApp.')
    } catch (e) { setErro(e.message || 'Não foi possível autorizar o WhatsApp.') }
    finally { setSalvando(false) }
  }

  async function iniciar() {
    if (salvando) return
    setSalvando(true)
    setErro('')
    try {
      const envio = await requisitarApi('/whatsapp/ativar', { method: 'POST' })
      setMensagem(envio.mensagem || 'Mensagem enviada. Confira seu WhatsApp.')
    } catch (e) {
      setErro(e.message || 'Não foi possível enviar a mensagem.')
    } finally { setSalvando(false) }
  }

  if (!aberta) return null

  return (
    <div className="arkhe-wa-overlay" onMouseDown={e => { if (e.target === e.currentTarget && !salvando) setAberta(false) }}>
      <section className="arkhe-wa-modal" role="dialog" aria-modal="true" aria-labelledby="arkhe-wa-titulo">
        <button ref={fecharRef} className="arkhe-wa-fechar" type="button" aria-label="Fechar convite" onClick={() => setAberta(false)}>×</button>
        <div className="arkhe-wa-arte" aria-hidden="true">
          <span className="arkhe-wa-marca">ARKHÉ <span>•</span> DIGITAL</span>
          <div className="arkhe-wa-ilustracao">
            <span className="arkhe-wa-bolha arkhe-wa-bolha-um">Olá, Arkhé!</span>
            <span className="arkhe-wa-bolha arkhe-wa-bolha-dois">Olá! Como posso ajudar?</span>
            <div className="arkhe-wa-celular"><span>✦</span><strong>Arkhé</strong><small>Seu assistente, sempre por perto</small></div>
          </div>
          <div className="arkhe-wa-arte-rodape">O próximo jeito de conversar com seu banco.</div>
        </div>
        <div className="arkhe-wa-conteudo">
          <span className="arkhe-wa-etiqueta">NOVIDADE NO ARKHÉ</span>
          <h2 id="arkhe-wa-titulo">O seu banco,<br /><em>na sua conversa.</em></h2>
          <p className="arkhe-wa-intro">Conheça o assistente Arkhé no WhatsApp. Ative a integração em poucos passos, com controle de permissões direto pela sua conta.</p>
          <div className="arkhe-wa-recursos"><span>✓ Atendimento por mensagem</span><span>✓ Autorização por conta</span><span>✓ Controle de acesso</span></div>
          {!config?.autorizado ? (
            <>
              <label className="arkhe-wa-label" htmlFor="arkhe-wa-nivel">Escolha o nível de autorização</label>
              <div className="arkhe-wa-select">
                <select id="arkhe-wa-nivel" value={nivel} disabled={salvando} onChange={e => setNivel(Number(e.target.value))}>
                  {niveis.filter(n => tipoConta === 1 || n.valor <= 2).map(n => <option key={n.valor} value={n.valor}>Nível {n.valor} — {n.titulo}</option>)}
                </select>
              </div>
              <p className="arkhe-wa-descricao">{niveis.find(n => n.valor === nivel)?.detalhe}</p>
              <button type="button" className="arkhe-wa-primario" onClick={autorizar} disabled={salvando}>{salvando ? 'Salvando...' : 'Autorizar e continuar'} <span>→</span></button>
            </>
          ) : (
            <>
              <div className="arkhe-wa-confirmado">✓ Autorização salva para esta conta</div>
              <button type="button" className="arkhe-wa-primario" onClick={iniciar} disabled={salvando}>{salvando ? 'Preparando...' : 'Reenviar mensagem de ativação'} <span>↗</span></button>
            </>
          )}
          <button type="button" className="arkhe-wa-depois" onClick={() => setAberta(false)}>Agora não</button>
          {mensagem && <p className="arkhe-wa-sucesso" role="status">{mensagem}</p>}
          {erro && <p className="arkhe-wa-erro" role="alert">{erro}</p>}
          <p className="arkhe-wa-aviso">O WhatsApp será ativado somente após a confirmação ATIVAR. As operações bancárias dependem das permissões habilitadas.</p>
        </div>
      </section>
    </div>
  )
}
