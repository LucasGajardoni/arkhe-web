import ReconhecimentoFacial from '../ReconhecimentoFacial/ReconhecimentoFacial.jsx'

export default function ReconhecimentoLogin({ modo, mensagem, sessao, concluir, informarErro, mensagemErro, processando }) {
  return (
    <>
      <div className="cabecalho-login">
        <p className="rotulo-secao">RECONHECIMENTO FACIAL</p>
        <h1>Confirme sua identidade</h1>
        <p>{mensagem}</p>
      </div>
      {sessao && (
        <ReconhecimentoFacial
          modo={modo}
          sessao={sessao}
          aoConcluir={concluir}
          aoErro={informarErro}
        />
      )}
      {mensagemErro && <p className="mensagem-login" role="alert">{mensagemErro}</p>}
      {processando && <p className="mensagem-login" role="status">Criando sua sessão...</p>}
    </>
  )
}
