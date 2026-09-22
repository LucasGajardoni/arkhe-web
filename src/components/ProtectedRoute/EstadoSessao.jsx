import { useSessao } from '../../hooks/useSessao.js'

export default function EstadoSessao() {
  const { erroSessao, recarregarSessao } = useSessao()
  return <main className="estado-sessao" role="status" aria-live="polite">
    <strong>{erroSessao || 'Verificando sua sessão...'}</strong>
    {erroSessao && <button type="button" className="botao botao-principal" onClick={recarregarSessao}>Tentar novamente</button>}
  </main>
}
