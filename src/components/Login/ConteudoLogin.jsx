import AcessoFinalizado from './AcessoFinalizado.jsx'
import CredenciaisLogin from './CredenciaisLogin.jsx'
import EscolhaTipoConta from './EscolhaTipoConta.jsx'
import ReconhecimentoLogin from './ReconhecimentoLogin.jsx'
import RecuperacaoSenha from './RecuperacaoSenha.jsx'

export default function ConteudoLogin({ login }) {
  if (login.recuperandoSenha) return <RecuperacaoSenha login={login} />
  if (login.etapa === 1) return <CredenciaisLogin login={login} />
  if (login.etapa === login.etapaFacial) return <ReconhecimentoLogin sessao={login.sessaoFacial} concluir={login.concluirReconhecimentoFacial} informarErro={login.setMensagemErro} mensagemErro={login.mensagemErro} processando={login.processando} />
  if (login.etapa === login.etapaFinal) return <AcessoFinalizado login={login} />
  return <EscolhaTipoConta tipoConta={login.tipoConta} escolher={login.setTipoConta} continuar={() => login.setEtapa(1)} />
}
