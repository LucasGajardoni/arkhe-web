import './Beneficios.css'

const beneficios = [
  { titulo: 'Segurança', texto: 'Proteção em todas as etapas.', icone: <path d="M12 3 5 6v5c0 4.7 3 8.1 7 10 4-1.9 7-5.3 7-10V6l-7-3Zm-3 9 2 2 4-4" /> },
  { titulo: 'Agilidade', texto: 'Movimente sua conta sem atrito.', icone: <><path d="M5 12h14M13 6l6 6-6 6" /><path d="M8 6H5" /></> },
  { titulo: 'Transparência', texto: 'Informações claras e acessíveis.', icone: <><circle cx="12" cy="12" r="8" /><path d="M12 11v5M12 8h.01" /></> },
]

export default function Beneficios() {
  return (
    <section className="beneficios" aria-labelledby="titulo-beneficios">
      <div className="conteudo">
        <div className="cabecalho-secao">
          <p className="rotulo-secao">FEITO PARA SER SIMPLES</p>
          <h2 className="titulo-secao" id="titulo-beneficios">Tudo o que você precisa, sem complicação.</h2>
        </div>
        <div className="grade-beneficios">
          {beneficios.map((beneficio) => (
            <article className="cartao-beneficio" key={beneficio.titulo}>
              <span className="icone-beneficio"><svg viewBox="0 0 24 24" aria-hidden="true">{beneficio.icone}</svg></span>
              <div><h3>{beneficio.titulo}</h3><p>{beneficio.texto}</p></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
