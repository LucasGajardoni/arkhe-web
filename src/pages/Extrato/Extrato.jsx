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
import { devolverMovimentacao, estornarBoleto } from '../../services/movimentacoesService.js'
import { encerrarSessao } from '../../services/authService.js'
import {
  agruparMovimentacoesPorData,
  formatarDataHoraMovimentacao,
  metadadosMovimentacao,
  nomeContraparteMovimentacao,
  valorMovimentacao,
} from '../../utils/movimentacoes.js'
import '../Dashboard/Dashboard.css'
import './Extrato.css'
import './ExtratoComprovante.css'

const LIMITE_INICIAL = 15
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function ModalDetalhesMovimentacao({ item, fechar, atualizar }) {
  const { perfil } = useSessao()
  const navigate = useNavigate()
  const meta = metadadosMovimentacao(item)
  const contraparte = nomeContraparteMovimentacao(item)
  const detalheData = formatarDataHoraMovimentacao(item)
  const valor = valorMovimentacao(item)
  const [acao, setAcao] = useState('')
  const [motivo, setMotivo] = useState('')
  const [erroAcao, setErroAcao] = useState('')
  const [processandoAcao, setProcessandoAcao] = useState(false)
  const { modalRef, fecharAoClicarFora } = useModalAcessivel(fechar, processandoAcao)

  async function confirmarAcao() {
    if (processandoAcao || motivo.trim().length < 5) return
    setProcessandoAcao(true)
    setErroAcao('')
    try {
      if (acao === 'confirmar_devolucao') await devolverMovimentacao(item.id_movimentacao, motivo)
      else await estornarBoleto(item.id_movimentacao, motivo)
      await atualizar()
      setAcao('concluida')
    } catch (falha) {
      setErroAcao(falha.message || 'Não foi possível concluir esta operação.')
    } finally {
      setProcessandoAcao(false)
    }
  }

  return (
    <div className="fundo-modal-perfil" role="presentation" onMouseDown={fecharAoClicarFora}>
      <section ref={modalRef} className="modal-perfil modal-detalhes-movimentacao" role="dialog" aria-modal="true" aria-labelledby="titulo-detalhes-movimentacao" tabIndex="-1">
        <header>
          <div>
            <p>DETALHES DA TRANSAÇÃO</p>
            <h2 id="titulo-detalhes-movimentacao">{meta.descricao}</h2>
            {item.id_movimentacao && <span>Movimentação #{item.id_movimentacao}</span>}
          </div>
          <button type="button" onClick={fechar} aria-label="Fechar modal">×</button>
        </header>

        <div className="conteudo-detalhes-movimentacao">
          <div className="status-detalhes-movimentacao">
            <span aria-hidden="true" />
            <strong>{item.status_operacao === 'DEVOLVIDA' ? 'Devolução concluída' : item.status_operacao === 'DEVOLUCAO' ? 'Movimentação de devolução' : 'Transação concluída'}</strong>
            <small>{meta.entrada ? 'Entrada na conta' : 'Saída da conta'}</small>
          </div>

          <div className={`valor-detalhes-movimentacao${meta.entrada ? ' entrada' : ''}`}>
            <span><Icone nome={meta.icone} /></span>
            <small>{meta.descricao}</small>
            <strong>{meta.entrada ? '+' : '-'} {moeda.format(valor)}</strong>
          </div>

          <dl>
            <div><dt>Pagador</dt><dd>{item.nome_pagador || (meta.entrada ? contraparte : perfil.nome) || 'Conta Arkhé'}</dd></div>
            <div><dt>Recebedor</dt><dd>{item.nome_recebedor || (!meta.entrada ? contraparte : perfil.nome) || 'Conta Arkhé'}</dd></div>
            <div><dt>Data e hora</dt><dd>{detalheData}</dd></div>
            <div><dt>Natureza</dt><dd>{meta.entrada ? 'Crédito recebido' : 'Débito realizado'}</dd></div>
            <div><dt>Tipo da operação</dt><dd>{meta.descricao}</dd></div>
            {meta.detalhe && <div><dt>Canal / detalhe</dt><dd>{meta.detalhe}</dd></div>}
            {item.id_movimentacao && <div><dt>Identificação Arkhé</dt><dd>ARKHE-{String(item.id_movimentacao).padStart(12, '0')}</dd></div>}
            {item.id_cobranca && <div><dt>Cobrança vinculada</dt><dd>#{item.id_cobranca}</dd></div>}
            {item.id_folha && <div><dt>Folha vinculada</dt><dd>#{item.id_folha}</dd></div>}
            {item.status_operacao === 'DEVOLVIDA' && <div><dt>Devolução</dt><dd>{item.id_movimentacao_devolucao ? `Movimentação #${item.id_movimentacao_devolucao}` : 'Concluída'}{item.id_estorno ? ` · registro #${item.id_estorno}` : ''}</dd></div>}
            {item.status_operacao === 'DEVOLUCAO' && item.id_movimentacao_original && <div><dt>Operação original</dt><dd>Movimentação #{item.id_movimentacao_original}{item.id_estorno ? ` · registro #${item.id_estorno}` : ''}</dd></div>}
            {item.motivo_estorno && <div><dt>Motivo registrado</dt><dd>{item.motivo_estorno}</dd></div>}
            {item.data_estorno && <div><dt>Data da devolução</dt><dd>{item.data_estorno}</dd></div>}
          </dl>

          {!meta.entrada && item.id_movimentacao && (
            <AcoesComprovante idMovimentacao={item.id_movimentacao} />
          )}

          {item.status_operacao === 'CONCLUIDO' && meta.entrada && item.pode_devolver && <p className="aviso-devolucao-extrato">Esta entrada permite devolução integral. O sistema verifica saldo e limites antes de concluir.</p>}
          {item.status_operacao === 'CONCLUIDO' && !meta.entrada && !item.pode_estornar_boleto && <p className="aviso-devolucao-extrato">Você enviou este pagamento. Para receber de volta, solicite a devolução ao recebedor; não é possível retirar dinheiro de outra conta pelo seu extrato.</p>}
          <footer>
            {perfil.tipoConta === 'PJ' && item.origem === 'folha_pagamento' && item.id_folha && (
              <button className="botao botao-secundario" type="button" onClick={() => navigate(`/dashboard/folha?folha=${encodeURIComponent(item.id_folha)}`)}>Ver folha</button>
            )}
            {item.pode_devolver && item.status_operacao === 'CONCLUIDO' && <button className="botao botao-principal" type="button" onClick={() => { setErroAcao(''); setAcao('confirmar_devolucao') }}>{meta.entrada ? 'Devolver valor recebido' : 'Devolução administrativa'}</button>}
            {item.pode_estornar_boleto && item.status_operacao === 'CONCLUIDO' && <button className="botao botao-principal" type="button" onClick={() => { setErroAcao(''); setAcao('confirmar_estorno') }}>Estornar boleto (admin)</button>}
            <button className="botao botao-secundario" type="button" onClick={fechar}>Concluir</button>
          </footer>
        </div>

        {['confirmar_devolucao', 'confirmar_estorno'].includes(acao) && (
          <div className="fundo-modal-perfil" role="presentation">
            <section className="modal-perfil confirmacao-estorno-extrato" role="alertdialog" aria-modal="true" aria-labelledby="titulo-confirmar-estorno">
              <p>CONFIRMAÇÃO FINANCEIRA</p>
              <h2 id="titulo-confirmar-estorno">{acao === 'confirmar_estorno' ? 'Estornar boleto como administrador?' : meta.entrada ? 'Devolver integralmente este valor recebido?' : 'Confirmar devolução administrativa?'}</h2>
              <p>Você está confirmando a devolução integral de <strong>{moeda.format(valor)}</strong>. O Arkhé criará uma movimentação inversa, debitará a conta que recebeu o pagamento original e manterá o lançamento no extrato. O backend valida saldo, limites e autorização.</p>
              <label className="motivo-estorno-boleto">Motivo
                <textarea value={motivo} onChange={(evento) => setMotivo(evento.target.value)} maxLength={500} minLength={5} required placeholder="Informe o motivo da devolução." />
              </label>
              {erroAcao && <p className="mensagem-modal-perfil erro" role="alert">{erroAcao}</p>}
              <footer>
                <button className="botao botao-secundario" type="button" disabled={processandoAcao} onClick={() => setAcao('')}>Voltar</button>
                <button className="botao botao-principal" type="button" disabled={processandoAcao || motivo.trim().length < 5} onClick={confirmarAcao}>{processandoAcao ? 'Processando…' : 'Confirmar devolução'}</button>
              </footer>
            </section>
          </div>
        )}

        {acao === 'concluida' && (
          <div className="fundo-modal-perfil" role="presentation"><section className="modal-perfil confirmacao-estorno-extrato" role="status">
            <h2>Devolução concluída</h2>
            <p>O lançamento inverso foi registrado e o extrato foi atualizado.</p>
            <button className="botao botao-principal" type="button" onClick={fechar}>Concluir</button>
          </section></div>
        )}
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
          <div><p>CONTA</p><h1>Seu extrato</h1><span>Entradas e saídas da conta atual, em ordem cronológica.</span><p><button className="botao botao-secundario" type="button" onClick={() => navigate("/dashboard/devolucoes")}>Como funcionam devoluções e cancelamentos?</button></p></div>
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
                      const contraparte = nomeContraparteMovimentacao(item)
                      const detalheData = formatarDataHoraMovimentacao(item)
                      const valor = valorMovimentacao(item)
                      const statusFinanceiro = item.status_operacao === 'DEVOLVIDA'
                        ? 'Devolvido integralmente'
                        : item.status_operacao === 'DEVOLUCAO' ? 'Devolução registrada' : ''
                      const complemento = [detalheData, meta.detalhe, statusFinanceiro].filter(Boolean).join(' · ')

                      return (
                        <article key={item.id_movimentacao || `${item.data_movimentacao}-${indice}`}>
                          <button
                            className="abrir-detalhe-extrato"
                            type="button"
                            onClick={() => setMovimentacaoSelecionada(item)}
                            aria-label={`${meta.descricao}, ${contraparte}, ${meta.entrada ? 'entrada' : 'saída'} de ${moeda.format(valor)}, ${complemento}`}
                          >
                            <span className="icone-movimentacao-extrato"><Icone nome={meta.icone} /></span>
                            <span className="identificacao-movimentacao-extrato">
                              <strong>{meta.descricao}</strong>
                              <small className="contraparte-movimentacao-extrato">{contraparte}</small>
                              <small>{complemento}</small>
                            </span>
                            <b className={meta.entrada ? 'entrada' : ''}>
                              {meta.entrada ? '+' : '-'} {moeda.format(valor)}
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
        <ModalDetalhesMovimentacao item={movimentacaoSelecionada} atualizar={dados.carregar} fechar={() => setMovimentacaoSelecionada(null)} />
      )}
    </div>
  )
}
