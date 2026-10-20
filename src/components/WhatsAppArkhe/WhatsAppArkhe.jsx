import { useEffect, useState } from 'react'
import { requisitarApi } from '../../services/authService.js'
import './WhatsAppArkhe.css'

const niveis = [
  { id: 1, nome: 'Consultas', descricao: 'Saldo, extrato e informações da conta.' },
  { id: 2, nome: 'Transações', descricao: 'Consultas e movimentações, quando habilitadas no assistente.' },
  { id: 3, nome: 'Serviços PJ', descricao: 'Transações e cobranças empresariais, quando habilitadas.' },
]

export default function WhatsAppArkhe() {
  const [config, setConfig] = useState(null)
  const [nivel, setNivel] = useState(1)
  const [carregando, setCarregando] = useState(true)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    let ativo = true
    requisitarApi('/whatsapp/configuracao')
      .then(dados => {
        if (!ativo) return
        setConfig(dados)
        const maximo = Number(dados.tipo_conta) === 1 ? 3 : 2
        setNivel(Math.min(maximo, Number(dados.nivel) || 1))
      })
      .catch(e => { if (ativo) setErro(e.message || 'Não foi possível carregar a configuração.') })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [])

  async function salvar(autorizado) {
    setOcupado(true)
    setErro('')
    setMensagem('')
    try {
      const dados = await requisitarApi('/whatsapp/configuracao', {
        method: 'PUT', dados: { autorizado, nivel },
      })
      setConfig(dados)
      if (!autorizado) {
        setMensagem('Autorização desativada nesta conta.')
        return
      }
      setMensagem('Autorização salva. Preparando mensagem de ativação...')
      try {
        const envio = await requisitarApi('/whatsapp/ativar', { method: 'POST' })
        setMensagem(envio.mensagem || 'Mensagem enviada. Responda ATIVAR no WhatsApp.')
      } catch (e) {
        setErro('A autorização foi salva, mas a mensagem não foi enviada: ' + (e.message || 'erro no envio pelo WAHA.'))
        setMensagem('')
      }
    } catch (e) {
      setErro(e.message || 'Não foi possível salvar a autorização.')
    } finally { setOcupado(false) }
  }

  async function reenviar() {
    setOcupado(true)
    setErro('')
    setMensagem('')
    try {
      const envio = await requisitarApi('/whatsapp/ativar', { method: 'POST' })
      setMensagem(envio.mensagem || 'Mensagem enviada. Confira seu WhatsApp.')
    } catch (e) { setErro(e.message || 'Não foi possível enviar a mensagem.') }
    finally { setOcupado(false) }
  }

  const autorizado = Boolean(config?.autorizado)
  const nivelSalvo = Number(config?.nivel) || 1
  const alterado = nivel !== nivelSalvo

  return (
    <section className="arkhe-wa-painel" aria-labelledby="titulo-wa-dashboard">
      <div className="arkhe-wa-topo">
        <div className="arkhe-wa-simbolo" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none" width="28" height="28">
            <path d="M7 24l2.7-5.1a10 10 0 1 1 4.1 3.7L7 24Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"/>
            <path d="M12 12.8c1.3 3.3 3.7 5.6 7.1 6.9l2-1.8-2.8-2-1.4 1c-1.4-.7-2.8-2-3.5-3.5l1-1.5-2.1-2.7-1.3 1.6Z" fill="currentColor"/>
          </svg>
        </div>
        <div className="arkhe-wa-cabecalho">
          <span className="arkhe-wa-eyebrow">INTEGRAÇÃO DIGITAL</span>
          <h2 id="titulo-wa-dashboard">Arkhé no WhatsApp</h2>
          <p>Seu banco mais perto. Gerencie a autorização desta conta e receba o convite de ativação diretamente no celular cadastrado.</p>
        </div>
        {!carregando && config && <span className={autorizado ? 'arkhe-wa-situacao autorizado' : 'arkhe-wa-situacao'}>
          <span aria-hidden="true" />{autorizado ? 'Autorizado' : 'Não autorizado'}
        </span>}
      </div>

      {carregando ? <p className="arkhe-wa-feedback">Carregando integração...</p> : config && <>
        <div className="arkhe-wa-conteudo">
          <div className="arkhe-wa-coluna">
            <label htmlFor="arkhe-wa-nivel">Nível de permissão</label>
            <select id="arkhe-wa-nivel" value={nivel} disabled={ocupado}
              onChange={e => setNivel(Number(e.target.value))}>
              {niveis.filter(n => Number(config.tipo_conta) === 1 || n.id <= 2).map(n =>
                <option key={n.id} value={n.id}>Nível {n.id} — {n.nome}</option>)}
            </select>
            <span className="arkhe-wa-ajuda">{niveis.find(n => n.id === nivel)?.descricao}</span>
          </div>
          <div className="arkhe-wa-instrucoes">
            <strong>Como ativar</strong>
            <span><b>01</b> Autorize a conta e escolha o nível.</span>
            <span><b>02</b> Receba uma mensagem do Arkhé.</span>
            <span><b>03</b> Responda <strong>ATIVAR</strong> em até 10 minutos.</span>
          </div>
        </div>

        <div className="arkhe-wa-acoes">
          {!autorizado && <button className="arkhe-wa-primario" type="button" disabled={ocupado} onClick={() => salvar(true)}>Autorizar WhatsApp <span aria-hidden="true">↗</span></button>}
          {autorizado && <>
            {alterado && <button className="arkhe-wa-primario" type="button" disabled={ocupado} onClick={() => salvar(true)}>Salvar novo nível <span aria-hidden="true">→</span></button>}
            <button className="arkhe-wa-primario" type="button" disabled={ocupado || alterado} onClick={reenviar}>Enviar mensagem de ativação <span aria-hidden="true">↗</span></button>
            <button className="arkhe-wa-desativar" type="button" disabled={ocupado} onClick={() => salvar(false)}>Desativar</button>
          </>}
        </div>
        {mensagem && <p className="arkhe-wa-sucesso" role="status">{mensagem}</p>}
        {erro && <p className="arkhe-wa-erro" role="alert">{erro}</p>}
        <div className="arkhe-wa-rodape">A autorização registrada no banco não significa que o WhatsApp já esteja vinculado. A confirmação é concluída ao responder ATIVAR. Serviços financeiros dependem da liberação no assistente.</div>
      </>}
      {!carregando && !config && <p className="arkhe-wa-erro" role="alert">{erro} Atualize a página para tentar novamente.</p>}
    </section>
  )
}
