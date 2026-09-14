import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import CabecalhoDashboard from '../../components/Dashboard/CabecalhoDashboard.jsx'
import Icone from '../../components/Dashboard/Icone.jsx'
import ModalPerfil from '../../components/Dashboard/ModalPerfil.jsx'
import NavegacaoMobile from '../../components/Dashboard/NavegacaoMobile.jsx'
import ModalNovaIntegracao from '../../components/Integracoes/ModalNovaIntegracao.jsx'
import { useSessao } from '../../hooks/useSessao.js'
import { encerrarSessao } from '../../services/authService.js'
import '../Dashboard/Dashboard.css'
import './Integracoes.css'

const exemplos = [
  ['ERP', 'Conecte a gestão financeira da empresa.'],
  ['Sistema de caixa', 'Consulte saldo e movimentações.'],
  ['Sistema de gestão', 'Acompanhe cobranças Pix.'],
  ['E-commerce', 'Crie cobranças Pix pelo servidor.'],
]

const recursos = [
  'Consultar dados da conta e saldo',
  'Consultar movimentações por período',
  'Criar cobranças Pix Arkhé',
  'Consultar o status das cobranças Pix',
]

export default function Integracoes() {
  const navigate = useNavigate()
  const { perfil, atualizarPerfil, limparSessao } = useSessao()
  const [modalAberto, setModalAberto] = useState(false)
  const [perfilAberto, setPerfilAberto] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const [erroSessao, setErroSessao] = useState('')

  if (perfil.tipoConta !== 'PJ') return <Navigate to="/dashboard" replace />

  async function sair() {
    if (saindo) return
    setSaindo(true)
    setErroSessao('')
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
    <div className="pagina-dashboard pagina-integracoes">
      <CabecalhoDashboard usuario={perfil} secao="integracoes" abrirPerfil={() => setPerfilAberto(true)} sair={sair} />

      <main>
        {erroSessao && <p className="mensagem-sessao-dashboard" role="alert">{erroSessao}</p>}

        <section className="hero-integracoes">
          <div className="orbita-dashboard orbita-um" />
          <div className="conteudo-dashboard-largo hero-integracoes-conteudo">
            <div>
              <p>CONTA EMPRESARIAL</p>
              <h1>Integrações e API</h1>
              <span>Conecte sistemas externos à sua conta Arkhé com credenciais próprias.</span>
            </div>
            <button className="botao botao-principal" type="button" onClick={() => setModalAberto(true)}>
              <Icone nome="mais" tamanho={18} /> Nova integração
            </button>
          </div>
        </section>

        <div className="conteudo-dashboard-largo corpo-integracoes">
          <section className="introducao-integracoes" aria-labelledby="titulo-conectar-sistemas">
            <div>
              <p>API ARKHÉ</p>
              <h2 id="titulo-conectar-sistemas">Conecte as ferramentas da sua empresa</h2>
              <span>Autorize sistemas a consultar informações da conta e criar cobranças Pix usando a API Arkhé.</span>
            </div>
            <button type="button" onClick={() => navigate('/desenvolvedores/api')}>
              Ver documentação da API <Icone nome="seta" tamanho={16} />
            </button>
          </section>

          <section className="exemplos-integracoes" aria-label="Exemplos de sistemas integrados">
            {exemplos.map(([nome, descricao]) => (
              <article key={nome}>
                <span><Icone nome="api" tamanho={21} /></span>
                <div><strong>{nome}</strong><small>{descricao}</small></div>
              </article>
            ))}
          </section>

          <div className="grade-integracoes">
            <section className="recursos-api-integracoes">
              <header><p>RECURSOS ATUAIS</p><h2>O que a integração pode fazer</h2></header>
              <ul>{recursos.map((recurso) => <li key={recurso}>{recurso}</li>)}</ul>
              <p className="nota-recursos-integracoes">As permissões são definidas pela API atual e não podem ser personalizadas nesta versão.</p>
            </section>

            <aside className="seguranca-integracoes">
              <span><Icone nome="chave" tamanho={26} /></span>
              <p>CLIENT SECRET</p>
              <h2>Guarde a credencial com segurança</h2>
              <span>O Client Secret aparece somente ao criar a integração. Ele não será armazenado pelo frontend nem poderá ser consultado novamente.</span>
              <button type="button" onClick={() => setModalAberto(true)}>Autorizar um sistema <Icone nome="seta" tamanho={15} /></button>
            </aside>
          </div>
        </div>
      </main>

      <NavegacaoMobile secao="integracoes" tipoConta={perfil.tipoConta} />
      {perfilAberto && <ModalPerfil usuario={perfil} fechar={() => setPerfilAberto(false)} aoAtualizar={atualizarPerfil} />}
      {modalAberto && <ModalNovaIntegracao fechar={() => setModalAberto(false)} />}
    </div>
  )
}
