import { useEffect, useRef, useState } from 'react'
import {
  criarConversaMauro,
  cancelarPropostaPixMauro,
  confirmarPropostaPixMauro,
  enviarMensagemMauro,
  listarConversasMauro,
  listarMensagensMauro,
  transcreverAudioMauro,
} from '../../services/mauroService.js'
import './AssistenteMauro.css'

const sugestoes = [
  'Quanto tenho de saldo?',
  'Quais foram minhas últimas movimentações?',
  'Quanto gastei este mês?',
  'Mauro, quero fazer um Pix.',
]

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function rotuloStatusPix(status) {
  return ({
    COLETANDO: 'Faltam dados', PREPARADA: 'Aguardando sua confirmação',
    EXECUTADA: 'Pix enviado', CANCELADA: 'Cancelada', EXPIRADA: 'Expirada',
    RECUSADA: 'Recusada', ALTERADA: 'Substituída por uma nova proposta',
  })[status] || status
}

function horaMensagem(valor) {
  if (!valor) return ''
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? '' : new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(data)
}

function mensagemErro(falha, padrao) {
  if (/GEMINI_API_KEY.*não está configurada/i.test(falha?.message || '')) {
    return 'O MAURO está temporariamente indisponível. A configuração do assistente no Arkhé ainda precisa ser concluída.'
  }
  return falha?.message || padrao
}

