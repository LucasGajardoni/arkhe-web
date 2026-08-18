export default function EscolhaTipoConta({ tipoConta, escolher, continuar }) {
  return <>
    <div className="cabecalho-login"><p className="rotulo-secao">ACESSO À CONTA</p><h1>Acesse sua conta Arkhé</h1><p>Escolha o tipo de conta que deseja acessar.</p></div>
    <div className="tipos-acesso">
      <button className={tipoConta === 'PF' ? 'selecionado' : ''} type="button" onClick={() => escolher('PF')}><span>PF</span><strong>Pessoa Física</strong></button>
      <button className={tipoConta === 'PJ' ? 'selecionado' : ''} type="button" onClick={() => escolher('PJ')}><span>PJ</span><strong>Pessoa Jurídica</strong></button>
    </div>
    <button className="botao botao-principal botao-largo" type="button" disabled={!tipoConta} onClick={continuar}>Continuar</button>
  </>
}
