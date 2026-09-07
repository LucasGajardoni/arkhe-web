import CredenciaisLogin from './CredenciaisLogin.jsx'
import EscolhaTipoConta from './EscolhaTipoConta.jsx'
import ReconhecimentoLogin from './ReconhecimentoLogin.jsx'

export default function ConteudoLogin({ login }) {
  if (login.etapa === 1) return <CredenciaisLogin login={login} />

  if (login.etapa === 2) {
    return (
      <ReconhecimentoLogin
        sessao={login.sessaoFacial}
        concluir={login.concluirReconhecimentoFacial}
        informarErro={login.setMensagemErro}
        mensagemErro={login.mensagemErro}
        processando={login.processando}
      />
    )
  }

  return (
    <EscolhaTipoConta
      abrindoOutraConta={login.abrindoOutraConta}
      tipoConta={login.tipoConta}
      escolher={login.escolherTipoConta}
      continuar={() => login.setEtapa(1)}
    />
  )
}