function formatarTrecho(texto, chaveBase) {
  const partes = texto.split(/(\*\*[^*]+?\*\*|__[^_]+?__|\*[^*\n]+?\*|_[^_\n]+?_|`[^`\n]+?`)/g)
  return partes.map((parte, indice) => {
    const chave = `${chaveBase}-${indice}`
    if ((parte.startsWith('**') && parte.endsWith('**')) || (parte.startsWith('__') && parte.endsWith('__'))) {
      return <strong key={chave}>{parte.slice(2, -2)}</strong>
    }
    if ((parte.startsWith('*') && parte.endsWith('*')) || (parte.startsWith('_') && parte.endsWith('_'))) {
      return <em key={chave}>{parte.slice(1, -1)}</em>
    }
    if (parte.startsWith('`') && parte.endsWith('`')) {
      return <code key={chave}>{parte.slice(1, -1)}</code>
    }
    return parte
  })
}

function MensagemFormatada({ texto }) {
  const linhas = String(texto || '').split(/\r?\n/)
  const blocos = []
  let paragrafo = []
  const fecharParagrafo = () => {
    if (!paragrafo.length) return
    blocos.push({ tipo: 'p', linhas: paragrafo })
    paragrafo = []
  }

  for (const linha of linhas) {
    const lista = linha.match(/^\s*[-*]\s+(.+)$/)
    const ordenada = linha.match(/^\s*\d+[.)]\s+(.+)$/)
    const titulo = linha.match(/^\s{0,3}(#{1,3})\s+(.+)$/)
    if (!linha.trim()) {
      fecharParagrafo()
    } else if (lista || ordenada) {
      fecharParagrafo()
      const tipo = lista ? 'ul' : 'ol'
      const item = (lista || ordenada)[1]
      const anterior = blocos[blocos.length - 1]
      if (anterior?.tipo === tipo) anterior.itens.push(item)
      else blocos.push({ tipo, itens: [item] })
    } else if (titulo) {
      fecharParagrafo()
      blocos.push({ tipo: 'h', nivel: titulo[1].length, texto: titulo[2] })
    } else {
      paragrafo.push(linha)
    }
  }
  fecharParagrafo()

  return blocos.map((bloco, indice) => {
    if (bloco.tipo === 'ul' || bloco.tipo === 'ol') {
      const Lista = bloco.tipo === 'ul' ? 'ul' : 'ol'
      return <Lista key={`lista-${indice}`}>{bloco.itens.map((item, itemIndice) => <li key={itemIndice}>{formatarTrecho(item, `lista-${indice}-${itemIndice}`)}</li>)}</Lista>
    }
    if (bloco.tipo === 'h') {
      const Titulo = `h${bloco.nivel}`
      return <Titulo key={`titulo-${indice}`}>{formatarTrecho(bloco.texto, `titulo-${indice}`)}</Titulo>
    }
    return <p key={`paragrafo-${indice}`}>{formatarTrecho(bloco.linhas.join(' '), `paragrafo-${indice}`)}</p>
  })
}

export default function AssistenteMauro({ fechar, tipoConta }) {
  const [conversas, setConversas] = useState([])
  const [conversaAtiva, setConversaAtiva] = useState(null)
  const [mensagens, setMensagens] = useState([])
  const [texto, setTexto] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [respondendo, setRespondendo] = useState(false)
  const [erro, setErro] = useState('')
  const [propostaPix, setPropostaPix] = useState(null)
  const [mostrarConfirmacaoPix, setMostrarConfirmacaoPix] = useState(false)
  const [pinPix, setPinPix] = useState('')
  const [processandoPix, setProcessandoPix] = useState(false)
  const [historicoMobileAberto, setHistoricoMobileAberto] = useState(false)
  const [gravandoAudio, setGravandoAudio] = useState(false)
  const [transcrevendoAudio, setTranscrevendoAudio] = useState(false)
  const [textoTranscrito, setTextoTranscrito] = useState(false)
  const listaRef = useRef(null)
  const entradaRef = useRef(null)
  const gravadorRef = useRef(null)
  const streamAudioRef = useRef(null)
  const partesAudioRef = useRef([])
  const cancelarAudioRef = useRef(false)
  const temporizadorAudioRef = useRef(null)

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
        if (ativo) setErro(mensagemErro(falha, 'Não foi possível abrir o MAURO.'))
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

  useEffect(() => () => {
    cancelarAudioRef.current = true
    clearTimeout(temporizadorAudioRef.current)
    if (gravadorRef.current?.state === 'recording') gravadorRef.current.stop()
    streamAudioRef.current?.getTracks().forEach((faixa) => faixa.stop())
  }, [])

  async function selecionarConversa(id, aindaAtivo = true) {
    setErro('')
    const resultado = await listarMensagensMauro(id)
    if (!aindaAtivo) return
    setConversaAtiva(id)
    setMensagens(resultado.mensagens || [])
    setPropostaPix(resultado.proposta_pix || null)
    setMostrarConfirmacaoPix(false)
    setPinPix('')
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
    setPropostaPix(null)
    setMostrarConfirmacaoPix(false)
    setPinPix('')
    setHistoricoMobileAberto(false)
  }

  async function enviar(pergunta = texto) {
    const mensagem = pergunta.trim()
    if (!mensagem || !conversaAtiva || respondendo) return
    setErro('')
    setTexto('')
    setTextoTranscrito(false)
    setMensagens((atual) => [...atual, {
      id: `local-${Date.now()}`, papel: 'USUARIO', conteudo: mensagem, criada_em: new Date().toISOString(),
    }])
    setRespondendo(true)
    try {
      const resultado = await enviarMensagemMauro(conversaAtiva, mensagem)
      setMensagens((atual) => [...atual, resultado.mensagem])
      if (resultado.proposta_pix) setPropostaPix(resultado.proposta_pix)
      setMostrarConfirmacaoPix(false)
      setPinPix('')
      setConversas((atual) => atual.map((item) => item.id === conversaAtiva
        ? { ...item, titulo: item.titulo === 'Conversa com MAURO' ? mensagem.slice(0, 70) : item.titulo, ultima_mensagem: resultado.mensagem.conteudo }
        : item))
    } catch (falha) {
      setErro(mensagemErro(falha, 'Não consegui responder agora. Tente novamente.'))
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

  function pararFluxoDeAudio() {
    clearTimeout(temporizadorAudioRef.current)
    streamAudioRef.current?.getTracks().forEach((faixa) => faixa.stop())
    streamAudioRef.current = null
    gravadorRef.current = null
    setGravandoAudio(false)
  }

  async function iniciarAudio() {
    setErro('')
    if (!conversaAtiva || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setErro('Este navegador não oferece gravação de áudio para o MAURO.')
      return
    }
    try {
      cancelarAudioRef.current = false
      partesAudioRef.current = []
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamAudioRef.current = stream
      const tipos = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg']
      const mimeType = tipos.find((tipo) => MediaRecorder.isTypeSupported?.(tipo))
      const gravador = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      gravadorRef.current = gravador
      gravador.ondataavailable = (evento) => {
        if (evento.data?.size) partesAudioRef.current.push(evento.data)
      }
      gravador.onstop = async () => {
        const blob = new Blob(partesAudioRef.current, { type: gravador.mimeType || 'audio/webm' })
        partesAudioRef.current = []
        pararFluxoDeAudio()
        if (cancelarAudioRef.current || !blob.size) return
        setTranscrevendoAudio(true)
        try {
          const resultado = await transcreverAudioMauro(conversaAtiva, blob)
          setTexto(resultado.transcricao || '')
          setTextoTranscrito(Boolean(resultado.transcricao))
          entradaRef.current?.focus()
        } catch (falha) {
          setErro(falha.message || 'Não foi possível transcrever o áudio.')
        } finally {
          setTranscrevendoAudio(false)
        }
      }
      gravador.start()
      setGravandoAudio(true)
      temporizadorAudioRef.current = setTimeout(() => {
        if (gravadorRef.current?.state === 'recording') gravadorRef.current.stop()
      }, 30000)
    } catch (falha) {
      pararFluxoDeAudio()
      setErro(falha.name === 'NotAllowedError'
        ? 'Permita o microfone no navegador para gravar uma pergunta.'
        : 'Não consegui iniciar a gravação. Verifique o microfone e tente novamente.')
    }
  }

  function concluirAudio() {
    if (gravadorRef.current?.state === 'recording') gravadorRef.current.stop()
  }

  function cancelarAudio() {
    cancelarAudioRef.current = true
    partesAudioRef.current = []
    if (gravadorRef.current?.state === 'recording') gravadorRef.current.stop()
    pararFluxoDeAudio()
  }

  async function cancelarPix() {
    if (!propostaPix || processandoPix) return
    setProcessandoPix(true)
    setErro('')
    try {
      const resultado = await cancelarPropostaPixMauro(conversaAtiva, propostaPix.id)
      setPropostaPix(resultado.proposta_pix || null)
      setMostrarConfirmacaoPix(false)
      setPinPix('')
      setMensagens((atuais) => [...atuais, {
        id: `pix-cancelado-${Date.now()}`, papel: 'ASSISTENTE',
        conteudo: resultado.mensagem || 'Proposta cancelada. Nenhum Pix foi enviado.',
        criada_em: new Date().toISOString(),
      }])
    } catch (falha) {
      setErro(falha.message || 'Não foi possível cancelar a proposta.')
      if (falha.dados?.proposta_pix) setPropostaPix(falha.dados.proposta_pix)
    } finally {
      setProcessandoPix(false)
    }
  }

  async function confirmarPix(evento) {
    evento.preventDefault()
    if (!propostaPix || processandoPix || !/^\d{6}$/.test(pinPix)) return
    setProcessandoPix(true)
    setErro('')
    try {
      const resultado = await confirmarPropostaPixMauro(conversaAtiva, propostaPix.id, pinPix)
      setPropostaPix(resultado.proposta_pix || null)
      setMostrarConfirmacaoPix(false)
      setMensagens((atuais) => [...atuais, {
        id: `pix-resultado-${Date.now()}`, papel: 'ASSISTENTE',
        conteudo: resultado.mensagem || 'A solicitação foi processada.',
        criada_em: new Date().toISOString(),
      }])
    } catch (falha) {
      setErro(falha.message || 'Não foi possível confirmar o Pix.')
      if (falha.dados?.proposta_pix) setPropostaPix(falha.dados.proposta_pix)
    } finally {
      setPinPix('')
      setProcessandoPix(false)
    }
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
                <div className="mauro-balao"><MensagemFormatada texto={item.conteudo} /><time>{horaMensagem(item.criada_em)}</time></div>
              </article>
            ))}
            {propostaPix && (
              <section className={`mauro-pix-proposta status-${String(propostaPix.status || '').toLowerCase()}`} aria-label="Resumo da proposta de Pix">
                <div className="mauro-pix-proposta-topo">
                  <span aria-hidden="true">↗</span>
                  <div><small>PROPOSTA PIX</small><b>{rotuloStatusPix(propostaPix.status)}</b></div>
                </div>
                <dl>
                  <div><dt>Valor</dt><dd>{propostaPix.valor != null ? moeda.format(Number(propostaPix.valor)) : 'A informar'}</dd></div>
                  <div><dt>Origem</dt><dd>{propostaPix.origem || 'Conta ativa'}</dd></div>
                  <div><dt>Destinatário</dt><dd>{propostaPix.destinatario || 'A informar'}{propostaPix.conta_destino ? <small>{propostaPix.conta_destino}</small> : null}</dd></div>
                  {propostaPix.expira_em && propostaPix.status === 'PREPARADA' && <div><dt>Validade</dt><dd>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(propostaPix.expira_em))}</dd></div>}
                  {propostaPix.id_movimentacao && <div><dt>Movimentação</dt><dd>#{propostaPix.id_movimentacao}</dd></div>}
                </dl>
                {propostaPix.status === 'PREPARADA' && (
                  <div className="mauro-pix-acoes">
                    {!mostrarConfirmacaoPix ? (
                      <button type="button" className="mauro-pix-confirmar" disabled={processandoPix} onClick={() => setMostrarConfirmacaoPix(true)}>Confirmar Pix</button>
                    ) : (
                      <form className="mauro-pix-pin" onSubmit={confirmarPix}>
                        <label htmlFor="mauro-pin-pix">PIN pessoal para autorizar</label>
                        <input id="mauro-pin-pix" type="password" inputMode="numeric" autoComplete="off" maxLength={6} pattern="[0-9]{6}" value={pinPix} onChange={(evento) => setPinPix(evento.target.value.replace(/\D/g, '').slice(0, 6))} aria-describedby="mauro-pin-aviso" />
                        <small id="mauro-pin-aviso">O PIN é enviado diretamente ao Flask e não entra no chat nem no histórico.</small>
                        <button type="submit" className="mauro-pix-confirmar" disabled={processandoPix || pinPix.length !== 6}>{processandoPix ? 'Validando…' : 'Autorizar e enviar Pix'}</button>
                      </form>
                    )}
                    <button type="button" className="mauro-pix-cancelar" disabled={processandoPix} onClick={cancelarPix}>Cancelar</button>
                  </div>
                )}
                {propostaPix.status === 'COLETANDO' && <button type="button" className="mauro-pix-cancelar sozinho" disabled={processandoPix} onClick={cancelarPix}>Cancelar proposta</button>}
                {propostaPix.motivo && <p className="mauro-pix-motivo">{propostaPix.motivo}</p>}
                <p className="mauro-pix-seguranca">Nenhum valor é reservado. Saldo, acesso e limites serão verificados novamente no momento da autorização.</p>
              </section>
            )}
            {respondendo && <div className="mauro-digitando"><span /><span /><span /><small>MAURO está pensando</small></div>}
          </div>

          {erro && <p className="mauro-erro" role="alert">{erro}</p>}
          {gravandoAudio && (
            <div className="mauro-audio-status" role="status">
              <span><i /> Gravando áudio · até 30 segundos</span>
              <button type="button" onClick={concluirAudio}>Concluir gravação</button>
              <button type="button" onClick={cancelarAudio}>Cancelar</button>
            </div>
          )}
          {transcrevendoAudio && <p className="mauro-audio-status" role="status">Transcrevendo no backend do Arkhé…</p>}
          {textoTranscrito && <p className="mauro-audio-revisao" role="status">Revise a transcrição no campo de texto antes de enviar ao MAURO.</p>}
          <form className="mauro-compositor" onSubmit={submeter}>
            <label className="visualmente-oculto" htmlFor="mauro-pergunta">Escreva sua pergunta para o MAURO</label>
            <textarea ref={entradaRef} id="mauro-pergunta" value={texto} maxLength={2000}
              placeholder="Pergunte sobre sua conta…" onChange={(evento) => setTexto(evento.target.value)} rows={1} />
            <button type="button" className={`mauro-microfone ${gravandoAudio ? 'gravando' : ''}`}
              onClick={gravandoAudio ? concluirAudio : iniciarAudio}
              disabled={respondendo || carregando || transcrevendoAudio}
              aria-label={gravandoAudio ? 'Concluir gravação de áudio' : 'Gravar pergunta por áudio'}>
              <span aria-hidden="true">{gravandoAudio ? '■' : '🎙'}</span>
            </button>
            <button type="submit" disabled={!texto.trim() || respondendo || carregando} aria-label="Enviar mensagem">
              {respondendo ? <span className="mauro-enviando" /> : <span aria-hidden="true">↑</span>}
            </button>
            <small>O áudio é transcrito pelo backend Gemini e não é salvo. Revise o texto antes de enviar. O MAURO consulta sua conta ativa; Pix só é enviado após sua confirmação e PIN.</small>
          </form>
        </div>
      </section>
    </div>
  )
}
