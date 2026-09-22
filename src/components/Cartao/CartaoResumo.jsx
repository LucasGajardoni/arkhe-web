import { useState } from 'react'
import { useCartao } from '../../hooks/useCartao.js'
import CartaoVisual from './CartaoVisual.jsx'
import GraficoLimite from './GraficoLimite.jsx'
import ModalCartao from './ModalCartao.jsx'
import { formatarLimite, nomeNoCartao, numeroCartao } from './cartaoUtils.js'
import './Cartao.css'

export default function CartaoResumo({ usuario }) {
  // Também protege o bloco caso passe a ser usado fora do Outlet atual.
  return <ConteudoCartao key={usuario.idConta} usuario={usuario} />
}

function ConteudoCartao({ usuario }) {
  const dados = useCartao(usuario.idConta)
  const [aberto, setAberto] = useState(false)
  const { cartao, carregando, erro } = dados
  function abrir() { dados.limparErroGeracao(); setAberto(true) }
  const detalhes = <div className="cartao-resumo-detalhes">
    {cartao ? <dl className="cartao-resumo-limites"><div><dt>Limite disponível</dt><dd>{formatarLimite(cartao.limite_disponivel)}</dd></div><div><dt>Limite utilizado</dt><dd>{formatarLimite(cartao.limite_utilizado)}</dd></div></dl>
      : <><h3>Seu próximo passo começa aqui.</h3><p>Você ainda não possui um cartão Arkhé. Tenha seu cartão vinculado à conta para usar nas compras do projeto.</p></>}
    <button type="button" className="botao botao-principal" onClick={abrir}>{cartao ? 'Gerenciar cartão' : 'Gerar meu cartão'} <span aria-hidden="true">→</span></button>
    <small>Vinculado à conta que você está operando.</small>
  </div>

  return <>
    <section className="bloco-dashboard cartao-resumo" aria-labelledby="titulo-cartao-resumo" aria-busy={carregando}>
      <div className="titulo-bloco-dashboard"><div><p>CARTÃO</p><h2 id="titulo-cartao-resumo">Cartão Arkhé</h2></div><span className="cartao-selo">UM CARTÃO, SUA CONTA</span></div>
      {carregando ? <div className="cartao-carregando" role="status"><span aria-hidden="true" />Consultando seu cartão...</div>
        : erro ? <div className="cartao-estado"><p role="alert">{erro}</p><button type="button" className="botao botao-secundario" onClick={dados.carregarCartao}>Tentar novamente</button></div>
          : <div className={`cartao-resumo-conteudo ${cartao ? 'com-grafico-limite' : ''}`}>
            <CartaoVisual compacto nome={nomeNoCartao(usuario)} final={numeroCartao(cartao).slice(-4)} previa={!cartao} />
            {cartao ? <div className="cartao-resumo-informacoes">{detalhes}<GraficoLimite cartao={cartao} /></div> : detalhes}
          </div>}
    </section>
    {aberto && <ModalCartao usuario={usuario} dados={dados} fechar={() => setAberto(false)} />}
  </>
}
