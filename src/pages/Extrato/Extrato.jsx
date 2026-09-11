import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AcoesComprovante from '../../components/Comprovante/AcoesComprovante.jsx'
import CabecalhoDashboard from '../../components/Dashboard/CabecalhoDashboard.jsx'
import Icone from '../../components/Dashboard/Icone.jsx'
import ModalPerfil from '../../components/Dashboard/ModalPerfil.jsx'
import NavegacaoMobile from '../../components/Dashboard/NavegacaoMobile.jsx'
import { useMovimentacoes } from '../../hooks/useMovimentacoes.js'
import { useSessao } from '../../hooks/useSessao.js'
import { encerrarSessao } from '../../services/authService.js'
import '../Dashboard/Dashboard.css'
import './Extrato.css'
import './ExtratoComprovante.css'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const formatarData = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' })
const formatarDataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

function descricaoMovimentacao(item) {
  if (item.origem === 'pix') return item.tipo === 'entrada' ? 'Pix recebido' : 'Pix enviado'
  if (item.origem === 'cobranca') return item.tipo === 'entrada' ? 'Recebimento de boleto' : 'Pagamento de boleto'
  return 'Movimentação'
}

function ModalDetalhesMovimentacao({ item, fechar }) {
  const entrada = item.tipo === 'entrada'
  const data = new Date(item.data_movimentacao)
  const detalheData = Number.isNaN(data.getTime()) ? 'Data não informada' : formatarDataHora.format(data)
  const descricao = descricaoMovimentacao(item)

  useEffect(() => {
    function fecharComEsc(evento) {
      if (evento.key === 'Escape') fechar()
    }

    document.addEventListener('keydown', fecharComEsc)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', fecharComEsc)
      document.body.style.overflow = ''
    }
  }, [fechar])

  function fecharAoClicarFora(evento) {
    if (evento.target === evento.currentTarget) fechar()
  }

  return (
    <div className="fundo-modal-perfil" role="presentation" onMouseDown={fecharAoClicarFora}>
      <section className="modal-perfil modal-detalhes-movimentacao" role="dialog" aria-modal="true" aria-labelledby="titulo-detalhes-movimentacao">
        <header>
          <div>
            <p>DETALHES DA TRANSAÇÃO</p>
            <h2 id="titulo-detalhes-movimentacao">{descricao}</h2>
            <span>Movimentação #{item.id_movimentacao}</span>
          </div>
          <button type="button" onClick={fechar} aria-label="Fechar modal">×</button>
        </header>

        <div className="conteudo-detalhes-movimentacao">
          <div className={`valor-detalhes-movimentacao${entrada ? ' entrada' : ''}`}>
            <span><Icone nome={item.origem === 'cobranca' ? 'boleto' : 'pix'} /></span>
            <small>{descricao}</small>
            <strong>{entrada ? '+' : '-'} {moeda.format(Number(item.valor) || 0)}</strong>
          </div>

          <dl>
            <div><dt>Data e hora</dt><dd>{detalheData}</dd></div>
            <div><dt>Identificação</dt><dd>#{item.id_movimentacao}</dd></div>
          </dl>

          {!entrada && <AcoesComprovante idMovimentacao={item.id_movimentacao} />}

          <footer>
            <button className="botao botao-principal" type="button" onClick={fechar}>Concluir</button>
          </footer>
        </div>
      </section>
    </div>
  )
}

export default function Extrato() {
  const navigate = useNavigate()
  const { perfil, atualizarPerfil, limparSessao } = useSessao()
  const dados = useMovimentacoes()
  const [filtro, setFiltro] = useState('todas')
  const [saindo, setSaindo] = useState(false)
  const [erroSessao, setErroSessao] = useState('')
  const [perfilAberto, setPerfilAberto] = useState(false)
  const [movimentacaoSelecionada, setMovimentacaoSelecionada] = useState(null)
  const lista = filtro === 'todas' ? dados.ordenadas : dados.ordenadas.filter((item) => item.tipo === filtro)

  async function sair() {
    if (saindo) return
    setSaindo(true)
    try {
      await encerrarSessao()
      limparSessao()
      navigate('/login', { replace: true })
    } catch (erro) {
      setErroSessao(erro.message || 'Não foi possível sair da conta.')
    } finally {
      setSaindo(false)
    }
  }

  return (
    <div className="pagina-dashboard pagina-extrato">
      <CabecalhoDashboard usuario={perfil} secao="extrato" abrirPerfil={() => setPerfilAberto(true)} sair={sair} />
      <main className="conteudo-dashboard-largo corpo-extrato">
        {erroSessao && <p className="mensagem-sessao-dashboard" role="alert">{erroSessao}</p>}
        <header className="cabecalho-extrato">
          <div><p>CONTA</p><h1>Seu extrato</h1><span>Todas as movimentações da conta atual.</span></div>
          <button type="button" onClick={dados.carregar} disabled={dados.carregando}>Atualizar</button>
        </header>
        <section className="resumo-extrato">
          <div><small>Saldo atual</small><strong>{moeda.format(dados.saldo)}</strong></div>
          <div><small>Entradas no mês</small><strong className="entrada">+ {moeda.format(dados.entradas)}</strong></div>
          <div><small>Saídas no mês</small><strong>- {moeda.format(dados.saidas)}</strong></div>
        </section>
        <section className="painel-extrato">
          <header><h2>Movimentações</h2><div className="filtros-extrato">
            {[['todas', 'Todas'], ['entrada', 'Entradas'], ['saida', 'Saídas']].map(([valor, rotulo]) => <button className={filtro === valor ? 'ativo' : ''} type="button" key={valor} onClick={() => setFiltro(valor)}>{rotulo}</button>)}
          </div></header>
          {dados.carregando && <p className="estado-extrato">Buscando movimentações...</p>}
          {!dados.carregando && dados.erro && <p className="estado-extrato erro" role="alert">{dados.erro}</p>}
          {!dados.carregando && !dados.erro && lista.length === 0 && <p className="estado-extrato">Nenhuma movimentação encontrada.</p>}
          {!dados.carregando && !dados.erro && <div className="lista-extrato">{lista.map((item) => {
            const entrada = item.tipo === 'entrada'
            const data = new Date(item.data_movimentacao)
            const detalhe = Number.isNaN(data.getTime()) ? 'Data não informada' : formatarData.format(data)
            return (
              <article key={item.id_movimentacao}>
                <span><Icone nome={item.origem === 'cobranca' ? 'boleto' : 'pix'} /></span>
                <div>
                  <strong>{descricaoMovimentacao(item)}</strong>
                  <small>{detalhe}</small>
                </div>
                <b className={entrada ? 'entrada' : ''}>{entrada ? '+' : '-'} {moeda.format(Number(item.valor) || 0)}</b>
                {!entrada && item.id_movimentacao && (
                  <button className="abrir-comprovante-extrato" type="button" onClick={() => setMovimentacaoSelecionada(item)}>
                    Ver comprovante
                  </button>
                )}
              </article>
            )
          })}</div>}
        </section>
      </main>
      <NavegacaoMobile secao="extrato" tipoConta={perfil.tipoConta} />
      {perfilAberto && <ModalPerfil usuario={perfil} fechar={() => setPerfilAberto(false)} aoAtualizar={atualizarPerfil} />}
      {movimentacaoSelecionada && (
        <ModalDetalhesMovimentacao
          item={movimentacaoSelecionada}
          fechar={() => setMovimentacaoSelecionada(null)}
        />
      )}
    </div>
  )
}
