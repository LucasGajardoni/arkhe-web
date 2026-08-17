import './Beneficios.css'

const beneficios = [
  { numero: '01', destaque: 'Proteção contínua', titulo: 'Segurança', texto: 'Tecnologia e cuidado trabalhando juntos para proteger cada etapa da sua jornada.', icone: <path d="M12 3 5 6v5c0 4.7 3 8.1 7 10 4-1.9 7-5.3 7-10V6l-7-3Zm-3 9 2 2 4-4" /> },
  { numero: '02', destaque: 'Tudo no seu ritmo', titulo: 'Agilidade', texto: 'Uma experiência fluida para você resolver, acompanhar e movimentar sem atrito.', icone: <><path d="M5 12h14M13 6l6 6-6 6" /><path d="M8 6H5" /></> },
  { numero: '03', destaque: 'Clareza sempre', titulo: 'Transparência', texto: 'Informações diretas e acessíveis para você tomar decisões com tranquilidade.', icone: <><circle cx="12" cy="12" r="8" /><path d="M12 11v5M12 8h.01" /></> },
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
              <div className="topo-beneficio">
                <span className="icone-beneficio"><svg viewBox="0 0 24 24" aria-hidden="true">{beneficio.icone}</svg></span>
                <span className="numero-beneficio" aria-hidden="true">{beneficio.numero}</span>
              </div>
              <div className="conteudo-beneficio">
                <span className="destaque-beneficio">{beneficio.destaque}</span>
                <h3>{beneficio.titulo}</h3>
                <p>{beneficio.texto}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
