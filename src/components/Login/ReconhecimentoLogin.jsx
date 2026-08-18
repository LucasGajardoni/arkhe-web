import ReconhecimentoFacial from '../ReconhecimentoFacial/ReconhecimentoFacial.jsx'

export default function ReconhecimentoLogin({ sessao, concluir, informarErro, mensagemErro, processando }) {
  return <>
    <div className="cabecalho-login"><p className="rotulo-secao">RECONHECIMENTO FACIAL</p><h1>Confirme sua identidade</h1><p>Olhe para a câmera e siga as orientações do scanner.</p></div>
    {sessao && <ReconhecimentoFacial modo="login" sessao={sessao} aoConcluir={concluir} aoErro={informarErro} />}
    {mensagemErro && !sessao && <p className="mensagem-login">{mensagemErro}</p>}
    {processando && <p className="mensagem-login">Criando sua sessão...</p>}
  </>
}
