import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CabecalhoDashboard from '../../components/Dashboard/CabecalhoDashboard.jsx'
import Icone from '../../components/Dashboard/Icone.jsx'
import ModalPerfil from '../../components/Dashboard/ModalPerfil.jsx'
import NavegacaoMobile from '../../components/Dashboard/NavegacaoMobile.jsx'
import { useMovimentacoes } from '../../hooks/useMovimentacoes.js'
import { useSessao } from '../../hooks/useSessao.js'
import { encerrarSessao } from '../../services/authService.js'
import '../Dashboard/Dashboard.css'
import './Extrato.css'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const formatarData = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' })

export default function Extrato() {
  const navigate = useNavigate()
  const { perfil, atualizarPerfil, limparSessao } = useSessao()
  const dados = useMovimentacoes()
  const [filtro, setFiltro] = useState('todas')
  const [saindo, setSaindo] = useState(false)
  const [erroSessao, setErroSessao] = useState('')
  const [perfilAberto, setPerfilAberto] = useState(false)
  const lista = filtro === 'todas' ? dados.ordenadas : dados.ordenadas.filter((item) => item.tipo === filtro)

  async function sair() {
    if (saindo) return
    setSaindo(true)
    try {
      await encerrarSessao()
      limparSessao()
      navigate('/login', { replace: true })
    } catch (erro) {
      setErroSessao(erro.message || 'Não foi possível sair da conta.')
    } finally {
      setSaindo(false)
    }
  }

  return (
    <div className="pagina-dashboard pagina-extrato">
      <CabecalhoDashboard usuario={perfil} secao="extrato" abrirPerfil={() => setPerfilAberto(true)} sair={sair} />
      <main className="conteudo-dashboard-largo corpo-extrato">
        {erroSessao && <p className="mensagem-sessao-dashboard" role="alert">{erroSessao}</p>}
        <header className="cabecalho-extrato">
          <div><p>CONTA</p><h1>Seu extrato</h1><span>Todas as movimentações da conta atual.</span></div>
          <button type="button" onClick={dados.carregar} disabled={dados.carregando}>Atualizar</button>
        </header>
        <section className="resumo-extrato">
          <div><small>Saldo atual</small><strong>{moeda.format(dados.saldo)}</strong></div>
          <div><small>Entradas no mês</small><strong className="entrada">+ {moeda.format(dados.entradas)}</strong></div>
          <div><small>Saídas no mês</small><strong>- {moeda.format(dados.saidas)}</strong></div>
        </section>
        <section className="painel-extrato">
          <header><h2>Movimentações</h2><div className="filtros-extrato">
            {[['todas', 'Todas'], ['entrada', 'Entradas'], ['saida', 'Saídas']].map(([valor, rotulo]) => <button className={filtro === valor ? 'ativo' : ''} type="button" key={valor} onClick={() => setFiltro(valor)}>{rotulo}</button>)}
          </div></header>
          {dados.carregando && <p className="estado-extrato">Buscando movimentações...</p>}
          {!dados.carregando && dados.erro && <p className="estado-extrato erro" role="alert">{dados.erro}</p>}
          {!dados.carregando && !dados.erro && lista.length === 0 && <p className="estado-extrato">Nenhuma movimentação encontrada.</p>}
          {!dados.carregando && !dados.erro && <div className="lista-extrato">{lista.map((item) => {
            const entrada = item.tipo === 'entrada'
            const data = new Date(item.data_movimentacao)
            const detalhe = Number.isNaN(data.getTime()) ? 'Data não informada' : formatarData.format(data)
            return <article key={item.id_movimentacao}><span><Icone nome="pix" /></span><div><strong>{entrada ? 'Pix recebido' : 'Pix enviado'}</strong><small>{detalhe}</small></div><b className={entrada ? 'entrada' : ''}>{entrada ? '+' : '-'} {moeda.format(Number(item.valor) || 0)}</b></article>
          })}</div>}
        </section>
      </main>
      <NavegacaoMobile secao="extrato" tipoConta={perfil.tipoConta} />
      {perfilAberto && <ModalPerfil usuario={perfil} fechar={() => setPerfilAberto(false)} aoAtualizar={atualizarPerfil} />}
    </div>
  )
}
