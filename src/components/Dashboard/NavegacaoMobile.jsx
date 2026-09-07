import { useNavigate } from 'react-router-dom'
import Icone from './Icone.jsx'

export default function NavegacaoMobile({ secao = 'inicio' }) {
  const navigate = useNavigate()
  let classeInicio = ''
  let classePix = ''

  if (secao === 'inicio') classeInicio = 'ativo'
  if (secao === 'pix') classePix = 'ativo'

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
      <button type="button">
        <Icone nome="cartao" />
        <span>Cartões</span>
      </button>
    </nav>
  )
}
