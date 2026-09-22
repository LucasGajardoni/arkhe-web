import { useNavigate } from 'react-router-dom'
import arkheLogo from '../../assets/arkhe-logo.svg'
import Icone from './Icone.jsx'
import { proprietarioPJ, rotuloConta as descreverConta } from '../../utils/contas.js'

export default function CabecalhoDashboard({ usuario, secao = 'inicio', abrirPerfil, sair }) {
  const navigate = useNavigate()
  const primeiroNome = usuario?.nome?.split(' ')[0] || 'Cliente'
  const iniciais = usuario?.nome?.split(' ').slice(0, 2).map((nome) => nome[0]).join('') || 'AR'
  const rotuloConta = descreverConta(usuario)
  let rotuloBoletos = 'DDA / Boletos'

  if (usuario?.tipoConta === 'PJ') {
    rotuloBoletos = 'Boletos emitidos'
  }

  return (
    <header className="cabecalho-dashboard">
      <div className="conteudo-dashboard-largo barra-dashboard">
        <button className="marca-dashboard" type="button" aria-label="Arkhé, visão geral" onClick={() => navigate('/dashboard')}>
          <span><img src={arkheLogo} alt="" /></span>
          <strong>ARKHÉ</strong>
        </button>
        <nav aria-label="Navegação da conta">
          <button className={secao === 'inicio' ? 'ativo' : ''} type="button" aria-current={secao === 'inicio' ? 'page' : undefined} onClick={() => navigate('/dashboard')}>
            Visão geral
          </button>
          <button className={secao === 'pix' ? 'ativo' : ''} type="button" aria-current={secao === 'pix' ? 'page' : undefined} onClick={() => navigate('/dashboard/pix')}>
            Pix
          </button>
          <button className={secao === 'extrato' ? 'ativo' : ''} type="button" aria-current={secao === 'extrato' ? 'page' : undefined} onClick={() => navigate('/dashboard/extrato')}>Extrato</button>
          <button className={secao === 'boletos' ? 'ativo' : ''} type="button" aria-current={secao === 'boletos' ? 'page' : undefined} onClick={() => navigate('/dashboard/boletos')}>{rotuloBoletos}</button>
          {usuario?.tipoConta === 'PJ' && (
            <button className={secao === 'integracoes' ? 'ativo' : ''} type="button" aria-current={secao === 'integracoes' ? 'page' : undefined} onClick={() => navigate('/dashboard/integracoes')}>Integrações</button>
          )}
        </nav>
        <div className="perfil-topo-dashboard">
          {proprietarioPJ(usuario) && <button className={`atalho-equipe ${secao === 'acessos' ? 'ativo' : ''}`} type="button" aria-current={secao === 'acessos' ? 'page' : undefined} onClick={() => navigate('/dashboard/acessos')}>Equipe</button>}
          <button className="trocar-conta-dashboard" type="button" onClick={() => navigate('/selecionar-conta')}>Trocar conta</button>
          <button className="usuario-dashboard" type="button" aria-label={`Abrir perfil de ${usuario?.nome || 'cliente'}`} onClick={abrirPerfil}>
            <span>{iniciais}</span>
            <div>
              <small>{rotuloConta}</small>
              <strong>{primeiroNome}</strong>
              {usuario?.tipoConta === 'PJ' && <small className="empresa-topo-dashboard">{usuario.nomeFantasia || usuario.razaoSocial}</small>}
            </div>
          </button>
          <button className="sair-dashboard" type="button" onClick={sair} aria-label="Sair">
            <Icone nome="sair" tamanho={20} />
          </button>
        </div>
      </div>
    </header>
  )
}
