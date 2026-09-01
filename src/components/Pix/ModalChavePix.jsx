import { useEffect } from 'react'
import { formatarChavePix } from '../../utils/formatadores.js'

const tipos = [
  ['email', 'E-mail'],
  ['telefone', 'Telefone'],
  ['cpf', 'CPF'],
  ['cnpj', 'CNPJ'],
  ['aleatoria', 'Chave aleatória'],
]

export default function ModalChavePix({ pix, fechar }) {
  const { tipo, alterarTipo, tiposDisponiveis, valor, valorValido, cadastrar, processando, erro } = pix
  const tiposVisiveis = tipos.filter(([valorTipo]) => tiposDisponiveis.includes(valorTipo))

  useEffect(() => {
    function fecharComEsc(evento) { if (evento.key === 'Escape') fechar() }
    document.addEventListener('keydown', fecharComEsc)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', fecharComEsc); document.body.style.overflow = '' }
  }, [fechar])

  return <div className="fundo-modal-perfil" role="presentation" onMouseDown={(evento) => { if (evento.target === evento.currentTarget) fechar() }}>
    <section className="modal-perfil modal-chave-pix" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-chave">
      <header><div><p>MINHAS CHAVES</p><h2 id="titulo-modal-chave">Cadastrar chave Pix</h2><span>Escolha como você quer receber transferências.</span></div><button type="button" onClick={fechar} aria-label="Fechar modal">×</button></header>
      <form onSubmit={cadastrar}>
        <fieldset><legend>Tipo da chave</legend><div className="tipos-chave-pix">{tiposVisiveis.map(([valorTipo, rotulo]) => <button className={tipo === valorTipo ? 'ativo' : ''} type="button" key={valorTipo} onClick={() => alterarTipo(valorTipo)}>{rotulo}</button>)}</div></fieldset>
        {tipo === 'aleatoria'
          ? <div className="aviso-chave-aleatoria"><strong>Chave gerada automaticamente</strong><span>O banco criará um código único e seguro para você.</span></div>
          : <label className="campo-chave-pix"><span>{tipos.find(([valorTipo]) => valorTipo === tipo)?.[1]}</span><input value={formatarChavePix(tipo, valor)} readOnly /><small>Usaremos o dado confirmado no seu cadastro. Ele não pode ser alterado por aqui.</small></label>}
        {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}
        <footer><button className="botao botao-secundario" type="button" onClick={fechar}>Cancelar</button><button className="botao botao-principal" type="submit" disabled={!valorValido || processando}>{processando ? 'Cadastrando...' : 'Cadastrar chave'}</button></footer>
      </form>
    </section>
  </div>
}
