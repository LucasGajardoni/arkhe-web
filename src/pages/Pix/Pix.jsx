import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CabecalhoDashboard from '../../components/Dashboard/CabecalhoDashboard.jsx'
import Icone from '../../components/Dashboard/Icone.jsx'
import ModalPerfil from '../../components/Dashboard/ModalPerfil.jsx'
import NavegacaoMobile from '../../components/Dashboard/NavegacaoMobile.jsx'
import ModalChavePix from '../../components/Pix/ModalChavePix.jsx'
import ModalExcluirChave from '../../components/Pix/ModalExcluirChave.jsx'
import { usePix } from '../../hooks/usePix.js'
import { formatarChavePix } from '../../utils/formatadores.js'
import '../Dashboard/Dashboard.css'
import './Pix.css'

const rotulos = { email: 'E-mail', telefone: 'Telefone', cpf: 'CPF', cnpj: 'CNPJ', aleatoria: 'Chave aleatória' }
function lerUsuario() { try { return JSON.parse(localStorage.getItem('usuario')) } catch { return null } }

export default function Pix() {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState(lerUsuario)
  const pix = usePix(usuario)
  const [perfilAberto, setPerfilAberto] = useState(false)
  const [avisoPagamento, setAvisoPagamento] = useState(false)
  const [chaveCopiada, setChaveCopiada] = useState('')
  const secaoChaves = useRef(null)

  useEffect(() => { if (!usuario) navigate('/login', { replace: true }) }, [navigate, usuario])
  if (!usuario) return null

  function sair() { localStorage.removeItem('usuario'); localStorage.removeItem('token'); navigate('/login', { replace: true }) }
  function abrirCadastro() { pix.setErro(''); pix.setMensagem(''); pix.alterarTipo(pix.tiposDisponiveis[0] || 'aleatoria'); pix.setModalCadastro(true) }
  function fecharCadastro() { pix.setModalCadastro(false); pix.setErro('') }
  function verChaves() { secaoChaves.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  async function copiar(chave) {
    try {
      await navigator.clipboard.writeText(chave.valor)
      setChaveCopiada(`${chave.id_chave_pix}-${chave.tipo}`)
      setTimeout(() => setChaveCopiada(''), 1800)
    } catch { pix.setErro('Não foi possível copiar a chave.') }
  }

  return <div className="pagina-dashboard pagina-pix">
    <CabecalhoDashboard usuario={usuario} secao="pix" abrirPerfil={() => setPerfilAberto(true)} sair={sair} />
    <main>
      <section className="cabecalho-pix"><div className="orbita-dashboard orbita-um" /><div className="conteudo-dashboard-largo cabecalho-pix-conteudo"><div><p>ÁREA PIX</p><h1>Seu Pix, simples<br />e sempre à mão.</h1><span>Cadastre suas chaves e receba com praticidade.</span></div><div className="selo-pix"><Icone nome="pix" tamanho={38} /><span>Transferências instantâneas</span><strong>24 horas por dia</strong></div></div></section>

      <div className="conteudo-dashboard-largo corpo-pix">
        <section className="acoes-pix" aria-label="Ações Pix">
          <button type="button" onClick={() => setAvisoPagamento(true)}><span><Icone nome="setaCima" /></span><div><strong>Pagar</strong><small>Envie um Pix</small></div><Icone nome="seta" tamanho={17} /></button>
          <button type="button" onClick={verChaves}><span><Icone nome="setaBaixo" /></span><div><strong>Receber</strong><small>Use uma das suas chaves</small></div><Icone nome="seta" tamanho={17} /></button>
          <button type="button" onClick={abrirCadastro}><span><Icone nome="mais" /></span><div><strong>Nova chave</strong><small>Cadastre com segurança</small></div><Icone nome="seta" tamanho={17} /></button>
        </section>

        {avisoPagamento && <div className="aviso-pix" role="status"><span>i</span><p><strong>Pagamento Pix em preparação</strong>Essa função será liberada quando a rota de pagamentos estiver disponível no sistema.</p><button type="button" onClick={() => setAvisoPagamento(false)}>×</button></div>}
        {pix.mensagem && <div className="mensagem-pix sucesso" role="status">{pix.mensagem}<button type="button" onClick={() => pix.setMensagem('')}>×</button></div>}
        {pix.erro && !pix.modalCadastro && !pix.chaveExclusao && <div className="mensagem-pix erro" role="alert">{pix.erro}<button type="button" onClick={() => pix.setErro('')}>×</button></div>}

        <section className="painel-chaves-pix" ref={secaoChaves}>
          <header><div><p>RECEBER</p><h2>Minhas chaves Pix</h2><span>Copie uma chave para compartilhar ou gerencie seus cadastros.</span></div><button className="botao botao-principal" type="button" onClick={abrirCadastro}><Icone nome="mais" tamanho={17} /> Nova chave</button></header>
          {pix.carregando ? <div className="estado-chaves-pix"><span className="carregando-pix" /><strong>Buscando suas chaves...</strong></div>
            : pix.chaves.length === 0 ? <div className="estado-chaves-pix"><span><Icone nome="pix" tamanho={29} /></span><strong>Você ainda não possui chaves Pix</strong><p>Cadastre sua primeira chave para começar a receber.</p><button className="botao botao-principal" type="button" onClick={abrirCadastro}>Cadastrar chave</button></div>
              : <div className="lista-chaves-pix">{pix.chaves.map((chave) => { const identificador = `${chave.id_chave_pix}-${chave.tipo}`; return <article key={identificador}><span><Icone nome="chave" /></span><div><small>{rotulos[chave.tipo] || chave.tipo}</small><strong>{formatarChavePix(chave.tipo, chave.valor)}</strong></div><button className="copiar-chave-pix" type="button" onClick={() => copiar(chave)}>{chaveCopiada === identificador ? 'Copiada!' : 'Copiar'}</button><button className="excluir-chave-pix" type="button" onClick={() => { pix.setErro(''); pix.setChaveExclusao(chave) }} aria-label={`Excluir chave ${rotulos[chave.tipo]}`}>×</button></article> })}</div>}
        </section>
      </div>
    </main>
    <NavegacaoMobile secao="pix" />
    {perfilAberto && <ModalPerfil usuario={usuario} fechar={() => setPerfilAberto(false)} aoAtualizar={setUsuario} />}
    {pix.modalCadastro && <ModalChavePix pix={pix} fechar={fecharCadastro} />}
    {pix.chaveExclusao && <ModalExcluirChave chave={pix.chaveExclusao} processando={pix.processando} erro={pix.erro} fechar={() => { pix.setChaveExclusao(null); pix.setErro('') }} excluir={pix.excluir} />}
  </div>
}
