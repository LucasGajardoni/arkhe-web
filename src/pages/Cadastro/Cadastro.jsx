import CadastroHeader from '../../components/CadastroHeader/CadastroHeader.jsx'
import ConteudoEtapaCadastro from '../../components/Cadastro/ConteudoEtapaCadastro.jsx'
import IndicadorEtapas from '../../components/IndicadorEtapas/IndicadorEtapas.jsx'
import { useCadastro } from '../../hooks/useCadastro.js'
import './Cadastro.css'

export default function Cadastro({ tipoConta }) {
  const cadastro = useCadastro(tipoConta)
  const { navigate, etapaAtual, etapas, titulos, etapaRevisao, mensagemErro, sessaoFacial, enviando, validarEtapa, avancar, voltar, enviarCadastro } = cadastro

  return (
    <div className="pagina-cadastro">
      <CadastroHeader voltarParaHome={() => navigate('/')} />
      <main className="conteudo area-cadastro">
        <IndicadorEtapas etapas={etapas} etapaAtual={etapaAtual} />
        <div className="layout-cadastro">
          <section className="cartao-formulario">
            <div className="titulo-formulario">
              <p>ETAPA {etapaAtual + 1}</p>
              <h1>{titulos[etapaAtual]}</h1>
              <span>{etapaAtual === 0 ? 'Preencha as informações para iniciar a abertura da conta.' : 'Confira os dados e continue quando estiver pronto.'}</span>
            </div>
            <ConteudoEtapaCadastro cadastro={cadastro} />
            {mensagemErro && !sessaoFacial && <p className="erro-geral">{mensagemErro}</p>}
            {sessaoFacial && etapaAtual !== etapaRevisao ? null : <div className="acoes-formulario">
              <button className="botao botao-secundario" type="button" onClick={voltar}>Voltar</button>
              {etapaAtual === etapaRevisao
                ? <button className="botao botao-principal" type="button" disabled={enviando} onClick={enviarCadastro}>{enviando ? 'Enviando...' : 'Enviar cadastro'}</button>
                : <button className="botao botao-principal" type="button" disabled={!validarEtapa()} onClick={avancar}>Continuar</button>}
            </div>}
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
