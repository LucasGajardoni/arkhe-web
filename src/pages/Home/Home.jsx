import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header.jsx'
import Hero from '../../components/Hero/Hero.jsx'
import Beneficios from '../../components/Beneficios/Beneficios.jsx'
import EcossistemaProdutos from '../../components/EcossistemaProdutos/EcossistemaProdutos.jsx'
import SecaoSeguranca from '../../components/SecaoSeguranca/SecaoSeguranca.jsx'
import ChamadaFinal from '../../components/ChamadaFinal/ChamadaFinal.jsx'
import Footer from '../../components/Footer/Footer.jsx'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()
  const abrirCadastro = () => navigate('/cadastro')
  const abrirLogin = () => navigate('/login')

  return (
    <div className="home">
      <Header abrirCadastro={abrirCadastro} abrirLogin={abrirLogin} />
      <div className="aviso-academico" role="note">AMBIENTE ACADÊMICO <span>•</span> PROJETO EXPERIMENTAL 2026</div>
      <main>
        <Hero abrirCadastro={abrirCadastro} abrirLogin={abrirLogin} />
        <Beneficios />
        <EcossistemaProdutos />
        <SecaoSeguranca />
        <ChamadaFinal abrirCadastro={abrirCadastro} />
      </main>
      <Footer />
    </div>
  )
}
