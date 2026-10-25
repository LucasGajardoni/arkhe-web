import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  listarNotificacoes,
  marcarNotificacaoComoLida,
  obterContadorNotificacoes,
  obterPreferenciasNotificacoes,
  salvarPreferenciaNotificacao,
} from '../../services/notificacoesService.js'
import Icone from './Icone.jsx'
import './NotificacoesDashboard.css'

const TAMANHO_PAGINA = 100
const INTERVALO_ATUALIZACAO = 20000

const categorias = [
  { chave: 'PIX', nome: 'Pix', descricao: 'Recebimentos, pagamentos e cobranças Pix' },
  { chave: 'TRANSFERENCIA', nome: 'Transferências', descricao: 'Entradas e saídas entre contas' },
  { chave: 'BOLETO', nome: 'Boletos', descricao: 'Boletos emitidos, recebidos ou pagos' },
  { chave: 'CARTAO', nome: 'Cartões', descricao: 'Compras e alterações nos cartões' },
  { chave: 'INFORMATIVO', nome: 'Avisos informativos', descricao: 'Novidades e comunicados da conta' },
]

function dataFormatada(valor) {
  if (!valor) return ''
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return String(valor)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(data)
}

function resumoCategoria(categoria) {
  const item = categorias.find((categoriaAtual) => categoriaAtual.chave === categoria)
  return item?.nome || (categoria === 'SEGURANCA_CRITICA' ? 'Segurança' : 'Aviso')
}

