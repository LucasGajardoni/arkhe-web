import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home/Home.jsx'
import Cadastro from './pages/Cadastro/Cadastro.jsx'
import Login from './pages/Login/Login.jsx'
import EscolherConta from './pages/EscolherConta/EscolherConta.jsx'
import Dashboard from './pages/Dashboard/Dashboard.jsx'
import Pix from './pages/Pix/Pix.jsx'
import Extrato from './pages/Extrato/Extrato.jsx'
import Boletos from './pages/Boletos/Boletos.jsx'
import Integracoes from './pages/Integracoes/Integracoes.jsx'
import SessaoProvider from './contexts/SessaoProvider.jsx'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute.jsx'
import IdentityRoute from './components/ProtectedRoute/IdentityRoute.jsx'
import PrimeiroAcesso from './pages/PrimeiroAcesso/PrimeiroAcesso.jsx'
import SelecionarConta from './pages/SelecionarConta/SelecionarConta.jsx'
import Acessos from './pages/Acessos/Acessos.jsx'

export default function App() {
  return (
    <SessaoProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<EscolherConta />} />
          <Route path="/cadastro/pf" element={<Cadastro tipoConta="PF" />} />
          <Route path="/cadastro/pj" element={<Cadastro tipoConta="PJ" />} />
          <Route path="/desenvolvedores/api" element={<Navigate to="/dashboard/integracoes#documentacao-api" replace />} />
          <Route element={<IdentityRoute />}>
            <Route path="/primeiro-acesso" element={<PrimeiroAcesso />} />
            <Route path="/selecionar-conta" element={<SelecionarConta />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/pix" element={<Pix />} />
            <Route path="/dashboard/extrato" element={<Extrato />} />
            <Route path="/dashboard/boletos" element={<Boletos />} />
            <Route path="/dashboard/integracoes" element={<Integracoes />} />
            <Route path="/dashboard/acessos" element={<Acessos />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SessaoProvider>
  )
}
