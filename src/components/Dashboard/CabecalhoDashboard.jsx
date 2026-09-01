import { useNavigate } from 'react-router-dom'
import arkheLogo from '../../assets/arkhe-logo.svg'
import Icone from './Icone.jsx'

export default function CabecalhoDashboard({ usuario, secao = 'inicio', abrirPerfil, sair }) {
  const navigate = useNavigate()
  const primeiroNome = usuario?.nome?.split(' ')[0] || 'Cliente'
  const iniciais = usuario?.nome?.split(' ').slice(0, 2).map((nome) => nome[0]).join('') || 'AR'

  return <header className="cabecalho-dashboard"><div className="conteudo-dashboard-largo barra-dashboard">
    <button className="marca-dashboard" type="button" onClick={() => navigate('/dashboard')}><span><img src={arkheLogo} alt="" /></span><strong>ARKHÉ</strong></button>
    <nav><button className={secao === 'inicio' ? 'ativo' : ''} type="button" onClick={() => navigate('/dashboard')}>Visão geral</button><button className={secao === 'pix' ? 'ativo' : ''} type="button" onClick={() => navigate('/dashboard/pix')}>Pix</button><button type="button">Cartões</button><button type="button">Planejamento</button></nav>
    <div className="perfil-topo-dashboard"><button className="usuario-dashboard" type="button" onClick={abrirPerfil}><span>{iniciais}</span><div><small>Conta pessoal</small><strong>{primeiroNome}</strong></div></button><button className="sair-dashboard" type="button" onClick={sair} aria-label="Sair"><Icone nome="sair" tamanho={20} /></button></div>
  </div></header>
}
