import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LayoutIdentidade from '../../components/Identidade/LayoutIdentidade.jsx'
import Icone from '../../components/Dashboard/Icone.jsx'
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
  return <LayoutIdentidade variante="pagina-primeiro-acesso" ocupado={processando} titulo="Crie seu PIN pessoal" descricao="Defina seu PIN definitivo para acessar todas as suas contas e convites no Arkhé.">
    <div className="ornamentos-primeiro-acesso" aria-hidden="true"><i /><i /><i /></div>
    <div className="layout-primeiro-acesso">
      <aside className="painel-seguranca-pin">
        <span className="icone-seguranca-pin"><Icone nome="escudo" tamanho={30} /></span>
        <p className="rotulo-cartao-conta">SEGURANÇA ARKHÉ</p>
        <h2>Um PIN, todos os seus acessos.</h2>
        <p>Você usará este código pessoal para entrar na sua conta PF, nas empresas e nos convites que receber.</p>
        <ul>
          <li><span><Icone nome="conferir" tamanho={15} /></span>Exatamente 6 números</li>
          <li><span><Icone nome="conferir" tamanho={15} /></span>Pessoal e intransferível</li>
          <li><span><Icone nome="conferir" tamanho={15} /></span>Protegido pela validação facial</li>
        </ul>
      </aside>
      <form className="cartao-identidade formulario-identidade formulario-primeiro-acesso" onSubmit={salvar}>
        <div className="cabecalho-formulario-pin"><span>ÚLTIMA ETAPA</span><strong>Defina seu código de acesso</strong><p>Escolha uma sequência que apenas você conheça.</p></div>
        <div className="progresso-pin" aria-label={`${pin.length} de 6 números preenchidos`}>
          {Array.from({ length: 6 }, (_, indice) => <i className={indice < pin.length ? 'preenchido' : ''} key={indice} />)}
        </div>
        <label className="campo-identidade campo-pin">Novo PIN pessoal
          <input type={mostrar ? 'text' : 'password'} inputMode="numeric" autoComplete="new-password" maxLength={6} placeholder="Digite 6 números" value={pin} disabled={processando} onChange={(e) => setPin(somenteNumeros(e.target.value).slice(0, 6))} />
        </label>
        <label className="campo-identidade campo-pin">Confirmar PIN pessoal
          <input type={mostrar ? 'text' : 'password'} inputMode="numeric" autoComplete="new-password" maxLength={6} placeholder="Repita o novo PIN" value={confirmacao} disabled={processando} onChange={(e) => setConfirmacao(somenteNumeros(e.target.value).slice(0, 6))} />
        </label>
        <div className="linha-opcoes-pin"><small>Evite datas de aniversário e sequências óbvias.</small><button type="button" className="acao-texto-pin" aria-pressed={mostrar} onClick={() => setMostrar(!mostrar)}>{mostrar ? 'Ocultar PINs' : 'Mostrar PINs'}</button></div>
        {confirmacao && pin !== confirmacao && <p className="aviso-pin" role="status">Os PINs precisam ser iguais.</p>}
        {erro && <p className="mensagem-identidade erro" role="alert">{erro}</p>}
        <div className="acoes-identidade"><button type="submit" className="botao botao-principal" disabled={processando || !pinValido(pin) || pin !== confirmacao}>{processando ? 'Salvando...' : 'Salvar PIN pessoal'} <span aria-hidden="true">→</span></button></div>
      </form>
    </div>
  </LayoutIdentidade>
}
