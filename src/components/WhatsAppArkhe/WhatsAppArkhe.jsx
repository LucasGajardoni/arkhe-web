import { useEffect, useState } from 'react'
import { requisitarApi } from '../../services/authService.js'
import './WhatsAppArkhe.css'

export default function WhatsAppArkhe() {
  const [config, setConfig] = useState(null)
  const [nivel, setNivel] = useState(1)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    let ativo = true
    requisitarApi('/whatsapp/configuracao').then(dados => {
      if (!ativo) return
      setConfig(dados)
      setNivel(Number(dados.nivel) || 1)
    }).catch(e => { if (ativo) setErro(e.message) })
    return () => { ativo = false }
  }, [])

  async function alterar(autorizado) {
    setSalvando(true)
    setErro('')
    setMensagem('')
    try {
      const dados = await requisitarApi('/whatsapp/configuracao', {
        method: 'PUT', dados: { autorizado, nivel },
      })
      setConfig(dados)
      setMensagem(autorizado ? 'Autorização salva. Agora inicie a conversa.' : 'WhatsApp desativado nesta conta.')
    } catch (e) { setErro(e.message) }
    finally { setSalvando(false) }
  }

  async function iniciar() {
    setSalvando(true)
    setErro('')
    const janela = window.open('', '_blank')
    try {
      const resposta = await requisitarApi('/whatsapp/link', { method: 'POST' })
      if (janela) janela.location.href = resposta.url
      else window.location.href = resposta.url
      setMensagem('Envie a mensagem preenchida no WhatsApp para iniciar a verificação.')
    } catch (e) {
      if (janela) janela.close()
      setErro(e.message)
    } finally { setSalvando(false) }
  }

  return (
    <section className="arkhe-whatsapp" aria-label="WhatsApp do Arkhé">
      <div>
        <small>ASSISTENTE ARKHÉ</small>
        <h2>Seu banco também no WhatsApp</h2>
        <p>Autorize esta conta, escolha o nível e abra uma conversa com o número oficial do Arkhé. O acesso bancário só será liberado após a verificação de identidade.</p>
      </div>
      {!config && !erro && <p>Carregando configuração...</p>}
      {config && <>
        <label htmlFor="nivel-whatsapp-arkhe">Nível permitido para esta conta</label>
        <select id="nivel-whatsapp-arkhe" value={nivel} onChange={e => setNivel(Number(e.target.value))} disabled={salvando}>
          <option value={1}>Nível 1 — consultas</option>
          <option value={2}>Nível 2 — serviços</option>
          <option value={3}>Nível 3 — movimentações</option>
        </select>
        <p className="arkhe-whatsapp-status">Status: {config.autorizado ? 'autorizado' : 'desativado'}</p>
        <div className="arkhe-whatsapp-acoes">
          <button type="button" disabled={salvando} onClick={() => alterar(true)}>
            {config.autorizado ? 'Salvar nível' : 'Autorizar WhatsApp'}
          </button>
          {config.autorizado && <button type="button" disabled={salvando || nivel !== Number(config.nivel)} onClick={iniciar}>Abrir WhatsApp</button>}
          {config.autorizado && <button type="button" className="arkhe-whatsapp-desativar" disabled={salvando} onClick={() => alterar(false)}>Desativar</button>}
        </div>
      </>}
      {mensagem && <p role="status">{mensagem}</p>}
      {erro && <p role="alert" className="arkhe-whatsapp-erro">{erro}</p>}
    </section>
  )
}
