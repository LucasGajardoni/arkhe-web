import { useEffect, useRef, useState } from 'react'
import {
  criarConversaMauro,
  enviarMensagemMauro,
  listarConversasMauro,
  listarMensagensMauro,
} from '../../services/mauroService.js'
import './AssistenteMauro.css'

const sugestoes = [
  'Quanto tenho de saldo?',
  'Quais foram minhas últimas movimentações?',
  'Quanto gastei este mês?',
  'Tenho pagamentos agendados?',
]

function horaMensagem(valor) {
  if (!valor) return ''
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? '' : new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(data)
}

export default function AssistenteMauro({ fechar, tipoConta }) {
  const [conversas, setConversas] = useState([])
  const [conversaAtiva, setConversaAtiva] = useState(null)
  const [mensagens, setMensagens] = useState([])
  const [texto, setTexto] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [respondendo, setRespondendo] = useState(false)
  const [erro, setErro] = useState('')
  const [historicoMobileAberto, setHistoricoMobileAberto] = useState(false)
  const listaRef = useRef(null)
  const entradaRef = useRef(null)

  useEffect(() => {
    let ativo = true
    async function iniciar() {
      try {
        const resultado = await listarConversasMauro()
        if (!ativo) return
        const lista = resultado.conversas || []
        setConversas(lista)
        if (lista.length) {
          await selecionarConversa(lista[0].id, ativo)
        } else {
          await novaConversa(ativo)
        }
      } catch (falha) {
        if (ativo) setErro(falha.message || 'Não foi possível abrir o MAURO.')
      } finally {
        if (ativo) setCarregando(false)
      }
    }
    iniciar()
    return () => { ativo = false }
    // Load the account-scoped persisted history only when the panel opens.
  }, [])

  useEffect(() => {
    const area = listaRef.current
    if (area) area.scrollTop = area.scrollHeight
  }, [mensagens, respondendo])

  async function selecionarConversa(id, aindaAtivo = true) {
    setErro('')
    const resultado = await listarMensagensMauro(id)
    if (!aindaAtivo) return
    setConversaAtiva(id)
    setMensagens(resultado.mensagens || [])
    setHistoricoMobileAberto(false)
  }

  async function novaConversa(aindaAtivo = true) {
    setErro('')
    const resultado = await criarConversaMauro()
    if (!aindaAtivo) return
    const nova = resultado.conversa
    setConversas((atual) => [nova, ...atual])
    setConversaAtiva(nova.id)
    setMensagens([])
    setHistoricoMobileAberto(false)
  }

  async function enviar(pergunta = texto) {
    const mensagem = pergunta.trim()
    if (!mensagem || !conversaAtiva || respondendo) return
    setErro('')
    setTexto('')
    setMensagens((atual) => [...atual, {
      id: `local-${Date.now()}`, papel: 'USUARIO', conteudo: mensagem, criada_em: new Date().toISOString(),
    }])
    setRespondendo(true)
    try {
      const resultado = await enviarMensagemMauro(conversaAtiva, mensagem)
      setMensagens((atual) => [...atual, resultado.mensagem])
      setConversas((atual) => atual.map((item) => item.id === conversaAtiva
        ? { ...item, titulo: item.titulo === 'Conversa com MAURO' ? mensagem.slice(0, 70) : item.titulo, ultima_mensagem: resultado.mensagem.conteudo }
        : item))
    } catch (falha) {
      setErro(falha.message || 'Não consegui responder agora. Tente novamente.')
      setMensagens((atual) => atual.filter((item) => !(typeof item.id === 'string' && item.id.startsWith('local-'))))
      setTexto(mensagem)
    } finally {
      setRespondendo(false)
      entradaRef.current?.focus()
    }
  }

  function submeter(evento) {
    evento.preventDefault()
    enviar()
  }

  function tratarTecla(evento) {
    if (evento.key === 'Escape') fechar()
    if (evento.key === 'Enter' && !evento.shiftKey) {
      evento.preventDefault()
      enviar()
    }
  }

  return (
    <div className="mauro-sobreposicao" role="presentation" onMouseDown={(evento) => { if (evento.target === evento.currentTarget) fechar() }}>
      <section className="mauro-painel" role="dialog" aria-modal="true" aria-labelledby="mauro-titulo" onKeyDown={tratarTecla}>
        <aside className="mauro-historico">
          <div className="mauro-historico-topo">
            <span className="mauro-marca-mini">M</span>
            <div><b>MAURO</b><small>Histórico da conta</small></div>
          </div>
          <button className="mauro-nova-conversa" type="button" onClick={() => novaConversa().catch((falha) => setErro(falha.message || 'Não foi possível iniciar uma conversa.'))}>
            <span aria-hidden="true">＋</span> Nova conversa
          </button>
          <div className="mauro-lista-conversas" aria-label="Conversas anteriores">
            {conversas.map((item) => (
              <button key={item.id} type="button" className={item.id === conversaAtiva ? 'selecionada' : ''}
                onClick={() => selecionarConversa(item.id).catch((falha) => setErro(falha.message))}>
                <b>{item.titulo || 'Conversa com MAURO'}</b>
                <small>{item.ultima_mensagem || 'Nova conversa'}</small>
              </button>
            ))}
          </div>
          <p className="mauro-tipo-conta">Conta ativa · {tipoConta}</p>
        </aside>

        <div className="mauro-conversa">
          <header className="mauro-cabecalho">
            <div className="mauro-avatar">M</div>
            <div className="mauro-identidade">
              <h2 id="mauro-titulo">MAURO <span>Assistente do Arkhé</span></h2>
              <small><i /> Consultas seguras da sua conta ativa</small>
            </div>
            <button className="mauro-historico-mobile-botao" type="button" onClick={() => setHistoricoMobileAberto((aberto) => !aberto)} aria-expanded={historicoMobileAberto}>
              Histórico
            </button>
            <button className="mauro-fechar" type="button" onClick={fechar} aria-label="Fechar MAURO">×</button>
          </header>

          {historicoMobileAberto && (
            <div className="mauro-historico-mobile">
              <button className="mauro-nova-conversa" type="button" onClick={() => novaConversa().catch((falha) => setErro(falha.message || 'Não foi possível iniciar uma conversa.'))}>
                <span aria-hidden="true">＋</span> Nova conversa
              </button>
              {conversas.map((item) => (
                <button key={item.id} type="button" className={item.id === conversaAtiva ? 'selecionada' : ''}
                  onClick={() => selecionarConversa(item.id).catch((falha) => setErro(falha.message))}>
                  <b>{item.titulo || 'Conversa com MAURO'}</b><small>{item.ultima_mensagem || 'Nova conversa'}</small>
                </button>
              ))}
            </div>
          )}

          <div className="mauro-mensagens" ref={listaRef} aria-live="polite" aria-busy={carregando || respondendo}>
            {carregando && <div className="mauro-estado">Abrindo seu histórico…</div>}
            {!carregando && mensagens.length === 0 && (
              <div className="mauro-boas-vindas">
                <span className="mauro-boas-vindas-estrela">✦</span>
                <p>SEU ASSISTENTE FINANCEIRO</p>
                <h3>Olá, eu sou o Mauro.</h3>
                <span>Posso consultar dados reais da sua conta e explicar como funciona o Arkhé. O que você quer saber?</span>
                <div className="mauro-sugestoes">
                  {sugestoes.map((sugestao) => <button key={sugestao} type="button" onClick={() => enviar(sugestao)}>{sugestao}<span>↗</span></button>)}
                </div>
              </div>
            )}
            {mensagens.map((item) => (
              <article key={item.id} className={`mauro-mensagem ${item.papel === 'USUARIO' ? 'do-usuario' : 'do-assistente'}`}>
                {item.papel !== 'USUARIO' && <span className="mauro-mini-avatar">M</span>}
                <div className="mauro-balao"><p>{item.conteudo}</p><time>{horaMensagem(item.criada_em)}</time></div>
              </article>
            ))}
            {respondendo && <div className="mauro-digitando"><span /><span /><span /><small>MAURO está pensando</small></div>}
          </div>

          {erro && <p className="mauro-erro" role="alert">{erro}</p>}
          <form className="mauro-compositor" onSubmit={submeter}>
            <label className="visualmente-oculto" htmlFor="mauro-pergunta">Escreva sua pergunta para o MAURO</label>
            <textarea ref={entradaRef} id="mauro-pergunta" value={texto} maxLength={2000}
              placeholder="Pergunte sobre sua conta…" onChange={(evento) => setTexto(evento.target.value)} rows={1} />
            <button type="submit" disabled={!texto.trim() || respondendo || carregando} aria-label="Enviar mensagem">
              {respondendo ? <span className="mauro-enviando" /> : <span aria-hidden="true">↑</span>}
            </button>
            <small>O MAURO consulta sua conta ativa. Ele não realiza operações financeiras.</small>
          </form>
        </div>
      </section>
    </div>
  )
}
