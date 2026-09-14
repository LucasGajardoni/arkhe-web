import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ModalEmissaoBoleto from '../../components/Boleto/ModalEmissaoBoleto.jsx'
import ModalPagarBoleto from '../../components/Boleto/ModalPagarBoleto.jsx'
import CabecalhoDashboard from '../../components/Dashboard/CabecalhoDashboard.jsx'
import Icone from '../../components/Dashboard/Icone.jsx'
import ModalPerfil from '../../components/Dashboard/ModalPerfil.jsx'
import NavegacaoMobile from '../../components/Dashboard/NavegacaoMobile.jsx'
import { useMovimentacoes } from '../../hooks/useMovimentacoes.js'
import { useSessao } from '../../hooks/useSessao.js'
import { encerrarSessao } from '../../services/authService.js'
import { dataMovimentacao, metadadosMovimentacao } from '../../utils/movimentacoes.js'
import './Dashboard.css'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const formatarDataAtual = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
const formatarDataMovimentacao = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
})

function atalhosPorTipo(contaPJ) {
  if (contaPJ) {
    return [
      { icone: 'pix', titulo: 'Pix', detalhe: 'Enviar ou receber', destino: 'pix' },
      { icone: 'boleto', titulo: 'Emitir boleto', detalhe: 'Criar cobrança', destino: 'emitir' },
      { icone: 'extrato', titulo: 'Boletos emitidos', detalhe: 'Acompanhar clientes', destino: 'boletos' },
      { icone: 'transferir', titulo: 'Extrato', detalhe: 'Ver movimentações', destino: 'extrato' },
    ]
  }

  return [
    { icone: 'pix', titulo: 'Pix', detalhe: 'Enviar ou receber', destino: 'pix' },
    { icone: 'boleto', titulo: 'Pagar boleto', detalhe: 'Digitar ou escanear', destino: 'pagar' },
    { icone: 'extrato', titulo: 'Extrato', detalhe: 'Ver movimentações', destino: 'extrato' },
    { icone: 'transferir', titulo: 'DDA', detalhe: 'Boletos da sua conta', destino: 'boletos' },
  ]
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { perfil, atualizarPerfil, limparSessao } = useSessao()
  const movimentacoes = useMovimentacoes()
  const [saldoVisivel, setSaldoVisivel] = useState(true)
  const [perfilAberto, setPerfilAberto] = useState(false)
  const [emissaoAberta, setEmissaoAberta] = useState(false)
  const [pagamentoBoletoAberto, setPagamentoBoletoAberto] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const [erroSessao, setErroSessao] = useState('')
  const usuario = perfil
  const contaPJ = usuario.tipoConta === 'PJ'
  const atalhos = useMemo(() => atalhosPorTipo(contaPJ), [contaPJ])
  const tipoCobrancaDashboard = contaPJ ? 'receber' : 'pagar'
  const cobrancasDashboard = movimentacoes.cobrancas.filter(
    (item) => item.tipo === tipoCobrancaDashboard,
  )
  const cobrancasPagas = cobrancasDashboard.filter((item) => Number(item.status) === 1)
  const cobrancasPendentes = cobrancasDashboard.filter((item) => Number(item.status) !== 1)
  const totalPagoBoletos = cobrancasPagas.reduce(
    (total, item) => total + (Number(item.valor) || 0),
    0,
  )
  const totalPendenteBoletos = cobrancasPendentes.reduce(
    (total, item) => total + (Number(item.valor) || 0),
    0,
  )
  const dadosDisponiveis = !movimentacoes.carregando && !movimentacoes.erro
  const dataAtual = formatarDataAtual.format(new Date()).toLocaleUpperCase('pt-BR')

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

  function abrirAtalho(destino) {
    if (destino === 'pix') navigate('/dashboard/pix')
    if (destino === 'extrato') navigate('/dashboard/extrato')
    if (destino === 'boletos') navigate('/dashboard/boletos')
    if (destino === 'emitir') setEmissaoAberta(true)
    if (destino === 'pagar') setPagamentoBoletoAberto(true)
  }

  function valorProtegido(valor, prefixo = '') {
    if (!dadosDisponiveis) return movimentacoes.carregando ? 'Carregando...' : '—'
    if (!saldoVisivel) return 'R$ •••••'
    return `${prefixo}${moeda.format(valor)}`
  }

  const primeiroNome = usuario.nome?.split(' ')[0] || 'Cliente'
  const diferencaFluxo = movimentacoes.entradas - movimentacoes.saidas
  let insightFluxo = 'Entradas e saídas estão equilibradas neste mês.'
  if (diferencaFluxo > 0) {
    insightFluxo = `Entrou ${moeda.format(diferencaFluxo)} a mais do que saiu neste mês.`
  } else if (diferencaFluxo < 0) {
    insightFluxo = `Saiu ${moeda.format(Math.abs(diferencaFluxo))} a mais do que entrou neste mês.`
  }

  return (
    <div className="pagina-dashboard">
      <CabecalhoDashboard usuario={usuario} abrirPerfil={() => setPerfilAberto(true)} sair={sair} />

      <main>
        {erroSessao && <p className="mensagem-sessao-dashboard" role="alert">{erroSessao}</p>}

        <section className="hero-dashboard">
          <div className="orbita-dashboard orbita-um" />
          <div className="orbita-dashboard orbita-dois" />
          <div className="conteudo-dashboard-largo hero-dashboard-conteudo">
            <div className="saudacao-dashboard">
              <p>{dataAtual}</p>
              <h1>
                Bom ter você aqui,<br />
                <em>{primeiroNome}.</em>
              </h1>
              <span>{contaPJ ? 'Acompanhe o caixa e as cobranças da sua empresa.' : 'Sua vida financeira, clara e organizada em um só lugar.'}</span>
            </div>

            <div className="saldo-dashboard" aria-busy={movimentacoes.carregando}>
              <div className="saldo-dashboard-topo">
                <span>Saldo disponível</span>
                <button
                  type="button"
                  onClick={() => setSaldoVisivel(!saldoVisivel)}
                  aria-label={`${saldoVisivel ? 'Ocultar' : 'Mostrar'} valores da conta`}
                >
                  <Icone nome="olho" tamanho={21} /> {saldoVisivel ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <strong>{valorProtegido(movimentacoes.saldo)}</strong>
              <div className="saldo-dashboard-rodape">
                <div>
                  <small>Entradas no mês</small>
                  <b>{valorProtegido(movimentacoes.entradas, '+ ')}</b>
                </div>
                <i />
                <div>
                  <small>Saídas no mês</small>
                  <b>{valorProtegido(movimentacoes.saidas, '- ')}</b>
                </div>
              </div>
              {movimentacoes.erro && (
                <button className="erro-saldo-dashboard" type="button" onClick={movimentacoes.carregar}>
                  Não foi possível atualizar. Tentar novamente
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="conteudo-dashboard-largo corpo-dashboard">
          <section className="atalhos-dashboard" aria-label="Ações rápidas">
            {atalhos.map((atalho) => (
              <button type="button" key={atalho.titulo} onClick={() => abrirAtalho(atalho.destino)}>
                <span><Icone nome={atalho.icone} /></span>
                <span className="texto-atalho-dashboard">
                  <strong>{atalho.titulo}</strong>
                  <small>{atalho.detalhe}</small>
                </span>
                <Icone nome="seta" tamanho={16} />
              </button>
            ))}
          </section>

          <div className="grade-dashboard">
            <section className="bloco-dashboard atividade-dashboard">
              <div className="titulo-bloco-dashboard">
                <div>
                  <p>CONTA</p>
                  <h2>Movimentações recentes</h2>
                </div>
                <button type="button" onClick={() => navigate('/dashboard/extrato')}>
                  Ver extrato <Icone nome="seta" tamanho={15} />
                </button>
              </div>

              <div className="lista-dashboard" aria-busy={movimentacoes.carregando}>
                {movimentacoes.carregando && <p className="estado-movimentacoes-dashboard">Buscando movimentações...</p>}
                {!movimentacoes.carregando && movimentacoes.erro && (
                  <p className="estado-movimentacoes-dashboard erro" role="alert">{movimentacoes.erro}</p>
                )}
                {dadosDisponiveis && movimentacoes.ordenadas.length === 0 && (
                  <p className="estado-movimentacoes-dashboard">Suas movimentações aparecerão aqui.</p>
                )}
                {dadosDisponiveis && movimentacoes.ordenadas.slice(0, 5).map((item, indice) => {
                  const meta = metadadosMovimentacao(item)
                  const data = dataMovimentacao(item)
                  const detalhe = data ? formatarDataMovimentacao.format(data) : 'Data não informada'

                  return (
                    <article key={item.id_movimentacao || `${item.data_movimentacao}-${indice}`}>
                      <span><Icone nome={meta.icone} /></span>
                      <div><strong>{meta.descricao}</strong><small>{detalhe}</small></div>
                      <b className={meta.entrada ? 'entrada' : ''}>
                        {meta.entrada ? '+' : '-'} {moeda.format(Number(item.valor) || 0)}
                      </b>
                    </article>
                  )
                })}
              </div>
            </section>

            <section className="boletos-dashboard">
              <div className="titulo-bloco-dashboard titulo-boletos-dashboard">
                <div>
                  <p>{contaPJ ? 'COBRANÇAS' : 'PAGAMENTOS'}</p>
                  <h2>{contaPJ ? 'Boletos emitidos' : 'Boletos a pagar'}</h2>
                </div>
                <button type="button" onClick={() => navigate('/dashboard/boletos')} aria-label="Abrir área de boletos">
                  <Icone nome="seta" tamanho={17} />
                </button>
              </div>

              <div className="destaque-boletos-dashboard">
                <span><Icone nome="boleto" tamanho={27} /></span>
                <div>
                  <small>{contaPJ ? 'Cobranças pendentes' : 'Boletos pendentes'}</small>
                  <strong>{dadosDisponiveis ? cobrancasPendentes.length : '—'}</strong>
                </div>
              </div>

              <div className="resumo-card-boletos-dashboard">
                <div>
                  <span>{contaPJ ? 'Total recebido' : 'Total a pagar'}</span>
                  <strong>{dadosDisponiveis ? moeda.format(contaPJ ? totalPagoBoletos : totalPendenteBoletos) : '—'}</strong>
                </div>
                <div>
                  <span>{contaPJ ? 'Total emitido' : 'Boletos pagos'}</span>
                  <strong>{dadosDisponiveis ? (contaPJ ? moeda.format(totalPagoBoletos + totalPendenteBoletos) : cobrancasPagas.length) : '—'}</strong>
                </div>
              </div>

              <button className="abrir-boletos-dashboard" type="button" onClick={() => navigate('/dashboard/boletos')}>
                {contaPJ ? 'Acompanhar cobranças' : 'Ver DDA e boletos'}
                <Icone nome="seta" tamanho={15} />
              </button>
            </section>

            <section className="bloco-dashboard panorama-dashboard">
              <div className="titulo-bloco-dashboard">
                <div>
                  <p>FLUXO DA CONTA</p>
                  <h2>Panorama do mês</h2>
                </div>
                <span className="periodo-panorama-dashboard">{movimentacoes.panorama.rotuloPeriodo}</span>
              </div>

              {movimentacoes.carregando && <p className="estado-panorama-dashboard">Montando seu panorama...</p>}
              {!movimentacoes.carregando && movimentacoes.erro && (
                <p className="estado-panorama-dashboard erro" role="alert">Não foi possível montar o panorama agora.</p>
              )}
              {dadosDisponiveis && movimentacoes.panorama.quantidade === 0 && (
                <p className="estado-panorama-dashboard">Ainda não há movimentações neste mês para montar seu panorama.</p>
              )}
              {dadosDisponiveis && movimentacoes.panorama.quantidade > 0 && (
                <>
                  <div className="grafico-dashboard" aria-label={`Entradas e saídas de ${movimentacoes.panorama.rotuloPeriodo}`}>
                    <div className="legenda-grafico">
                      <span><i />Entradas</span>
                      <span><i />Saídas</span>
                    </div>
                    <div className="barras-dashboard">
                      {movimentacoes.panorama.intervalos.map((intervalo) => (
                        <div key={intervalo.inicio}>
                          <span
                            style={{ height: `${intervalo.alturaEntradas}%` }}
                            title={`Dias ${intervalo.rotulo}: entradas de ${moeda.format(intervalo.entradas)}`}
                          />
                          <i
                            style={{ height: `${intervalo.alturaSaidas}%` }}
                            title={`Dias ${intervalo.rotulo}: saídas de ${moeda.format(intervalo.saidas)}`}
                          />
                          <small>{intervalo.rotulo}</small>
                        </div>
                      ))}
                    </div>
                    <p className="eixo-grafico-dashboard">Dias do mês</p>
                  </div>
                  <div className="insight-dashboard">
                    <span aria-hidden="true">↕</span>
                    <p>{insightFluxo}</p>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      <NavegacaoMobile tipoConta={usuario.tipoConta} />
      {perfilAberto && (
        <ModalPerfil usuario={usuario} fechar={() => setPerfilAberto(false)} aoAtualizar={atualizarPerfil} />
      )}
      {contaPJ && emissaoAberta && (
        <ModalEmissaoBoleto
          usuario={usuario}
          fechar={() => setEmissaoAberta(false)}
          aoConcluir={movimentacoes.carregar}
        />
      )}
      {!contaPJ && pagamentoBoletoAberto && (
        <ModalPagarBoleto
          usuario={usuario}
          fechar={() => setPagamentoBoletoAberto(false)}
          atualizar={movimentacoes.carregar}
        />
      )}
    </div>
  )
}
