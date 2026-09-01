import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home/Home.jsx'
import Cadastro from './pages/Cadastro/Cadastro.jsx'
import Login from './pages/Login/Login.jsx'
import EscolherConta from './pages/EscolherConta/EscolherConta.jsx'
import Dashboard from './pages/Dashboard/Dashboard.jsx'
import Pix from './pages/Pix/Pix.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<EscolherConta />} />
        <Route path="/cadastro/pf" element={<Cadastro tipoConta="PF" />} />
        <Route path="/cadastro/pj" element={<Cadastro tipoConta="PJ" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/pix" element={<Pix />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
