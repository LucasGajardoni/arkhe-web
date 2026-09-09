import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CabecalhoDashboard from '../../components/Dashboard/CabecalhoDashboard.jsx'
import Icone from '../../components/Dashboard/Icone.jsx'
import ModalPerfil from '../../components/Dashboard/ModalPerfil.jsx'
import NavegacaoMobile from '../../components/Dashboard/NavegacaoMobile.jsx'
import ModalEmissaoBoleto from '../../components/Boleto/ModalEmissaoBoleto.jsx'
import { useSessao } from '../../hooks/useSessao.js'
import { useMovimentacoes } from '../../hooks/useMovimentacoes.js'
import { encerrarSessao } from '../../services/authService.js'
import './Dashboard.css'

const atalhos = [
  ['pix', 'Pix'],
  ['cartao', 'Cartões'],
  ['extrato', 'Extrato'],
]

const barrasPanorama = [
  [48, 25],
  [62, 35],
  [54, 42],
  [78, 37],
  [67, 46],
  [88, 39],
  [74, 51],
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { perfil, atualizarPerfil, limparSessao } = useSessao()
  const [saldoVisivel, setSaldoVisivel] = useState(true)
  const [perfilAberto, setPerfilAberto] = useState(false)
  const [boletoAberto, setBoletoAberto] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const [erroSessao, setErroSessao] = useState('')
  const usuario = perfil
  const podeEmitirBoleto = usuario.tipoConta === 'PJ'
  const atalhosVisiveis = podeEmitirBoleto
    ? [...atalhos, ['boleto', 'Emitir boleto']]
    : atalhos
  const movimentacoes = useMovimentacoes()
  const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

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

  let primeiroNome = ''
  if (usuario.nome) primeiroNome = usuario.nome.split(' ')[0]

  let textoSaldo = 'Ocultar'
  let valorSaldo = movimentacoes.carregando ? 'Carregando...' : moeda.format(movimentacoes.saldo)
  if (!saldoVisivel) {
    textoSaldo = 'Mostrar'
    valorSaldo = 'R$ •••••'
  }

  let modalPerfil = null
  if (perfilAberto) {
    modalPerfil = (
      <ModalPerfil
        usuario={usuario}
        fechar={() => setPerfilAberto(false)}
        aoAtualizar={atualizarPerfil}
      />
    )
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
              <p>TERÇA-FEIRA, 18 DE AGOSTO</p>
              <h1>
                Bom ter você aqui,<br />
                <em>{primeiroNome}.</em>
              </h1>
              <span>Sua vida financeira, clara e organizada em um só lugar.</span>
            </div>

            <div className="saldo-dashboard">
              <div className="saldo-dashboard-topo">
                <span>Saldo disponível</span>
                <button type="button" onClick={() => setSaldoVisivel(!saldoVisivel)}>
                  <Icone nome="olho" tamanho={21} /> {textoSaldo}
                </button>
              </div>
              <strong>{valorSaldo}</strong>
              <div className="saldo-dashboard-rodape">
                <div>
                  <small>Entradas no mês</small>
                  <b>+ {moeda.format(movimentacoes.entradas)}</b>
                </div>
                <i />
                <div>
                  <small>Saídas no mês</small>
                  <b>- {moeda.format(movimentacoes.saidas)}</b>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="conteudo-dashboard-largo corpo-dashboard">
          <section className={`atalhos-dashboard${podeEmitirBoleto ? ' quatro-atalhos' : ''}`}>
            {atalhosVisiveis.map(([icone, texto]) => {
              let abrirAtalho
              if (icone === 'pix') abrirAtalho = () => navigate('/dashboard/pix')
              if (icone === 'extrato') abrirAtalho = () => navigate('/dashboard/extrato')
              if (icone === 'boleto') abrirAtalho = () => setBoletoAberto(true)

              return (
                <button type="button" key={texto} onClick={abrirAtalho}>
                  <span><Icone nome={icone} /></span>
                  <strong>{texto}</strong>
                  <Icone nome="seta" tamanho={16} />
                </button>
              )
            })}
          </section>

          <div className="grade-dashboard">
            <section className="bloco-dashboard atividade-dashboard">
              <div className="titulo-bloco-dashboard">
                <div>
                  <p>CONTA</p>
                  <h2>Movimentações recentes</h2>
                </div>
                <button type="button" onClick={() => navigate('/dashboard/extrato')}>Ver tudo <Icone nome="seta" tamanho={15} /></button>
              </div>
              <div className="lista-dashboard">
                {movimentacoes.carregando && <p className="estado-movimentacoes-dashboard">Buscando movimentações...</p>}
                {!movimentacoes.carregando && movimentacoes.erro && <p className="estado-movimentacoes-dashboard erro" role="alert">{movimentacoes.erro}</p>}
                {!movimentacoes.carregando && !movimentacoes.erro && movimentacoes.ordenadas.length === 0 && <p className="estado-movimentacoes-dashboard">Você ainda não possui movimentações.</p>}
                {!movimentacoes.carregando && !movimentacoes.erro && movimentacoes.ordenadas.slice(0, 5).map((item) => {
                  const entrada = item.tipo === 'entrada'
                  const data = new Date(item.data_movimentacao)
                  const detalhe = Number.isNaN(data.getTime()) ? 'Data não informada' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(data)
                  return (
                    <article key={item.id_movimentacao}>
                      <span><Icone nome="pix" /></span>
                      <div><strong>{entrada ? 'Pix recebido' : 'Pix enviado'}</strong><small>{detalhe}</small></div>
                      <b className={entrada ? 'entrada' : ''}>{entrada ? '+' : '-'} {moeda.format(Number(item.valor) || 0)}</b>
                    </article>
                  )
                })}
              </div>
            </section>

            <section className="cartao-dashboard">
              <div className="titulo-bloco-dashboard titulo-cartao-dashboard">
                <div>
                  <p>CARTÃO ARKHÉ</p>
                  <h2>Essencial</h2>
                </div>
                <button type="button"><Icone nome="seta" tamanho={17} /></button>
              </div>
              <div className="cartao-visual-dashboard">
                <div>
                  <span>ARKHÉ</span>
                  <i>)))</i>
                </div>
                <b>••••&nbsp; ••••&nbsp; ••••&nbsp; 1121</b>
                <small>{usuario.nome?.toUpperCase()}</small>
              </div>
              <div className="uso-cartao-dashboard">
                <div>
                  <span>Fatura atual</span>
                  <strong>R$ 1.840,00</strong>
                </div>
                <div>
                  <span>Melhor dia de compra</span>
                  <strong>Dia 22</strong>
                </div>
              </div>
              <div className="linha-limite-dashboard">
                <i />
                <span>23% do limite utilizado</span>
              </div>
            </section>

            <section className="bloco-dashboard panorama-dashboard">
              <div className="titulo-bloco-dashboard">
                <div>
                  <p>PLANEJAMENTO</p>
                  <h2>Panorama do mês</h2>
                </div>
                <button type="button">30 dias</button>
              </div>
              <div className="grafico-dashboard">
                <div className="legenda-grafico">
                  <span><i />Entradas</span>
                  <span><i />Saídas</span>
                </div>
                <div className="barras-dashboard">
                  {barrasPanorama.map(([entrada, saida], indice) => (
                    <div key={indice}>
                      <span style={{ height: `${entrada}%` }} />
                      <i style={{ height: `${saida}%` }} />
                    </div>
                  ))}
                </div>
                <div className="dias-grafico">
                  <span>12 ago</span>
                  <span>18 ago</span>
                </div>
              </div>
              <div className="insight-dashboard">
                <span>↗</span>
                <p>Suas entradas estão <strong>12% maiores</strong> que no mês passado.</p>
              </div>
            </section>

            <section className="bloco-dashboard objetivo-dashboard">
              <div className="icone-objetivo-dashboard"><span>◇</span></div>
              <p>SEU PRÓXIMO PASSO</p>
              <h2>Transforme planos<br />em conquistas.</h2>
              <span>Crie um objetivo e acompanhe sua evolução todos os meses.</span>
              <button type="button"><Icone nome="mais" tamanho={18} /> Criar objetivo</button>
            </section>
          </div>
        </div>
      </main>

      <NavegacaoMobile tipoConta={usuario.tipoConta} />
      {modalPerfil}
      {podeEmitirBoleto && boletoAberto && (
        <ModalEmissaoBoleto usuario={usuario} fechar={() => setBoletoAberto(false)} />
      )}
    </div>
  )
}
