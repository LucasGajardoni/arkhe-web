import { useEffect, useRef, useState } from 'react'
import { obterHistoricoMauroAdmin, perguntarMauroAdmin } from '../../services/adminBancoService.js'

const SUGESTOES = [
  'Quantos usuários e contas existem no Arkhé?',
  'Quantas movimentações tivemos neste mês?',
  'Como está a situação geral do banco?',
  'Quantas cobranças estão pendentes?',
]

export default function MauroAdmin({ ativo }) {
  const [mensagens, setMensagens] = useState([{
    id: 'boas-vindas', papel: 'ASSISTENTE',
    conteudo: 'Olá! Sou o MAURO Administração. Posso consultar indicadores agregados reais do Arkhé, como usuários, contas PF/PJ, movimentações, cobranças e disponibilidade dos serviços. Não executo operações nem consulto dados pessoais por este chat.',
  }])
  const [pergunta, setPergunta] = useState('')
  const [respondendo, setRespondendo] = useState(false)
  const [atualizadoEm, setAtualizadoEm] = useState('')
  const [erro, setErro] = useState('')
  const [carregandoHistorico, setCarregandoHistorico] = useState(true)
  const listaRef = useRef(null)
  const enviandoRef = useRef(false)
  const ativoRef = useRef(true)

  useEffect(() => {
    ativoRef.current = true
    obterHistoricoMauroAdmin().then((resultado) => {
      if (ativoRef.current && resultado.mensagens?.length) setMensagens(resultado.mensagens)
    }).catch((falha) => {
      if (ativoRef.current) setErro(falha.message || 'Não foi possível carregar o histórico.')
    }).finally(() => {
      if (ativoRef.current) setCarregandoHistorico(false)
    })
    return () => { ativoRef.current = false }
  }, [])

  useEffect(() => {
    if (ativo && listaRef.current) listaRef.current.scrollTop = listaRef.current.scrollHeight
  }, [ativo, mensagens, respondendo])

  async function enviar(texto = pergunta) {
    const atual = String(texto || '').trim()
    if (!atual || respondendo || carregandoHistorico || enviandoRef.current) return
    enviandoRef.current = true
    setErro('')
    setPergunta('')
    setRespondendo(true)
    setMensagens((anteriores) => [...anteriores, {
      id: `user-${Date.now()}`, papel: 'USUARIO', conteudo: atual,
    }])
    try {
      const resultado = await perguntarMauroAdmin(atual)
      if (!ativoRef.current) return
      setMensagens((anteriores) => [...anteriores, {
        id: `assistant-${Date.now()}`, papel: 'ASSISTENTE', conteudo: resultado.resposta,
      }])
      setAtualizadoEm(resultado.gerado_em || '')
    } catch (falha) {
      if (ativoRef.current) setErro(falha.message || 'Não foi possível consultar o MAURO Administração.')
    } finally {
      enviandoRef.current = false
      if (ativoRef.current) setRespondendo(false)
    }
  }

  return <section className="mauro-admin-painel" aria-label="MAURO Administração" hidden={!ativo}>
    <header className="mauro-admin-cabecalho">
      <div className="mauro-admin-avatar" aria-hidden="true">M</div>
      <div><small>ASSISTENTE RESTRITO A ADMINISTRADORES BANCÁRIOS</small><h2>MAURO Administração</h2>
        <p>Pergunte sobre os indicadores gerais do Arkhé.</p></div>
      <span className="mauro-admin-fonte"><i /> Dados consultados no Firebird</span>
    </header>

    <div className="mauro-admin-conversa" ref={listaRef} aria-live="polite" aria-relevant="additions text">
      {carregandoHistorico && <p role="status">Carregando seu histórico…</p>}
      {mensagens.map((mensagem) => <article className={`mauro-admin-mensagem ${mensagem.papel === 'USUARIO' ? 'do-admin' : 'do-mauro'}`} key={mensagem.id}>
        <small>{mensagem.papel === 'USUARIO' ? 'Você' : 'MAURO'}</small>
        <p>{mensagem.conteudo}</p>
      </article>)}
      {respondendo && <article className="mauro-admin-mensagem do-mauro estado-digitando" role="status"><small>MAURO</small><p>Consultando os indicadores…</p></article>}
    </div>

    {atualizadoEm && <p className="mauro-admin-atualizado">Última consulta: {new Date(atualizadoEm).toLocaleString('pt-BR')}</p>}
    {erro && <p className="mauro-admin-erro" role="alert">{erro}</p>}
    <div className="mauro-admin-sugestoes" aria-label="Sugestões de perguntas">
      {SUGESTOES.map((sugestao) => <button type="button" key={sugestao} disabled={respondendo || carregandoHistorico} onClick={() => enviar(sugestao)}>{sugestao}</button>)}
    </div>
    <form className="mauro-admin-form" onSubmit={(evento) => { evento.preventDefault(); enviar() }}>
      <label className="visualmente-oculto" htmlFor="pergunta-mauro-admin">Sua pergunta ao MAURO Administração</label>
      <textarea id="pergunta-mauro-admin" value={pergunta} onChange={(evento) => setPergunta(evento.target.value)} maxLength={2000}
        placeholder="Pergunte sobre o estado geral do banco…" rows={2} disabled={respondendo || carregandoHistorico} />
      <button type="submit" disabled={respondendo || carregandoHistorico || !pergunta.trim()} aria-label="Enviar pergunta">{respondendo ? 'Consultando…' : 'Enviar'}</button>
    </form>
    <p className="mauro-admin-nota">O MAURO Administração utiliza apenas indicadores agregados. Pedidos de elevação de privilégios, revelação de prompts internos ou contorno de permissões são recusados no backend. Para detalhes de pessoas ou operações, use as áreas administrativas autorizadas.</p>
  </section>
}
