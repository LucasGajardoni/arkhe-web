import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AcoesComprovante from '../../components/Comprovante/AcoesComprovante.jsx'
import CabecalhoDashboard from '../../components/Dashboard/CabecalhoDashboard.jsx'
import Icone from '../../components/Dashboard/Icone.jsx'
import ModalPerfil from '../../components/Dashboard/ModalPerfil.jsx'
import NavegacaoMobile from '../../components/Dashboard/NavegacaoMobile.jsx'
import { useModalAcessivel } from '../../hooks/useModalAcessivel.js'
import { useMovimentacoes } from '../../hooks/useMovimentacoes.js'
import { useSessao } from '../../hooks/useSessao.js'
import { encerrarSessao } from '../../services/authService.js'
import {
  agruparMovimentacoesPorData,
  dataMovimentacao,
  metadadosMovimentacao,
} from '../../utils/movimentacoes.js'
import '../Dashboard/Dashboard.css'
import './Extrato.css'
import './ExtratoComprovante.css'

const LIMITE_INICIAL = 15
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const formatarDataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const formatarHorario = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

function ModalDetalhesMovimentacao({ item, fechar }) {
  const meta = metadadosMovimentacao(item)
  const data = dataMovimentacao(item)
  const detalheData = data ? formatarDataHora.format(data) : 'Data não informada'
  const { modalRef, fecharAoClicarFora } = useModalAcessivel(fechar)

  return (
    <div className="fundo-modal-perfil" role="presentation" onMouseDown={fecharAoClicarFora}>
      <section ref={modalRef} className="modal-perfil modal-detalhes-movimentacao" role="dialog" aria-modal="true" aria-labelledby="titulo-detalhes-movimentacao" tabIndex="-1">
        <header>
          <div>
            <p>DETALHES DA TRANSAÇÃO</p>
            <h2 id="titulo-detalhes-movimentacao">{meta.descricao}</h2>
            <span>Movimentação #{item.id_movimentacao}</span>
          </div>
          <button type="button" onClick={fechar} aria-label="Fechar modal">×</button>
        </header>

        <div className="conteudo-detalhes-movimentacao">
          <div className={`valor-detalhes-movimentacao${meta.entrada ? ' entrada' : ''}`}>
            <span><Icone nome={meta.icone} /></span>
            <small>{meta.descricao}</small>
            <strong>{meta.entrada ? '+' : '-'} {moeda.format(Number(item.valor) || 0)}</strong>
          </div>

          <dl>
            <div><dt>Data e hora</dt><dd>{detalheData}</dd></div>
            <div><dt>Identificação</dt><dd>#{item.id_movimentacao}</dd></div>
          </dl>

          {!meta.entrada && item.id_movimentacao && (
            <AcoesComprovante idMovimentacao={item.id_movimentacao} />
          )}

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
  const [limite, setLimite] = useState(LIMITE_INICIAL)
  const [saindo, setSaindo] = useState(false)
  const [erroSessao, setErroSessao] = useState('')
  const [perfilAberto, setPerfilAberto] = useState(false)
  const [movimentacaoSelecionada, setMovimentacaoSelecionada] = useState(null)
  const lista = useMemo(() => (
    filtro === 'todas'
      ? dados.ordenadas
      : dados.ordenadas.filter((item) => item.tipo === filtro)
  ), [dados.ordenadas, filtro])
  const listaVisivel = lista.slice(0, limite)
  const grupos = useMemo(() => agruparMovimentacoesPorData(listaVisivel), [listaVisivel])
  const restantes = Math.max(0, lista.length - listaVisivel.length)
  const dadosDisponiveis = !dados.carregando && !dados.erro

  async function sair() {
    if (saindo) return
    setSaindo(true)
    setErroSessao('')

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

  function valorResumo(valor, sinal = '') {
    if (!dadosDisponiveis) return '—'
    return `${sinal}${moeda.format(valor)}`
  }

  return (
    <div className="pagina-dashboard pagina-extrato">
      <CabecalhoDashboard usuario={perfil} secao="extrato" abrirPerfil={() => setPerfilAberto(true)} sair={sair} />

      <main className="conteudo-dashboard-largo corpo-extrato">
        {erroSessao && <p className="mensagem-sessao-dashboard" role="alert">{erroSessao}</p>}

        <header className="cabecalho-extrato">
          <div><p>CONTA</p><h1>Seu extrato</h1><span>Entradas e saídas da conta atual, em ordem cronológica.</span></div>
          <button type="button" onClick={dados.carregar} disabled={dados.carregando}>
            {dados.carregando ? 'Atualizando...' : 'Atualizar extrato'}
          </button>
        </header>

        <section className="resumo-extrato" aria-label="Resumo da conta" aria-busy={dados.carregando}>
          <div><small>Saldo atual</small><strong>{valorResumo(dados.saldo)}</strong></div>
          <div><small>Entradas no mês</small><strong className="entrada">{valorResumo(dados.entradas, '+ ')}</strong></div>
          <div><small>Saídas no mês</small><strong>{valorResumo(dados.saidas, '- ')}</strong></div>
        </section>

        <section className="painel-extrato" aria-busy={dados.carregando}>
          <header>
            <div>
              <p>MOVIMENTAÇÕES</p>
              <h2>Histórico da conta</h2>
            </div>
            <div className="filtros-extrato" aria-label="Filtrar movimentações">
              {[['todas', 'Todas'], ['entrada', 'Entradas'], ['saida', 'Saídas']].map(([valor, rotulo]) => (
                <button
                  className={filtro === valor ? 'ativo' : ''}
                  type="button"
                  key={valor}
                  aria-pressed={filtro === valor}
                  onClick={() => {
                    setFiltro(valor)
                    setLimite(LIMITE_INICIAL)
                  }}
                >
                  {rotulo}
                </button>
              ))}
            </div>
          </header>

          {dados.carregando && <p className="estado-extrato" role="status">Buscando movimentações...</p>}
          {!dados.carregando && dados.erro && (
            <div className="estado-extrato erro" role="alert">
              <p>{dados.erro}</p>
              <button type="button" onClick={dados.carregar}>Tentar novamente</button>
            </div>
          )}
          {dadosDisponiveis && lista.length === 0 && (
            <p className="estado-extrato">Nenhuma movimentação encontrada neste filtro.</p>
          )}

          {dadosDisponiveis && grupos.length > 0 && (
            <div className="grupos-extrato">
              {grupos.map((grupo) => (
                <section className="grupo-extrato" key={grupo.chave} aria-labelledby={`grupo-${grupo.chave}`}>
                  <h3 id={`grupo-${grupo.chave}`}>{grupo.rotulo}</h3>
                  <div className="lista-extrato">
                    {grupo.itens.map((item, indice) => {
                      const meta = metadadosMovimentacao(item)
                      const data = dataMovimentacao(item)
                      const horario = data ? formatarHorario.format(data) : 'Horário não informado'

                      return (
                        <article key={item.id_movimentacao || `${item.data_movimentacao}-${indice}`}>
                          <button
                            className="abrir-detalhe-extrato"
                            type="button"
                            onClick={() => setMovimentacaoSelecionada(item)}
                            aria-label={`${meta.descricao}, ${meta.entrada ? 'entrada' : 'saída'} de ${moeda.format(Number(item.valor) || 0)}, ${horario}`}
                          >
                            <span className="icone-movimentacao-extrato"><Icone nome={meta.icone} /></span>
                            <span className="identificacao-movimentacao-extrato">
                              <strong>{meta.descricao}</strong>
                              <small>{horario}</small>
                            </span>
                            <b className={meta.entrada ? 'entrada' : ''}>
                              {meta.entrada ? '+' : '-'} {moeda.format(Number(item.valor) || 0)}
                            </b>
                            <Icone nome="seta" tamanho={16} />
                          </button>
                          {!meta.entrada && item.id_movimentacao && (
                            <button className="abrir-comprovante-extrato" type="button" onClick={() => setMovimentacaoSelecionada(item)}>
                              Ver comprovante
                            </button>
                          )}
                        </article>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}

          {dadosDisponiveis && restantes > 0 && (
            <button className="mostrar-mais-extrato" type="button" onClick={() => setLimite((atual) => atual + LIMITE_INICIAL)}>
              Mostrar mais {Math.min(restantes, LIMITE_INICIAL)} movimentações
            </button>
          )}
        </section>
      </main>

      <NavegacaoMobile secao="extrato" tipoConta={perfil.tipoConta} />
      {perfilAberto && <ModalPerfil usuario={perfil} fechar={() => setPerfilAberto(false)} aoAtualizar={atualizarPerfil} />}
      {movimentacaoSelecionada && (
        <ModalDetalhesMovimentacao item={movimentacaoSelecionada} fechar={() => setMovimentacaoSelecionada(null)} />
      )}
    </div>
  )
}
