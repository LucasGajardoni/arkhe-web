import { useState } from 'react'
import Home from './pages/Home/Home.jsx'
import Cadastro from './pages/Cadastro/Cadastro.jsx'
import Login from './pages/Login/Login.jsx'
import ModalTipoConta from './components/ModalTipoConta/ModalTipoConta.jsx'

function App() {
  const [paginaAtual, setPaginaAtual] = useState('home')
  const [modalContaAberto, setModalContaAberto] = useState(false)
  const [tipoConta, setTipoConta] = useState('PF')

  function iniciarCadastro(tipo) {
    setTipoConta(tipo)
    setModalContaAberto(false)
    setPaginaAtual('cadastro')
  }

  if (paginaAtual === 'cadastro') {
    return <Cadastro tipoContaInicial={tipoConta} voltarParaHome={() => setPaginaAtual('home')} irParaLogin={() => setPaginaAtual('login')} />
  }

  if (paginaAtual === 'login') {
    return <Login voltarParaHome={() => setPaginaAtual('home')} abrirCadastro={() => { setPaginaAtual('home'); setModalContaAberto(true) }} />
  }

  return (
    <>
      <Home abrirCadastro={() => setModalContaAberto(true)} abrirLogin={() => setPaginaAtual('login')} />
      {modalContaAberto && <ModalTipoConta fechar={() => setModalContaAberto(false)} escolherTipo={iniciarCadastro} />}
    </>
  )
}

export default App
