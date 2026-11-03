import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { API_URL } from './config/api.js'
import { registrarIpComputador } from './services/ipComputador.js'

async function iniciar() {
  const raiz = createRoot(document.getElementById('root'))
  const ip = new URLSearchParams(window.location.hash.slice(1)).get('ip_computador')
  if (ip) {
    let registrado = false
    try {
      registrado = await registrarIpComputador(ip, API_URL)
    } catch { /* O aviso abaixo permite tentar novamente sem perder o IP. */ }
    if (!registrado) {
      raiz.render(<p role="alert">Não foi possível registrar o IP deste computador. Confira sua conexão e recarregue a página.</p>)
      return
    }
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
  }
  raiz.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

iniciar()
