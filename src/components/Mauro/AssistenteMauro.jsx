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
import PropostaCadastroMauro from './PropostaCadastroMauro.jsx'

const sugestoes = [
  'Quanto tenho de saldo?',
  'Quais foram minhas últimas movimentações?',
  'Quanto gastei este mês?',
  'Mauro, quero fazer um Pix.',
]

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const LIMITE_AUDIO_BYTES = 8 * 1024 * 1024

function formatarDuracaoAudio(milissegundos) {
  const segundos = Math.floor(milissegundos / 1000)
  return `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`
}

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

export default function AssistenteMauro({ fechar, tipoConta, aoAtualizarPerfil }) {
  const [conversas, setConversas] = useState([])
  const [conversaAtiva, setConversaAtiva] = useState(null)
  const [mensagens, setMensagens] = useState([])
  const [texto, setTexto] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [respondendo, setRespondendo] = useState(false)
  const [erro, setErro] = useState('')
  const [propostaPix, setPropostaPix] = useState(null)
  const [propostaCadastro, setPropostaCadastro] = useState(null)
  const [opcoes, setOpcoes] = useState(sugestoes)
  const [temAnteriores, setTemAnteriores] = useState(false)
  const [carregandoAnteriores, setCarregandoAnteriores] = useState(false)
  const [mostrarConfirmacaoPix, setMostrarConfirmacaoPix] = useState(false)
  const [pinPix, setPinPix] = useState('')
  const [processandoPix, setProcessandoPix] = useState(false)
  const [historicoMobileAberto, setHistoricoMobileAberto] = useState(false)
  const [gravandoAudio, setGravandoAudio] = useState(false)
  const [tempoAudioMs, setTempoAudioMs] = useState(0)
  const [audioNiveis, setAudioNiveis] = useState([])
  const [transcrevendoAudio, setTranscrevendoAudio] = useState(false)
  const [textoTranscrito, setTextoTranscrito] = useState(false)
  const listaRef = useRef(null)
  const entradaRef = useRef(null)
  const gravadorRef = useRef(null)
  const streamAudioRef = useRef(null)
  const partesAudioRef = useRef([])
  const cancelarAudioRef = useRef(false)
  const audioContextRef = useRef(null)
  const frameAudioRef = useRef(null)
  const inicioAudioRef = useRef(0)
  const audioExcedeuLimiteRef = useRef(false)
  const ativoRef = useRef(true)
  const versaoConversaRef = useRef(0)
  const conversaRef = useRef(null)
  const enviandoRef = useRef(false)
  const scrollAnteriorRef = useRef(null)

  useEffect(() => {
    let ativo = true
    ativoRef.current = true
    const versao = ++versaoConversaRef.current
    async function iniciar() {
      try {
        const resultado = await listarConversasMauro()
        if (!ativo || versao !== versaoConversaRef.current) return
        const lista = resultado.conversas || []
        setConversas(lista)
        let id = lista[0]?.id
        if (!id) {
          const criada = await criarConversaMauro()
          if (!ativo || versao !== versaoConversaRef.current) return
          id = criada.conversa.id
          setConversas([criada.conversa])
        }
        const historico = await listarMensagensMauro(id)
        if (!ativo || versao !== versaoConversaRef.current) return
        conversaRef.current = id
        setConversaAtiva(id)
        setMensagens(historico.mensagens || [])
        setPropostaPix(historico.proposta_pix || null)
        setPropostaCadastro(historico.proposta_cadastro || null)
        setTemAnteriores(Boolean(historico.tem_anteriores))
        setOpcoes(historico.sugestoes || sugestoes)
      } catch (falha) {
        if (ativo && versao === versaoConversaRef.current) setErro(mensagemErro(falha, 'Não foi possível abrir o MAURO.'))
      } finally {
        if (ativo && versao === versaoConversaRef.current) setCarregando(false)
      }
    }
    iniciar()
    return () => {
      ativo = false
      ativoRef.current = false
      versaoConversaRef.current += 1
    }
  }, [])

  useEffect(() => {
    const area = listaRef.current
    if (area && scrollAnteriorRef.current) {
      area.scrollTop = area.scrollHeight - scrollAnteriorRef.current.altura + scrollAnteriorRef.current.posicao
      scrollAnteriorRef.current = null
    } else if (area) area.scrollTop = area.scrollHeight
  }, [mensagens, respondendo])

  useEffect(() => () => {
    cancelarAudioRef.current = true
    if (frameAudioRef.current) cancelAnimationFrame(frameAudioRef.current)
    if (gravadorRef.current?.state === 'recording') gravadorRef.current.stop()
    streamAudioRef.current?.getTracks().forEach((faixa) => faixa.stop())
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {})
    }
  }, [])

  async function selecionarConversa(id, aindaAtivo = true) {
    const versao = ++versaoConversaRef.current
    cancelarAudio()
    setTranscrevendoAudio(false)
    setTexto('')
    conversaRef.current = id
    enviandoRef.current = false
    setRespondendo(false)
    setProcessandoPix(false)
    setCarregandoAnteriores(false)
    setCarregando(true)
    setErro('')
    setConversaAtiva(id)
    setMensagens([])
    setPropostaCadastro(null)
    scrollAnteriorRef.current = null
    setPropostaPix(null)
    setTemAnteriores(false)
    setMostrarConfirmacaoPix(false)
    setPinPix('')
    setHistoricoMobileAberto(false)
    try {
      const resultado = await listarMensagensMauro(id)
      if (!aindaAtivo || !ativoRef.current || versao !== versaoConversaRef.current) return
      setMensagens(resultado.mensagens || [])
      setPropostaPix(resultado.proposta_pix || null)
      setPropostaCadastro(resultado.proposta_cadastro || null)
      setTemAnteriores(Boolean(resultado.tem_anteriores))
      setOpcoes(resultado.sugestoes || sugestoes)
    } finally {
      if (ativoRef.current && versao === versaoConversaRef.current) setCarregando(false)
    }
  }

  async function novaConversa(aindaAtivo = true) {
    const versao = ++versaoConversaRef.current
    cancelarAudio()
    setTranscrevendoAudio(false)
    setProcessandoPix(false)
    setCarregandoAnteriores(false)
    setErro('')
    setCarregando(true)
    setConversaAtiva(null)
    conversaRef.current = null
    try {
      const resultado = await criarConversaMauro()
      if (!aindaAtivo || !ativoRef.current || versao !== versaoConversaRef.current) return
      const nova = resultado.conversa
      setConversas((atual) => [nova, ...atual])
      setConversaAtiva(nova.id)
      conversaRef.current = nova.id
      enviandoRef.current = false
      setRespondendo(false)
      setMensagens([])
      setPropostaPix(null)
      setPropostaCadastro(null)
      setTemAnteriores(false)
      setOpcoes(sugestoes)
      setMostrarConfirmacaoPix(false)
      setPinPix('')
      setHistoricoMobileAberto(false)
    } finally {
      if (ativoRef.current && versao === versaoConversaRef.current) setCarregando(false)
    }
  }

  async function enviar(pergunta = texto) {
    const mensagem = pergunta.trim()
    if (!mensagem || !conversaAtiva || respondendo || carregando || enviandoRef.current) return
    const versao = versaoConversaRef.current
    const idConversa = conversaAtiva
    enviandoRef.current = true
    setErro('')
    setTexto('')
    setTextoTranscrito(false)
    setMensagens((atual) => [...atual, {
      id: `local-${Date.now()}`, papel: 'USUARIO', conteudo: mensagem, criada_em: new Date().toISOString(),
    }])
    setRespondendo(true)
    try {
      const resultado = await enviarMensagemMauro(idConversa, mensagem)
      if (!ativoRef.current || versao !== versaoConversaRef.current) return
      setMensagens((atual) => [...atual, resultado.mensagem])
      if (resultado.proposta_pix) setPropostaPix(resultado.proposta_pix)
      if (resultado.proposta_cadastro) setPropostaCadastro(resultado.proposta_cadastro)
      setOpcoes(resultado.sugestoes || sugestoes)
      setMostrarConfirmacaoPix(false)
      setPinPix('')
      setConversas((atual) => atual.map((item) => item.id === conversaAtiva
        ? { ...item, titulo: item.titulo === 'Conversa com MAURO' ? mensagem.slice(0, 70) : item.titulo, ultima_mensagem: resultado.mensagem.conteudo }
        : item))
    } catch (falha) {
      if (!ativoRef.current || versao !== versaoConversaRef.current) return
      setErro(mensagemErro(falha, 'Não consegui responder agora. Tente novamente.'))
      setMensagens((atual) => atual.filter((item) => !(typeof item.id === 'string' && item.id.startsWith('local-'))))
      setTexto(mensagem)
      if (falha.dados?.sugestoes) setOpcoes(falha.dados.sugestoes)
    } finally {
      if (ativoRef.current && versao === versaoConversaRef.current) {
        enviandoRef.current = false
        setRespondendo(false)
        entradaRef.current?.focus()
      }
    }
  }

  async function carregarAnteriores() {
    if (!mensagens.length || carregandoAnteriores) return
    const versao = versaoConversaRef.current
    setCarregandoAnteriores(true)
    try {
      const resultado = await listarMensagensMauro(conversaAtiva, mensagens[0].id)
      if (!ativoRef.current || versao !== versaoConversaRef.current) return
      const area = listaRef.current
      if (area) scrollAnteriorRef.current = { altura: area.scrollHeight, posicao: area.scrollTop }
      setMensagens((atuais) => [...(resultado.mensagens || []), ...atuais])
      setTemAnteriores(Boolean(resultado.tem_anteriores))
    } catch (falha) {
      if (ativoRef.current && versao === versaoConversaRef.current) setErro(falha.message)
    } finally {
      if (ativoRef.current && versao === versaoConversaRef.current) setCarregandoAnteriores(false)
    }
  }

  function atualizarCadastro(resultado, idConversa) {
    if (!ativoRef.current || conversaRef.current !== idConversa) return
    setPropostaCadastro(resultado.proposta_cadastro || null)
    if (resultado.perfil) aoAtualizarPerfil?.({ usuario: resultado.perfil })
    if (resultado.mensagem) setMensagens((atuais) => [...atuais, {
      id: `cadastro-${Date.now()}`, papel: 'ASSISTENTE', conteudo: resultado.mensagem,
      criada_em: new Date().toISOString(),
    }])
  }

  function submeter(evento) {
    evento.preventDefault()
    enviar()
  }

  function pararFluxoDeAudio() {
    if (frameAudioRef.current) cancelAnimationFrame(frameAudioRef.current)
    frameAudioRef.current = null
    streamAudioRef.current?.getTracks().forEach((faixa) => faixa.stop())
    streamAudioRef.current = null
    gravadorRef.current = null
    const contextoAudio = audioContextRef.current
    audioContextRef.current = null
    if (contextoAudio && contextoAudio.state !== 'closed') contextoAudio.close().catch(() => {})
    setGravandoAudio(false)
    setAudioNiveis([])
  }

  async function iniciarAudio() {
    const versao = versaoConversaRef.current
    setErro('')
    if (!conversaAtiva || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setErro('Este navegador não oferece gravação de áudio para o MAURO.')
      return
    }
    try {
      cancelarAudioRef.current = false
      partesAudioRef.current = []
      audioExcedeuLimiteRef.current = false
      setTempoAudioMs(0)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!ativoRef.current || versao !== versaoConversaRef.current) {
        stream.getTracks().forEach((faixa) => faixa.stop())
        return
      }
      streamAudioRef.current = stream
      const AudioContextDisponivel = window.AudioContext || window.webkitAudioContext
      let analisador = null
      if (AudioContextDisponivel) {
        const contextoAudio = new AudioContextDisponivel()
        audioContextRef.current = contextoAudio
        await contextoAudio.resume()
        analisador = contextoAudio.createAnalyser()
        analisador.fftSize = 256
        contextoAudio.createMediaStreamSource(stream).connect(analisador)
          const frequencias = new Uint8Array(analisador.frequencyBinCount)
        let ultimaAtualizacao = 0
        const atualizarFormaDeOnda = (instante) => {
          frameAudioRef.current = requestAnimationFrame(atualizarFormaDeOnda)
          if (instante - ultimaAtualizacao < 70) return
          ultimaAtualizacao = instante
          analisador.getByteFrequencyData(frequencias)
          const quantidadeBarras = 28
          setAudioNiveis(Array.from({ length: quantidadeBarras }, (_, indice) => {
            const inicioFaixa = Math.floor(indice * frequencias.length / quantidadeBarras)
            const fimFaixa = Math.max(inicioFaixa + 1, Math.floor((indice + 1) * frequencias.length / quantidadeBarras))
            const faixa = frequencias.slice(inicioFaixa, fimFaixa)
            const media = faixa.reduce((soma, nivel) => soma + nivel, 0) / faixa.length
            return Math.max(0.14, Math.min(1, media / 125))
          }))
        }
        frameAudioRef.current = requestAnimationFrame(atualizarFormaDeOnda)
      }
      const tipos = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg']
      const mimeType = tipos.find((tipo) => MediaRecorder.isTypeSupported?.(tipo))
      const gravador = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      gravadorRef.current = gravador
      gravador.onstart = (evento) => {
        inicioAudioRef.current = evento.timeStamp
      }
      gravador.ondataavailable = (evento) => {
        if (!ativoRef.current || versao !== versaoConversaRef.current) return
        setTempoAudioMs(Math.max(0, evento.timeStamp - inicioAudioRef.current))
        if (evento.data?.size) {
          partesAudioRef.current.push(evento.data)
          const totalBytes = partesAudioRef.current.reduce((total, parte) => total + parte.size, 0)
          if (totalBytes > LIMITE_AUDIO_BYTES) {
            audioExcedeuLimiteRef.current = true
            if (gravador.state === 'recording') gravador.stop()
          }
        }
      }
      gravador.onstop = async () => {
        if (!ativoRef.current || versao !== versaoConversaRef.current) return
        const tipoAudio = (gravador.mimeType || 'audio/webm').split(';', 1)[0]
        const blob = new Blob(partesAudioRef.current, { type: tipoAudio })
        partesAudioRef.current = []
        pararFluxoDeAudio()
        if (audioExcedeuLimiteRef.current) {
          setErro('A gravação atingiu o limite de 8 MB. Conclua áudios mais longos em trechos menores.')
          return
        }
        if (cancelarAudioRef.current || !blob.size) return
        setTranscrevendoAudio(true)
        try {
          const resultado = await transcreverAudioMauro(conversaAtiva, blob)
          if (!ativoRef.current || versao !== versaoConversaRef.current) return
          setTexto(resultado.transcricao || '')
          setTextoTranscrito(Boolean(resultado.transcricao))
          entradaRef.current?.focus()
        } catch (falha) {
          if (ativoRef.current && versao === versaoConversaRef.current) setErro(falha.message || 'Não consegui transcrever o áudio. Tente novamente ou digite sua pergunta.')
        } finally {
          if (ativoRef.current && versao === versaoConversaRef.current) setTranscrevendoAudio(false)
        }
      }
      gravador.start(1000)
      setGravandoAudio(true)
    } catch (falha) {
      if (!ativoRef.current || versao !== versaoConversaRef.current) return
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
    const versao = versaoConversaRef.current
    setProcessandoPix(true)
    setErro('')
    try {
      const resultado = await cancelarPropostaPixMauro(conversaAtiva, propostaPix.id)
      if (!ativoRef.current || versao !== versaoConversaRef.current) return
      setPropostaPix(resultado.proposta_pix || null)
      setMostrarConfirmacaoPix(false)
      setPinPix('')
      setMensagens((atuais) => [...atuais, {
        id: `pix-cancelado-${Date.now()}`, papel: 'ASSISTENTE',
        conteudo: resultado.mensagem || 'Proposta cancelada. Nenhum Pix foi enviado.',
        criada_em: new Date().toISOString(),
      }])
    } catch (falha) {
      if (!ativoRef.current || versao !== versaoConversaRef.current) return
      setErro(falha.message || 'Não foi possível cancelar a proposta.')
      if (falha.dados?.proposta_pix) setPropostaPix(falha.dados.proposta_pix)
    } finally {
      if (ativoRef.current && versao === versaoConversaRef.current) setProcessandoPix(false)
    }
  }

  async function confirmarPix(evento) {
    evento.preventDefault()
    if (!propostaPix || processandoPix || !/^\d{6}$/.test(pinPix)) return
    const versao = versaoConversaRef.current
    setProcessandoPix(true)
    setErro('')
    try {
      const resultado = await confirmarPropostaPixMauro(conversaAtiva, propostaPix.id, pinPix)
      if (!ativoRef.current || versao !== versaoConversaRef.current) return
      setPropostaPix(resultado.proposta_pix || null)
      setMostrarConfirmacaoPix(false)
      setMensagens((atuais) => [...atuais, {
        id: `pix-resultado-${Date.now()}`, papel: 'ASSISTENTE',
        conteudo: resultado.mensagem || 'A solicitação foi processada.',
        criada_em: new Date().toISOString(),
      }])
    } catch (falha) {
      if (!ativoRef.current || versao !== versaoConversaRef.current) return
      setErro(falha.message || 'Não foi possível confirmar o Pix.')
      if (falha.dados?.proposta_pix) setPropostaPix(falha.dados.proposta_pix)
    } finally {
      if (ativoRef.current && versao === versaoConversaRef.current) {
        setPinPix('')
        setProcessandoPix(false)
      }
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
            {temAnteriores && (
              <button className="mauro-historico-anterior" type="button" onClick={carregarAnteriores} disabled={carregandoAnteriores}>
                {carregandoAnteriores ? 'Carregando…' : 'Carregar mensagens anteriores'}
              </button>
            )}
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
            {propostaCadastro && (
              <PropostaCadastroMauro
                key={`${conversaAtiva}-${propostaCadastro.id}`}
                proposta={propostaCadastro}
                idConversa={conversaAtiva}
                desabilitado={respondendo || processandoPix}
                aoAtualizar={(resultado) => atualizarCadastro(resultado, conversaAtiva)}
              />
            )}
            {respondendo && <div className="mauro-digitando"><span /><span /><span /><small>MAURO está pensando</small></div>}
          </div>

          {erro && <p className="mauro-erro" role="alert">{erro}</p>}
          {mensagens.length > 0 && !carregando && (
            <div className="mauro-sugestoes mauro-opcoes" aria-label="Opções de atendimento">
              {opcoes.map((opcao) => (
                <button type="button" key={opcao} disabled={respondendo || processandoPix} onClick={() => enviar(opcao)}>{opcao}</button>
              ))}
            </div>
          )}
          {gravandoAudio && (
            <div className="mauro-audio-status">
              <span className="mauro-audio-legenda" role="status" aria-live="polite" aria-label={`Gravando pergunta, ${formatarDuracaoAudio(tempoAudioMs)}.`}>
                <i aria-hidden="true" /> Gravando pergunta <time aria-hidden="true">{formatarDuracaoAudio(tempoAudioMs)}</time>
              </span>
              <div className="mauro-audio-waveform" aria-hidden="true">
                {audioNiveis.map((nivel, indice) => <i key={indice} style={{ height: `${4 + nivel * 22}px` }} />)}
              </div>
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
              onClick={() => {
                if (gravandoAudio) concluirAudio()
                else iniciarAudio()
              }}
              disabled={respondendo || carregando || transcrevendoAudio}
              aria-label={gravandoAudio ? 'Concluir gravação de áudio' : 'Gravar pergunta por áudio'}>
              <span aria-hidden="true">{gravandoAudio ? '■' : '🎙'}</span>
            </button>
            <button type="submit" disabled={!texto.trim() || respondendo || carregando} aria-label="Enviar mensagem">
              {respondendo ? <span className="mauro-enviando" /> : <span aria-hidden="true">↑</span>}
            </button>
            <small>O áudio é transcrito pelo backend Gemini e não é salvo. Revise o texto antes de enviar. O MAURO consulta sua conta ativa; Pix só é enviado após sua confirmação e PIN. Grave até 8 MB por mensagem. Instruções para contornar segurança ou revelar prompts internos são bloqueadas no servidor; nunca envie senhas ou códigos pelo chat.</small>
          </form>
        </div>
      </section>
    </div>
  )
}
