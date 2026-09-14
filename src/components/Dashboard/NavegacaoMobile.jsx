import { useNavigate } from 'react-router-dom'
import Icone from './Icone.jsx'

export default function NavegacaoMobile({ secao = 'inicio', tipoConta = '' }) {
  const navigate = useNavigate()

  return (
    <nav className="navegacao-mobile-dashboard" aria-label="Navegação da conta">
      <button className={secao === 'inicio' ? 'ativo' : ''} type="button" aria-current={secao === 'inicio' ? 'page' : undefined} onClick={() => navigate('/dashboard')}>
        <Icone nome="inicio" />
        <span>Início</span>
      </button>
      <button className={secao === 'pix' ? 'ativo' : ''} type="button" aria-current={secao === 'pix' ? 'page' : undefined} onClick={() => navigate('/dashboard/pix')}>
        <Icone nome="pix" />
        <span>Pix</span>
      </button>
      <button className={secao === 'extrato' ? 'ativo' : ''} type="button" aria-current={secao === 'extrato' ? 'page' : undefined} onClick={() => navigate('/dashboard/extrato')}>
        <Icone nome="extrato" />
        <span>Extrato</span>
      </button>
      <button className={secao === 'boletos' ? 'ativo' : ''} type="button" aria-current={secao === 'boletos' ? 'page' : undefined} onClick={() => navigate('/dashboard/boletos')}>
        <Icone nome="boleto" />
        <span>{tipoConta === 'PJ' ? 'Cobranças' : 'Boletos'}</span>
      </button>
      {tipoConta === 'PJ' && (
        <button className={secao === 'integracoes' ? 'ativo' : ''} type="button" aria-current={secao === 'integracoes' ? 'page' : undefined} onClick={() => navigate('/dashboard/integracoes')}>
          <Icone nome="api" />
          <span>API</span>
        </button>
      )}
    </nav>
  )
}
