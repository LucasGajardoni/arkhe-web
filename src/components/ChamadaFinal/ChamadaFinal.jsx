import './ChamadaFinal.css'

function ChamadaFinal({ abrirCadastro }) {
  return (
    <section className="secao-chamada-final" id="abrir-conta" aria-labelledby="titulo-chamada">
      <div className="conteudo chamada-final">
        <div>
          <p className="rotulo-chamada">SEU PRÓXIMO PASSO</p>
          <h2 id="titulo-chamada">Comece agora sua jornada com o Arkhé</h2>
          <p>Uma experiência bancária moderna, segura e transparente para pessoas e empresas.</p>
        </div>
        <button className="botao botao-chamada" type="button" onClick={abrirCadastro}>Abrir minha conta agora <span aria-hidden="true">→</span></button>
      </div>
    </section>
  )
}

export default ChamadaFinal