export default function NotificacoesDashboard() {
  const [aberto, setAberto] = useState(false)
  const [aba, setAba] = useState('inbox')
  const [notificacoes, setNotificacoes] = useState([])
  const [naoLidas, setNaoLidas] = useState(0)
  const [preferencias, setPreferencias] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const [categoriaSalvando, setCategoriaSalvando] = useState('')
  const [temMais, setTemMais] = useState(false)
  const [erro, setErro] = useState('')

  const atualizar = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setCarregando(true)

    try {
      const [lista, contador] = await Promise.all([
        listarNotificacoes({ limite: TAMANHO_PAGINA }),
        obterContadorNotificacoes(),
      ])
      const novas = lista.notificacoes || []
      const idsRecentes = new Set(novas.map((item) => item.id))

      setNotificacoes((anteriores) => [
        ...novas,
        ...anteriores.filter((item) => !idsRecentes.has(item.id)),
      ])
      setNaoLidas(Number(contador.nao_lidas) || 0)
      setTemMais(novas.length === TAMANHO_PAGINA)
      setErro('')
    } catch (falha) {
      setErro(falha.message || 'Não foi possível atualizar as notificações.')
    } finally {
      if (!silencioso) setCarregando(false)
    }
  }, [])

  const carregarPreferencias = useCallback(async () => {
    try {
      const resposta = await obterPreferenciasNotificacoes()
      setPreferencias(resposta.preferencias || [])
      setErro('')
    } catch (falha) {
      setErro(falha.message || 'Não foi possível carregar as preferências.')
    }
  }, [])

  useEffect(() => {
    const primeiraCarga = window.setTimeout(() => atualizar(), 0)
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') atualizar({ silencioso: true })
    }, INTERVALO_ATUALIZACAO)
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') atualizar({ silencioso: true })
    }

    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      window.clearTimeout(primeiraCarga)
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [atualizar])

  const visiveis = useMemo(
    () => (aba === 'inbox'
      ? notificacoes.filter((item) => !item.suprimida_por_preferencia)
      : notificacoes),
    [aba, notificacoes],
  )

  async function abrirCentral() {
    const proximoEstado = !aberto
    setAberto(proximoEstado)
    if (proximoEstado) {
      atualizar({ silencioso: true })
      if (aba === 'preferencias') carregarPreferencias()
    }
  }

  async function abrirAbaPreferencias() {
    setAba('preferencias')
    await carregarPreferencias()
  }

  async function marcarComoLida(id) {
    try {
      await marcarNotificacaoComoLida(id)
      setNotificacoes((anteriores) => anteriores.map((item) =>
        item.id === id
          ? { ...item, lida: true, elegivel_para_nao_lidas: false, estado_leitura: 'lida' }
          : item,
      ))
      setNaoLidas((anterior) => Math.max(0, anterior - 1))
      setErro('')
    } catch (falha) {
      setErro(falha.message || 'Não foi possível marcar o aviso como lido.')
    }
  }

  async function carregarMais() {
    setCarregandoMais(true)
    try {
      const resposta = await listarNotificacoes({
        limite: TAMANHO_PAGINA,
        deslocamento: notificacoes.length,
      })
      const antigas = resposta.notificacoes || []
      setNotificacoes((atuais) => [...atuais, ...antigas])
      setTemMais(antigas.length === TAMANHO_PAGINA)
      setErro('')
    } catch (falha) {
      setErro(falha.message || 'Não foi possível carregar o histórico.')
    } finally {
      setCarregandoMais(false)
    }
  }

  async function alternarCategoria(categoria, ativo) {
    setCategoriaSalvando(categoria)
    try {
      await salvarPreferenciaNotificacao(categoria, !ativo)
      await Promise.all([carregarPreferencias(), atualizar({ silencioso: true })])
    } catch (falha) {
      setErro(falha.message || 'Não foi possível salvar esta preferência.')
    } finally {
      setCategoriaSalvando('')
    }
  }

  return (
    <div className="notificacoes-dashboard">
      <button
        className={`botao-sino-notificacoes${aberto ? ' ativo' : ''}`}
        type="button"
        aria-label={`Notificações, ${naoLidas} não lidas`}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        onClick={abrirCentral}
      >
        <Icone nome="sino" tamanho={20} />
        {naoLidas > 0 && <span className="contador-sino-notificacoes">{naoLidas > 99 ? '99+' : naoLidas}</span>}
      </button>

      {aberto && (
        <section className="painel-notificacoes" role="dialog" aria-label="Central de notificações">
          <header className="cabecalho-notificacoes">
            <div>
              <span className="rotulo-notificacoes">CENTRAL DA CONTA</span>
              <h2>Notificações</h2>
              <p>{naoLidas ? `${naoLidas} aviso${naoLidas === 1 ? '' : 's'} não lido${naoLidas === 1 ? '' : 's'}` : 'Tudo em dia por aqui'}</p>
            </div>
            <button className="fechar-notificacoes" type="button" aria-label="Fechar notificações" onClick={() => setAberto(false)}>×</button>
          </header>

          <nav className="abas-notificacoes" aria-label="Seções de notificações">
            <button className={aba === 'inbox' ? 'ativo' : ''} type="button" onClick={() => setAba('inbox')}>Inbox</button>
            <button className={aba === 'historico' ? 'ativo' : ''} type="button" onClick={() => setAba('historico')}>Histórico</button>
            <button className={aba === 'preferencias' ? 'ativo' : ''} type="button" onClick={abrirAbaPreferencias}>Preferências</button>
          </nav>

          {erro && <p className="erro-notificacoes" role="alert">{erro}</p>}

          {aba === 'preferencias' ? (
            <div className="lista-preferencias-notificacoes">
              <p className="introducao-preferencias">Escolha quais avisos aparecem no seu inbox. O histórico permanece guardado.</p>
              {categorias.map((categoria) => {
                const preferencia = preferencias.find((item) => item.categoria === categoria.chave)
                const ativo = preferencia?.ativo ?? true
                return (
                  <div className="preferencia-notificacao" key={categoria.chave}>
                    <div><strong>{categoria.nome}</strong><span>{categoria.descricao}</span></div>
                    <button
                      className={`chave-preferencia${ativo ? ' ligada' : ''}`}
                      type="button"
                      role="switch"
                      aria-checked={ativo}
                      aria-label={`${categoria.nome}: ${ativo ? 'ativada' : 'desativada'}`}
                      disabled={categoriaSalvando === categoria.chave}
                      onClick={() => alternarCategoria(categoria.chave, ativo)}
                    ><span /></button>
                  </div>
                )
              })}
              <div className="preferencia-notificacao obrigatoria">
                <div><strong>Segurança crítica</strong><span>Avisos importantes de segurança são sempre enviados.</span></div>
                <span className="selo-obrigatorio"><Icone nome="escudo" tamanho={15} /> Obrigatória</span>
              </div>
            </div>
          ) : (
            <div className="lista-notificacoes" aria-busy={carregando}>
              {carregando && notificacoes.length === 0 && <p className="vazio-notificacoes">Carregando seus avisos...</p>}
              {!carregando && visiveis.length === 0 && (
                <div className="vazio-notificacoes">
                  <span><Icone nome="sino" tamanho={24} /></span>
                  <strong>{aba === 'inbox' ? 'Seu inbox está tranquilo' : 'Nenhum aviso no histórico'}</strong>
                  <small>Novidades importantes da sua conta aparecem aqui.</small>
                </div>
              )}
              {visiveis.map((item) => (
                <article className={`item-notificacao${item.elegivel_para_nao_lidas ? ' nao-lida' : ''}`} key={item.id}>
                  <span className={`icone-notificacao categoria-${String(item.categoria).toLowerCase()}`}>
                    {item.categoria === 'SEGURANCA_CRITICA' ? <Icone nome="escudo" tamanho={17} /> : <Icone nome={item.categoria === 'PIX' ? 'pix' : item.categoria === 'CARTAO' ? 'cartao' : item.categoria === 'BOLETO' ? 'boleto' : 'transferir'} tamanho={17} />}
                  </span>
                  <div className="texto-notificacao">
                    <div className="linha-titulo-notificacao">
                      <strong>{item.titulo}</strong>
                      {item.elegivel_para_nao_lidas && <span className="ponto-nao-lida" aria-label="Não lida" />}
                    </div>
                    <small className="categoria-notificacao">{resumoCategoria(item.categoria)} · {dataFormatada(item.criada_em)}</small>
                    <p>{item.mensagem}</p>
                    {item.suprimida_por_preferencia && <small className="estado-notificacao">Ocultada do inbox pelas preferências</small>}
                    {item.lida && <small className="estado-notificacao">Lida</small>}
                    {item.elegivel_para_nao_lidas && (
                      <button className="marcar-lida-notificacao" type="button" onClick={() => marcarComoLida(item.id)}>Marcar como lida</button>
                    )}
                  </div>
                </article>
              ))}
              {temMais && aba === 'historico' && (
                <button className="carregar-mais-notificacoes" type="button" disabled={carregandoMais} onClick={carregarMais}>
                  {carregandoMais ? 'Carregando...' : 'Carregar avisos anteriores'}
                </button>
              )}
              {aba === 'inbox' && visiveis.length < notificacoes.length && (
                <button className="carregar-mais-notificacoes" type="button" onClick={() => setAba('historico')}>Ver histórico completo</button>
              )}
            </div>
          )}

          <footer className="rodape-notificacoes">Atualizado automaticamente a cada 20 segundos</footer>
        </section>
      )}
    </div>
  )
}
