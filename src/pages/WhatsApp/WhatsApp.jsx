import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CabecalhoDashboard from '../../components/Dashboard/CabecalhoDashboard.jsx'
import NavegacaoMobile from '../../components/Dashboard/NavegacaoMobile.jsx'
import ModalPerfil from '../../components/Dashboard/ModalPerfil.jsx'
import { useSessao } from '../../hooks/useSessao.js'
import { encerrarSessao } from '../../services/authService.js'
import { atualizarWhatsApp, consultarWhatsApp, gerarCodigoWhatsApp } from '../../services/whatsappService.js'
import './WhatsApp.css'

export default function WhatsApp() {
  const navigate = useNavigate()
  const { perfil, atualizarPerfil, limparSessao } = useSessao()
  const [config, setConfig] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [gerando, setGerando] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [perfilAberto, setPerfilAberto] = useState(false)

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setCodigo('')
    setErro('')
    consultarWhatsApp().then((dados) => {
      if (ativo) setConfig(dados)
    }).catch((falha) => {
      if (ativo) setErro(falha.message)
    }).finally(() => {
      if (ativo) setCarregando(false)
    })
    return () => { ativo = false }
  }, [perfil.idConta])

  async function alterarNivel(nivel) {
    setSalvando(true)
    setErro('')
    setSucesso('')
    setCodigo('')
    try {
      const dados = await atualizarWhatsApp(nivel)
      setConfig(dados)
      setSucesso(nivel === 1 ? 'Consultas pelo WhatsApp autorizadas nesta conta.' : 'Acesso pelo WhatsApp desativado nesta conta.')
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setSalvando(false)
    }
  }

  async function gerarCodigo() {
    setGerando(true)
    setErro('')
    setSucesso('')
    setCodigo('')
    try {
      const dados = await gerarCodigoWhatsApp()
      setCodigo(dados.codigo)
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setGerando(false)
    }
  }

  async function sair() {
    setErro('')
    try {
      await encerrarSessao()
      limparSessao()
      navigate('/login', { replace: true })
    } catch (falha) {
      setErro(falha.message || 'Não foi possível sair da conta.')
    }
  }

  const permissao = Boolean(config?.capacidades?.financeiro || config?.capacidades?.rh)
  const pessoa = config?.vinculo === 'proprietario' ? 'Proprietário' : config?.vinculo === 'titular' ? 'Titular' : config?.cargo || 'Usuário autorizado'

  return (
    <div className="pagina-dashboard pagina-whatsapp">
      <CabecalhoDashboard usuario={perfil} secao="whatsapp" abrirPerfil={() => setPerfilAberto(true)} sair={sair} />
      <main>
        <section className="hero-whatsapp">
          <div className="conteudo-dashboard-largo">
            <p>CANAIS ARKHÉ</p>
            <h1>WhatsApp</h1>
            <span>Controle o acesso às informações da sua conta pelo atendimento Arkhé.</span>
          </div>
        </section>
        <div className="conteudo-dashboard-largo conteudo-whatsapp">
          {erro && <p role="alert" className="aviso-whatsapp erro">{erro}</p>}
          {sucesso && <p role="status" className="aviso-whatsapp sucesso">{sucesso}</p>}
          {carregando && <p className="estado-whatsapp">Carregando preferências desta conta...</p>}
          {!carregando && config && (
            <>
              <section className="cartao-whatsapp">
                <div className="cabecalho-whatsapp">
                  <div>
                    <small>{config.tipo_conta === 'PJ' ? 'CONTA EMPRESARIAL' : 'CONTA PESSOAL'}</small>
                    <h2>Atendimento vinculado à conta {config.tipo_conta}</h2>
                    <p>Perfil: {pessoa} · Telefone cadastrado: +{config.telefone}</p>
                  </div>
                  <span className={config.habilitado ? 'situacao-whatsapp ativo' : 'situacao-whatsapp'}>
                    {config.habilitado ? 'Autorizado' : 'Desativado'}
                  </span>
                </div>
                <p>Esta autorização é individual para a pessoa e a conta selecionadas. Para configurar outra conta, use "Trocar conta" no menu superior.</p>
                <div className="niveis-whatsapp">
                  <article className="nivel-whatsapp permitido">
                    <small>NÍVEL 1</small>
                    <h3>Consultas</h3>
                    <p>Consulta de dados e informações autorizadas, sem movimentar dinheiro.</p>
                    <span>Disponível para ativação</span>
                  </article>
                  <article className="nivel-whatsapp bloqueado">
                    <small>NÍVEL 2</small>
                    <h3>Solicitações</h3>
                    <p>Operações que exigem autorização adicional. Ainda não liberadas.</p>
                    <span>Indisponível</span>
                  </article>
                  <article className="nivel-whatsapp bloqueado">
                    <small>NÍVEL 3</small>
                    <h3>Movimentações</h3>
                    <p>Transações financeiras sujeitas a autenticação reforçada. Ainda não liberadas.</p>
                    <span>Indisponível</span>
                  </article>
                </div>
                <div className="permissoes-whatsapp">
                  <h3>Permissões do perfil nesta conta</h3>
                  <p>{config.capacidades.financeiro ? 'Consultas financeiras: permitidas.' : 'Consultas financeiras: não permitidas para este cargo.'}</p>
                  <p>{config.tipo_conta === 'PJ' ? config.capacidades.rh ? 'Funcionários e folha: consultas permitidas.' : 'Funcionários e folha: restritas ao proprietário ou RH.' : 'Funcionários e folha: não se aplicam à conta PF.'}</p>
                  <p>Seu acesso continua sujeito às permissões e aos vínculos ativos no banco.</p>
                </div>
                <div className="acoes-whatsapp">
                  {config.habilitado ? (
                    <button type="button" className="botao botao-secundario" disabled={salvando} onClick={() => alterarNivel(0)}>
                      {salvando ? 'Salvando...' : 'Desativar WhatsApp'}
                    </button>
                  ) : (
                    <button type="button" className="botao botao-principal" disabled={salvando || !permissao} onClick={() => alterarNivel(1)}>
                      {salvando ? 'Salvando...' : 'Ativar consultas (nível 1)'}
                    </button>
                  )}
                </div>
              </section>

              <section className="cartao-whatsapp">
                <small>AUTENTICAÇÃO SEGURA</small>
                <h2>Acessar a conta pelo WhatsApp</h2>
                <p>Com o nível 1 ativado, gere um código aqui e envie-o em uma conversa privada com o número oficial do Arkhé. Ele vale por 10 minutos, apenas uma vez. Após a confirmação, a sessão de consulta dura até 30 minutos.</p>
                <div className="acoes-whatsapp">
                  <button type="button" className="botao botao-principal" disabled={!config.habilitado || gerando || !permissao} onClick={gerarCodigo}>
                    {gerando ? 'Gerando...' : 'Gerar código temporário'}
                  </button>
                </div>
                {codigo && (
                  <div className="codigo-whatsapp" role="status" aria-live="polite">
                    <span>SEU CÓDIGO TEMPORÁRIO</span>
                    <strong>{codigo}</strong>
                    <p>Não compartilhe este código com terceiros. Não envie senhas ou PINs pelo WhatsApp.</p>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
      <NavegacaoMobile secao="whatsapp" tipoConta={perfil.tipoConta} />
      {perfilAberto && <ModalPerfil usuario={perfil} fechar={() => setPerfilAberto(false)} aoAtualizar={atualizarPerfil} />}
    </div>
  )
}
