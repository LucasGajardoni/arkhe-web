import { Navigate, useLocation } from 'react-router-dom'
import CadastroHeader from '../../components/CadastroHeader/CadastroHeader.jsx'
import ConteudoEtapaCadastro from '../../components/Cadastro/ConteudoEtapaCadastro.jsx'
import IndicadorEtapas from '../../components/IndicadorEtapas/IndicadorEtapas.jsx'
import { useCadastro } from '../../hooks/useCadastro.js'
import './Cadastro.css'

export default function Cadastro({ tipoConta }) {
  const location = useLocation()
  const cadastro = useCadastro(tipoConta, location.state || {})
  const {
    irParaInicio,
    clienteExistente,
    fluxoVerificado,
    etapaAtual,
    etapaId,
    etapas,
    titulos,
    etapaRevisao,
    mensagemErro,
    sessaoFacial,
    modoFacial,
    mensagemFacial,
    enviando,
    validarEtapa,
    avancar,
    voltar,
    enviarCadastro,
  } = cadastro

  if (!fluxoVerificado) return <Navigate to="/cadastro" replace />

  let descricaoEtapa = 'Confira os dados e continue quando estiver pronto.'
  let tituloEtapa = titulos[etapaAtual]

  if (etapaId === 'facial' && modoFacial === 'login') {
    tituloEtapa = 'Confirme sua identidade'
  }
  if (etapaAtual === 0 && clienteExistente) {
    descricaoEtapa = 'Seu cadastro já foi confirmado. Informe apenas os dados da nova conta.'
  } else if (etapaAtual === 0) {
    descricaoEtapa = 'Preencha as informações para iniciar a abertura da conta.'
  }

  let acoesFormulario = null
  if (!sessaoFacial || etapaAtual === etapaRevisao) {
    let botaoPrincipal

    if (etapaAtual === etapaRevisao) {
      let textoBotao = 'Enviar cadastro'
      if (clienteExistente) textoBotao = 'Abrir nova conta'
      if (enviando) textoBotao = 'Enviando...'
      if (enviando && clienteExistente) textoBotao = 'Abrindo conta...'

      botaoPrincipal = (
        <button
          className="botao botao-principal"
          type="button"
          disabled={enviando}
          onClick={enviarCadastro}
        >
          {textoBotao}
        </button>
      )
    } else {
      botaoPrincipal = (
        <button
          className="botao botao-principal"
          type="button"
          disabled={!validarEtapa()}
          onClick={avancar}
        >
          Continuar
        </button>
      )
    }

    acoesFormulario = (
      <div className="acoes-formulario">
        <button className="botao botao-secundario" type="button" onClick={voltar}>
          Voltar
        </button>
        {botaoPrincipal}
      </div>
    )
  }

  return (
    <div className="pagina-cadastro">
      <CadastroHeader voltarParaHome={irParaInicio} />
      <main className="conteudo area-cadastro">
        <IndicadorEtapas etapas={etapas} etapaAtual={etapaAtual} />
        <div className="layout-cadastro">
          <section className="cartao-formulario">
            <div className="titulo-formulario">
              <p>ETAPA {etapaAtual + 1}</p>
              <h1>{tituloEtapa}</h1>
              <span>{descricaoEtapa}</span>
            </div>
            <ConteudoEtapaCadastro cadastro={cadastro} />
            {mensagemFacial && enviando && etapaAtual === etapaRevisao && (
              <p className="aviso-simulacao" role="status">{mensagemFacial}</p>
            )}
            {mensagemErro && !sessaoFacial && <p className="erro-geral" role="alert">{mensagemErro}</p>}
            {acoesFormulario}
          </section>
          <aside className="apoio-cadastro">
            <span>{String(etapaAtual + 1).padStart(2, '0')}</span>
            <h2>{etapas[etapaAtual]}</h2>
            <p>Seus dados permanecem apenas nesta simulação enquanto você navega pelo cadastro.</p>
            <hr />
            <strong>Ambiente acadêmico</strong>
            <p>Não atualize a página durante o preenchimento, pois os dados não são armazenados.</p>
          </aside>
        </div>
      </main>
    </div>
  )
}
