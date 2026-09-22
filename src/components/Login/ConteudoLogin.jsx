import CredenciaisLogin from './CredenciaisLogin.jsx'
import RecuperacaoPin from './RecuperacaoPin.jsx'
import ReconhecimentoLogin from './ReconhecimentoLogin.jsx'

export default function ConteudoLogin({ login }) {
  if (login.recuperandoPin) {
    return (
      <RecuperacaoPin
        cpf={login.credenciais.cpf}
        aoCancelar={login.fecharRecuperacaoPin}
        aoConcluir={login.concluirRecuperacaoPin}
      />
    )
  }

  if (login.etapa === 'credenciais') return <CredenciaisLogin login={login} />

  if (login.etapa === 'facial') {
    return (
      <ReconhecimentoLogin
        modo={login.modoFacial}
        mensagem={login.mensagemFacial}
        sessao={login.sessaoFacial}
        concluir={login.concluirReconhecimentoFacial}
        informarErro={login.setMensagemErro}
        mensagemErro={login.mensagemErro}
        processando={login.processando}
      />
    )
  }

  return null
}
