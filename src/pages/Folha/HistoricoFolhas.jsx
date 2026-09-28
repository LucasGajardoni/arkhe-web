import { useEffect, useState } from 'react'
import { useSessao } from '../../hooks/useSessao.js'
import { listarFolhas } from '../../services/folhaService.js'
import { dataMovimentacao } from '../../utils/movimentacoes.js'
import { competencia, formatarDataFolha, moeda, statusFolha, tonsFolha } from './folhaUtils.js'

const acoes = ['Abrir folha', 'Abrir folha', 'Ver processamento', 'Ver folha', 'Continuar']

export default function HistoricoFolhas({ revisao, bloqueado, abrir, visivel, idAtual }) {
  const { tratarErroSessao } = useSessao()
  const [tentativa, setTentativa] = useState(0)
  const [estado, setEstado] = useState(null)
  const chave = `${revisao}:${tentativa}`
  const carregando = estado?.chave !== chave

  useEffect(() => {
    let ativo = true
    listarFolhas().then((dados) => {
      if (!Array.isArray(dados?.folhas)) throw new Error('Resposta de histórico inválida.')
      if (ativo) setEstado({ chave, dados })
    }).catch((erro) => {
      if (ativo) {
        setEstado({ chave, erro: 'Não foi possível carregar as folhas anteriores.' })
        tratarErroSessao(erro)
      }
    })
    return () => { ativo = false }
  }, [chave, tratarErroSessao])

  const dados = !carregando && !estado.erro ? estado.dados : null
  return <section className="bloco-dashboard folha-painel folha-historico" aria-labelledby="titulo-historico-folhas" aria-busy={carregando} hidden={!visivel}>
    <header className="folha-topo-painel">
      <div><p className="rotulo-secao">COMPETÊNCIAS</p><h2 id="titulo-historico-folhas">Escolha a folha que deseja acompanhar</h2><p>Abra qualquer mês para revisar, pagar pendências ou emitir comprovantes.</p></div>
      {dados && <p>Folhas criadas: <strong>{dados.total}</strong></p>}
    </header>
    {carregando ? <p className="folha-estado" role="status">Carregando folhas anteriores...</p> : estado.erro ? (
      <div className="mensagem-identidade erro folha-erro-historico" role="alert">
        <p>{estado.erro}</p>
        <button className="botao botao-secundario" type="button" disabled={bloqueado} onClick={() => setTentativa((atual) => atual + 1)}>Tentar novamente</button>
      </div>
    ) : dados.folhas.length === 0 ? (
      <div className="folha-estado"><h3>Nenhuma folha criada ainda.</h3><p>Quando você gerar a primeira folha de pagamento, ela aparecerá aqui.</p></div>
    ) : (
      <ul className="folha-lista">
        {dados.folhas.map((folha) => {
          const status = Number(folha.status)
          const dataPagamento = dataMovimentacao({ data_movimentacao: folha.data_pagamento })
          const periodo = competencia(folha)
          const atual = String(folha.id_folha) === String(idAtual)
          return <li className={`folha-historico-item${atual ? ' atual' : ''}`} key={folha.id_folha} aria-current={atual ? 'true' : undefined}>
            <div>
              <div className="folha-historico-titulo"><h3>{periodo.charAt(0).toUpperCase() + periodo.slice(1)}</h3>{atual && <strong>Aberta agora</strong>}</div>
              <span className={`folha-badge ${tonsFolha[status] || 'neutro'}`}>{statusFolha[status] || 'Situação não informada'}</span>
              <p>{folha.quantidade_funcionarios} {Number(folha.quantidade_funcionarios) === 1 ? 'funcionário' : 'funcionários'}</p>
              <p>Criada em {formatarDataFolha(folha.data_criacao, false) || 'data não informada'}</p>
              {dataPagamento && <p>Pago em {dataPagamento.toLocaleDateString('pt-BR')}</p>}
            </div>
            <dl className="folha-historico-valores">
              <div><dt>Total</dt><dd>{moeda.format(folha.total)}</dd></div>
              {(Number(folha.total_pago) > 0 || status === 3 || status === 4) && <div><dt>Pago</dt><dd>{moeda.format(folha.total_pago)}</dd></div>}
              {Number(folha.total_valido) > 0 && <div><dt>Pronto para pagar</dt><dd>{moeda.format(folha.total_valido)}</dd></div>}
              {Number(folha.total_pendente) > 0 && <div><dt>Pendente</dt><dd>{moeda.format(folha.total_pendente)}</dd></div>}
            </dl>
            <button className={`botao ${atual ? 'botao-principal' : 'botao-secundario'}`} type="button" disabled={bloqueado} aria-label={`${atual ? 'Atualizar folha' : acoes[status] || 'Abrir folha'} de ${periodo}`} onClick={() => abrir(folha.id_folha)}>{atual ? 'Atualizar folha' : acoes[status] || 'Abrir folha'}</button>
          </li>
        })}
      </ul>
    )}
  </section>
}
