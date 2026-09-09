import { useNavigate } from 'react-router-dom'
import Icone from './Icone.jsx'

export default function NavegacaoMobile({ secao = 'inicio', tipoConta = '' }) {
  const navigate = useNavigate()
  let classeInicio = ''
  let classePix = ''
  let classeExtrato = ''
  let classeBoletos = ''

  if (secao === 'inicio') classeInicio = 'ativo'
  if (secao === 'pix') classePix = 'ativo'
  if (secao === 'extrato') classeExtrato = 'ativo'
  if (secao === 'boletos') classeBoletos = 'ativo'

  return (
    <nav className="navegacao-mobile-dashboard">
      <button className={classeInicio} type="button" onClick={() => navigate('/dashboard')}>
        <Icone nome="inicio" />
        <span>Início</span>
      </button>
      <button className={classePix} type="button" onClick={() => navigate('/dashboard/pix')}>
        <Icone nome="pix" />
        <span>Pix</span>
      </button>
      <button className={classeExtrato} type="button" onClick={() => navigate('/dashboard/extrato')}>
        <Icone nome="extrato" />
        <span>Extrato</span>
      </button>
      <button className={classeBoletos} type="button" onClick={() => navigate('/dashboard/boletos')}>
        <Icone nome="boleto" />
        <span>{tipoConta === 'PJ' ? 'Emitidos' : 'DDA'}</span>
      </button>
    </nav>
  )
}
