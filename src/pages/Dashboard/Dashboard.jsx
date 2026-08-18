import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import arkheLogo from '../../assets/arkhe-logo.svg'
import Icone from '../../components/Dashboard/Icone.jsx'
import ModalPerfil from '../../components/Dashboard/ModalPerfil.jsx'
import './Dashboard.css'

const atalhos = [['pix', 'Pix'], ['transferir', 'Transferir'], ['cartao', 'Cartões'], ['extrato', 'Extrato']]
const movimentacoes = [
  ['pix', 'Pix recebido', 'Marina Oliveira · Hoje, 10:42', '+ R$ 480,00', true],
  ['cartao', 'Mercado Boa Safra', 'Cartão final 1121 · Ontem', '- R$ 186,40'],
  ['transferir', 'Transferência enviada', 'Lucas Mendes · 16 ago', '- R$ 750,00'],
]

function lerUsuario() { try { return JSON.parse(localStorage.getItem('usuario')) } catch { return null } }

export default function Dashboard() {
  const navigate = useNavigate()
  const [usuario] = useState(lerUsuario)
  const [saldoVisivel, setSaldoVisivel] = useState(true)
  const [perfilAberto, setPerfilAberto] = useState(false)
  useEffect(() => { if (!usuario) navigate('/login', { replace: true }) }, [navigate, usuario])
  function sair() { localStorage.removeItem('usuario'); localStorage.removeItem('token'); navigate('/login', { replace: true }) }
  if (!usuario) return null
  const primeiroNome = usuario.nome?.split(' ')[0] || 'Cliente'
  const iniciais = usuario.nome?.split(' ').slice(0, 2).map((nome) => nome[0]).join('') || 'AR'

  return <div className="pagina-dashboard">
    <header className="cabecalho-dashboard"><div className="conteudo-dashboard-largo barra-dashboard">
      <button className="marca-dashboard" type="button" onClick={() => navigate('/')}><span><img src={arkheLogo} alt="" /></span><strong>ARKHÉ</strong></button>
      <nav><button className="ativo" type="button">Visão geral</button><button type="button">Movimentações</button><button type="button">Cartões</button><button type="button">Planejamento</button></nav>
      <div className="perfil-topo-dashboard"><button className="usuario-dashboard" type="button" onClick={() => setPerfilAberto(true)}><span>{iniciais}</span><div><small>Conta pessoal</small><strong>{primeiroNome}</strong></div></button><button className="sair-dashboard" type="button" onClick={sair}><Icone nome="sair" tamanho={20} /></button></div>
    </div></header>

    <main>
      <section className="hero-dashboard"><div className="orbita-dashboard orbita-um" /><div className="orbita-dashboard orbita-dois" /><div className="conteudo-dashboard-largo hero-dashboard-conteudo">
        <div className="saudacao-dashboard"><p>TERÇA-FEIRA, 18 DE AGOSTO</p><h1>Bom ter você aqui,<br /><em>{primeiroNome}.</em></h1><span>Sua vida financeira, clara e organizada em um só lugar.</span></div>
        <div className="saldo-dashboard"><div className="saldo-dashboard-topo"><span>Saldo disponível</span><button type="button" onClick={() => setSaldoVisivel(!saldoVisivel)}><Icone nome="olho" tamanho={21} /> {saldoVisivel ? 'Ocultar' : 'Mostrar'}</button></div><strong>{saldoVisivel ? 'R$ 24.850,00' : 'R$ •••••'}</strong><div className="saldo-dashboard-rodape"><div><small>Entradas no mês</small><b>+ R$ 8.420,00</b></div><i /><div><small>Saídas no mês</small><b>- R$ 3.760,00</b></div></div></div>
      </div></section>

      <div className="conteudo-dashboard-largo corpo-dashboard">
        <section className="atalhos-dashboard">{atalhos.map(([icone, texto]) => <button type="button" key={texto}><span><Icone nome={icone} /></span><strong>{texto}</strong><Icone nome="seta" tamanho={16} /></button>)}</section>
        <div className="grade-dashboard">
          <section className="bloco-dashboard atividade-dashboard"><div className="titulo-bloco-dashboard"><div><p>CONTA</p><h2>Movimentações recentes</h2></div><button type="button">Ver tudo <Icone nome="seta" tamanho={15} /></button></div><div className="lista-dashboard">{movimentacoes.map(([icone, titulo, detalhe, valor, entrada]) => <article key={titulo + detalhe}><span><Icone nome={icone} /></span><div><strong>{titulo}</strong><small>{detalhe}</small></div><b className={entrada ? 'entrada' : ''}>{valor}</b></article>)}</div></section>
          <section className="cartao-dashboard"><div className="titulo-bloco-dashboard titulo-cartao-dashboard"><div><p>CARTÃO ARKHÉ</p><h2>Essencial</h2></div><button type="button"><Icone nome="seta" tamanho={17} /></button></div><div className="cartao-visual-dashboard"><div><span>ARKHÉ</span><i>)))</i></div><b>••••&nbsp; ••••&nbsp; ••••&nbsp; 1121</b><small>{usuario.nome?.toUpperCase()}</small></div><div className="uso-cartao-dashboard"><div><span>Fatura atual</span><strong>R$ 1.840,00</strong></div><div><span>Melhor dia de compra</span><strong>Dia 22</strong></div></div><div className="linha-limite-dashboard"><i /><span>23% do limite utilizado</span></div></section>
          <section className="bloco-dashboard panorama-dashboard"><div className="titulo-bloco-dashboard"><div><p>PLANEJAMENTO</p><h2>Panorama do mês</h2></div><button type="button">30 dias</button></div><div className="grafico-dashboard"><div className="legenda-grafico"><span><i />Entradas</span><span><i />Saídas</span></div><div className="barras-dashboard">{[[48,25],[62,35],[54,42],[78,37],[67,46],[88,39],[74,51]].map(([entrada, saida], indice) => <div key={indice}><span style={{ height: `${entrada}%` }} /><i style={{ height: `${saida}%` }} /></div>)}</div><div className="dias-grafico"><span>12 ago</span><span>18 ago</span></div></div><div className="insight-dashboard"><span>↗</span><p>Suas entradas estão <strong>12% maiores</strong> que no mês passado.</p></div></section>
          <section className="bloco-dashboard objetivo-dashboard"><div className="icone-objetivo-dashboard"><span>◇</span></div><p>SEU PRÓXIMO PASSO</p><h2>Transforme planos<br />em conquistas.</h2><span>Crie um objetivo e acompanhe sua evolução todos os meses.</span><button type="button"><Icone nome="mais" tamanho={18} /> Criar objetivo</button></section>
        </div>
      </div>
    </main>
    <nav className="navegacao-mobile-dashboard"><button className="ativo" type="button"><Icone nome="inicio" /><span>Início</span></button><button type="button"><Icone nome="pix" /><span>Pix</span></button><button type="button"><Icone nome="transferir" /><span>Transferir</span></button><button type="button"><Icone nome="cartao" /><span>Cartões</span></button></nav>
    {perfilAberto && <ModalPerfil usuario={usuario} fechar={() => setPerfilAberto(false)} />}
  </div>
}
