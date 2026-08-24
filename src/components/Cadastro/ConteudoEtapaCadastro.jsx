import ReconhecimentoFacial from '../ReconhecimentoFacial/ReconhecimentoFacial.jsx'
import EtapaAcesso from './EtapaAcesso.jsx'
import EtapaContato from './EtapaContato.jsx'
import EtapaDados, { EtapaResponsavel } from './EtapaDados.jsx'
import EtapaEndereco from './EtapaEndereco.jsx'
import RevisaoCadastro from './RevisaoCadastro.jsx'

export default function ConteudoEtapaCadastro({ cadastro }) {
  const { empresarial, etapaAtual, etapaRevisao, etapaFacial, dadosPF, dadosPJ, dadosAtuais, dadosValidacaoSenha, alterarDados, erroEmailCadastro, verificarEmailDisponivel, consultandoCep, mensagemCep, mostrarSenha, setMostrarSenha, setEtapaAtual, facialConcluido, enviando, mensagemErro, sessaoFacial, salvarCadastro, concluirCadastroFacial, setMensagemErro } = cadastro
  if (etapaAtual === 0) return <EtapaDados empresarial={empresarial} dadosPF={dadosPF} dadosPJ={dadosPJ} alterar={alterarDados} />
  if (empresarial && etapaAtual === 1) return <EtapaResponsavel dados={dadosPJ} alterar={alterarDados} />
  if (etapaAtual === (empresarial ? 2 : 1)) return <EtapaContato empresarial={empresarial} dados={dadosAtuais} alterar={alterarDados} erroEmail={erroEmailCadastro} verificarEmail={verificarEmailDisponivel} />
  if (etapaAtual === (empresarial ? 3 : 2)) return <EtapaEndereco dados={dadosAtuais} alterar={alterarDados} consultando={consultandoCep} mensagem={mensagemCep} />
  if (etapaAtual === (empresarial ? 4 : 3)) return <EtapaAcesso empresarial={empresarial} dadosPF={dadosPF} dadosPJ={dadosPJ} dadosAtuais={dadosAtuais} dadosValidacao={dadosValidacaoSenha} alterar={alterarDados} mostrarSenha={mostrarSenha} alternarSenha={() => setMostrarSenha(!mostrarSenha)} />
  if (etapaAtual === etapaRevisao) return <RevisaoCadastro empresarial={empresarial} dadosPF={dadosPF} dadosPJ={dadosPJ} dadosAtuais={dadosAtuais} editarEtapa={setEtapaAtual} />
  if (etapaAtual === etapaFacial && facialConcluido) return <div className="resultado-facial-cadastro"><h3>Reconhecimento facial concluído</h3><p>{enviando ? 'Salvando seu cadastro...' : mensagemErro || 'Finalizando seu cadastro...'}</p>{mensagemErro && <button className="botao botao-principal" type="button" disabled={enviando} onClick={salvarCadastro}>Tentar salvar novamente</button>}</div>
  if (etapaAtual === etapaFacial && sessaoFacial) return <ReconhecimentoFacial modo="cadastro" sessao={sessaoFacial} aoConcluir={concluirCadastroFacial} aoErro={setMensagemErro} />
  return null
}
