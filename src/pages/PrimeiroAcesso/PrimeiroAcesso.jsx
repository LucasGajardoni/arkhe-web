import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LayoutIdentidade from '../../components/Identidade/LayoutIdentidade.jsx'
import { useSessao } from '../../hooks/useSessao.js'
import { somenteNumeros } from '../../utils/formatadores.js'
import { pinValido } from '../../utils/validadores.js'

export default function PrimeiroAcesso() {
  const { concluirPrimeiroAcesso, tratarErroSessao } = useSessao()
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')
  async function salvar(evento) {
    evento.preventDefault()
    if (processando || !pinValido(pin) || pin !== confirmacao) return
    setProcessando(true)
    setErro('')
    try {
      await concluirPrimeiroAcesso(pin)
      navigate('/selecionar-conta', { replace: true })
    } catch (falha) { tratarErroSessao(falha); setErro(falha.message) }
    finally { setProcessando(false) }
  }
  return <LayoutIdentidade ocupado={processando} titulo="Crie seu PIN pessoal" descricao="Defina seu PIN definitivo para acessar todas as suas contas e convites no Arkhé.">
    <form className="cartao-identidade formulario-identidade" onSubmit={salvar}>
      <p>Seu PIN pessoal deve ter exatamente 6 números.</p>
      <label className="campo-identidade">Novo PIN pessoal
        <input type={mostrar ? 'text' : 'password'} inputMode="numeric" autoComplete="new-password" maxLength={6} value={pin} disabled={processando} onChange={(e) => setPin(somenteNumeros(e.target.value).slice(0, 6))} />
      </label>
      <label className="campo-identidade">Confirmar PIN pessoal
        <input type={mostrar ? 'text' : 'password'} inputMode="numeric" autoComplete="new-password" maxLength={6} value={confirmacao} disabled={processando} onChange={(e) => setConfirmacao(somenteNumeros(e.target.value).slice(0, 6))} />
      </label>
      <button type="button" className="botao botao-secundario" aria-pressed={mostrar} onClick={() => setMostrar(!mostrar)}>{mostrar ? 'Ocultar PINs' : 'Mostrar PINs'}</button>
      {confirmacao && pin !== confirmacao && <p role="status">Os PINs precisam ser iguais.</p>}
      {erro && <p className="mensagem-identidade erro" role="alert">{erro}</p>}
      <div className="acoes-identidade"><button type="submit" className="botao botao-principal" disabled={processando || !pinValido(pin) || pin !== confirmacao}>{processando ? 'Salvando...' : 'Salvar PIN pessoal'}</button></div>
    </form>
  </LayoutIdentidade>
}
