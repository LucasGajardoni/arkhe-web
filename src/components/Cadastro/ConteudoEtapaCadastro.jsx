import ReconhecimentoFacial from '../ReconhecimentoFacial/ReconhecimentoFacial.jsx'
import EtapaAcesso from './EtapaAcesso.jsx'
import EtapaContato from './EtapaContato.jsx'
import EtapaDados, { EtapaResponsavel } from './EtapaDados.jsx'
import EtapaEndereco from './EtapaEndereco.jsx'
import RevisaoCadastro from './RevisaoCadastro.jsx'

export default function ConteudoEtapaCadastro({ cadastro }) {
  const {
    empresarial,
    clienteExistente,
    cpfVerificado,
    etapaAtual,
    etapaId,
    etapaFacial,
    dadosPF,
    dadosPJ,
    dadosAtuais,
    alterarDados,
    erroEmailCadastro,
    verificarEmailDisponivel,
    consultandoCep,
    mensagemCep,
    pinSeguroCadastro,
    mostrarPin,
    setMostrarPin,
    editarEtapa,
    facialConcluido,
    enviando,
    mensagemErro,
    sessaoFacial,
    modoFacial,
    mensagemFacial,
    salvarNovoUsuario,
    concluirCadastroFacial,
    setMensagemErro,
  } = cadastro

  if (etapaId === 'empresa') {
    return <EtapaDados empresarial dadosPF={dadosPF} dadosPJ={dadosPJ} alterar={alterarDados} />
  }

  if (etapaId === 'pessoais') {
    return (
      <EtapaDados
        empresarial={false}
        dadosPF={dadosPF}
        dadosPJ={dadosPJ}
        alterar={alterarDados}
        cpfSomenteLeitura={Boolean(cpfVerificado)}
      />
    )
  }

  if (etapaId === 'responsavel') {
    return (
      <EtapaResponsavel
        dados={dadosPJ}
        alterar={alterarDados}
        cpfSomenteLeitura={Boolean(cpfVerificado)}
      />
    )
  }

  if (etapaId === 'contato') {
    return (
      <EtapaContato
        empresarial={empresarial}
        dados={dadosAtuais}
        alterar={alterarDados}
        erroEmail={erroEmailCadastro}
        verificarEmail={verificarEmailDisponivel}
      />
    )
  }

  if (etapaId === 'endereco') {
    return (
      <EtapaEndereco
        dados={dadosAtuais}
        alterar={alterarDados}
        consultando={consultandoCep}
        mensagem={mensagemCep}
      />
    )
  }

  if (etapaId === 'acesso') {
    return (
      <EtapaAcesso
        empresarial={empresarial}
        clienteExistente={clienteExistente}
        dadosPF={dadosPF}
        dadosPJ={dadosPJ}
        dadosAtuais={dadosAtuais}
        pinSeguroCadastro={pinSeguroCadastro}
        alterar={alterarDados}
        mostrarPin={mostrarPin}
        alternarPin={() => setMostrarPin(!mostrarPin)}
      />
    )
  }

  if (etapaId === 'revisao') {
    return (
      <RevisaoCadastro
        empresarial={empresarial}
        clienteExistente={clienteExistente}
        dadosPF={dadosPF}
        dadosPJ={dadosPJ}
        dadosAtuais={dadosAtuais}
        editarEtapa={editarEtapa}
      />
    )
  }

  if (etapaAtual === etapaFacial && facialConcluido) {
    let textoStatus = mensagemErro || 'Finalizando seu cadastro...'
    if (enviando) textoStatus = 'Salvando seu cadastro...'

    return (
      <div className="resultado-facial-cadastro">
        <h3>Reconhecimento facial concluído</h3>
        <p>{textoStatus}</p>
        {mensagemErro && (
          <button
            className="botao botao-principal"
            type="button"
            disabled={enviando}
            onClick={salvarNovoUsuario}
          >
            Tentar salvar novamente
          </button>
        )}
      </div>
    )
  }

  if (etapaAtual === etapaFacial && sessaoFacial) {
    return (
      <>
        <p className="aviso-simulacao" role="status">{mensagemFacial}</p>
        <ReconhecimentoFacial
          modo={modoFacial}
          sessao={sessaoFacial}
          aoConcluir={concluirCadastroFacial}
          aoErro={setMensagemErro}
        />
      </>
    )
  }

  return null
}
