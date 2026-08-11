import { useNavigate } from 'react-router-dom'
import Home from '../Home/Home.jsx'
import ModalTipoConta from '../../components/ModalTipoConta/ModalTipoConta.jsx'

export default function EscolherConta() {
  const navigate = useNavigate()

  function escolherTipo(tipo) {
    navigate(`/cadastro/${tipo.toLowerCase()}`)
  }

  return (
    <>
      <Home />
      <ModalTipoConta fechar={() => navigate('/')} escolherTipo={escolherTipo} />
    </>
  )
}
