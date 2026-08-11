import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home/Home.jsx'
import Cadastro from './pages/Cadastro/Cadastro.jsx'
import Login from './pages/Login/Login.jsx'
import EscolherConta from './pages/EscolherConta/EscolherConta.jsx'

export const API_URL = 'http://127.0.0.1:5000'

// Configuração fixa da API facial usada neste projeto acadêmico.
// Em produção, o segredo nunca deveria ficar no navegador: o backend deveria
// criar as sessões faciais e entregar ao front apenas o token temporário.
export const FACE_API_URL = 'https://apps-arkhe-identity-api.ucxocw.easypanel.host'
export const FACE_CLIENT_ID = 'arkhe'
export const FACE_CLIENT_SECRET = 'mariahsaudadespontinaindaamamuitoela'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<EscolherConta />} />
        <Route path="/cadastro/pf" element={<Cadastro tipoConta="PF" />} />
        <Route path="/cadastro/pj" element={<Cadastro tipoConta="PJ" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
