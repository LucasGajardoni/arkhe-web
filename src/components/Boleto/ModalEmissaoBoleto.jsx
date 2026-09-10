import { useEffect, useState } from 'react'
import { adicionarCobranca, buscarContasUsuario } from '../../services/pixService.js'
import {
  formatarDataBrasileira,
  mascaraCnpj,
  mascaraCpf,
} from '../../utils/formatadores.js'
import AcoesBoletoPdf from './AcoesBoletoPdf.jsx'
import './ModalEmissaoBoleto.css'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function dataLocalHoje() {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function tipoConta(conta) {
  const tipo = conta.tipo_conta ?? conta.tipoConta
  if (tipo === 1 || tipo === '1' || tipo === 'PJ') return 'PJ'
  if (tipo === 0 || tipo === '0' || tipo === 'PF') return 'PF'
  return ''
}

function nomeConta(conta) {
  return conta.nome_fantasia || conta.razao_social || conta.nome || 'Nome não informado'
}

function numeroConta(conta) {
  return conta.numero_conta || conta.numeroConta || conta.conta || 'Não informado'
}

function documentoConta(conta) {
  const tipo = tipoConta(conta)
  if (tipo === 'PJ' && conta.cnpj) return mascaraCnpj(conta.cnpj)
  if (conta.cpf) return mascaraCpf(conta.cpf)
  if (conta.cnpj) return mascaraCnpj(conta.cnpj)
  return 'Não informado'
}

function contaAtual(conta, usuario) {
  if (usuario.idConta != null && conta.id_conta != null) {
    return String(usuario.idConta) === String(conta.id_conta)
  }

  if (!usuario.agencia || !usuario.numeroConta) return false
  return String(usuario.agencia) === String(conta.agencia)
    && String(usuario.numeroConta) === String(numeroConta(conta))
}

function descricaoRecebedora(usuario) {
  const partes = [`Conta ${usuario.tipoConta}`]
  if (usuario.banco) partes.push(usuario.banco)
  if (usuario.agencia) partes.push(`Agência ${usuario.agencia}`)
  if (usuario.numeroConta) partes.push(`Conta ${usuario.numeroConta}`)
  return partes.join(' · ')
}

export default function ModalEmissaoBoleto({ usuario, fechar }) {
  const [etapa, setEtapa] = useState('busca')
  const [busca, setBusca] = useState('')
  const [contas, setContas] = useState([])
  const [contaSelecionada, setContaSelecionada] = useState(null)
  const [centavos, setCentavos] = useState(0)
  const [dataVencimento, setDataVencimento] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [pesquisaRealizada, setPesquisaRealizada] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState('')
  const [copiado, setCopiado] = useState(false)
  const hoje = dataLocalHoje()

  useEffect(() => {
    function fecharComEsc(evento) {
      if (evento.key === 'Escape' && !processando) fechar()
    }

    document.addEventListener('keydown', fecharComEsc)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', fecharComEsc)
      document.body.style.overflow = ''
    }
  }, [fechar, processando])

  function fecharAoClicarFora(evento) {
    if (evento.target === evento.currentTarget && !processando) fechar()
  }

  async function pesquisarPagador(evento) {
    evento.preventDefault()
    const termo = busca.trim()

    if (!termo || buscando) {
      if (!termo) setErro('Digite um dado do cliente para realizar a busca.')
      return
    }

    setBuscando(true)
    setErro('')
    setPesquisaRealizada(false)

    try {
      const resposta = await buscarContasUsuario(termo)
      const encontradas = Array.isArray(resposta.contas) ? resposta.contas : []
      setContas(encontradas)
      setPesquisaRealizada(true)
    } catch (falha) {
      setContas([])
      setPesquisaRealizada(true)
      setErro(falha.message || 'Não foi possível buscar as contas do cliente.')
    } finally {
      setBuscando(false)
    }
  }

  function selecionarPagador(conta) {
    if (contaAtual(conta, usuario) || conta.id_conta == null) return
    setContaSelecionada(conta)
    setErro('')
    setEtapa('dados')
  }

  function alterarValor(evento) {
    const digitos = evento.target.value.replace(/\D/g, '').slice(0, 13)
    setCentavos(Number(digitos) || 0)
    setErro('')
  }

  function revisarBoleto(evento) {
    evento.preventDefault()

    if (centavos <= 0) {
      setErro('Informe um valor maior que zero.')
      return
    }

    if (!dataVencimento || dataVencimento < hoje) {
      setErro('Escolha uma data de vencimento igual ou posterior a hoje.')
      return
    }

    setErro('')
    setEtapa('revisao')
  }

  async function emitirBoleto() {
    if (!contaSelecionada || processando) return

    setProcessando(true)
    setErro('')

    try {
      const resposta = await adicionarCobranca(
        contaSelecionada.id_conta,
        centavos / 100,
        dataVencimento,
      )
      setResultado(resposta)
      setEtapa('sucesso')
    } catch (falha) {
      setErro(falha.message || 'Não foi possível emitir o boleto.')
    } finally {
      setProcessando(false)
    }
  }

  async function copiarCodigo() {
    const codigo = String(resultado?.codigo_pagamento || '')
    if (!codigo) return

    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1800)
    } catch {
      setErro('Não foi possível copiar automaticamente. Selecione o código para copiar.')
    }
  }

  let conteudo

  if (etapa === 'busca') {
    conteudo = (
      <div className="conteudo-boleto etapa-busca-boleto">
        <form className="formulario-busca-boleto" onSubmit={pesquisarPagador}>
          <label>
            <span>Cliente pagador</span>
            <input
              autoFocus
              value={busca}
              onChange={(evento) => { setBusca(evento.target.value); setErro('') }}
              placeholder="CPF, CNPJ, e-mail, telefone ou nome"
            />
          </label>
          <button className="botao botao-principal" type="submit" disabled={buscando}>
            {buscando ? 'Buscando...' : 'Buscar cliente'}
          </button>
        </form>

        {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}

        {buscando && (
          <div className="carregando-boleto" role="status">
            <span className="spinner-boleto" />
            <p>Procurando contas...</p>
          </div>
        )}

        {!buscando && pesquisaRealizada && contas.length === 0 && !erro && (
          <p className="estado-vazio-boleto">Nenhuma conta pagadora foi encontrada.</p>
        )}

        {!buscando && contas.length > 0 && (
          <div className="resultados-boleto">
            <p>Selecione a conta que pagará o boleto</p>
            <div>
              {contas.map((conta, indice) => {
                const propria = contaAtual(conta, usuario)
                const indisponivel = propria || conta.id_conta == null

                return (
                  <button
                    type="button"
                    key={`${conta.id_conta || 'conta'}-${indice}`}
                    disabled={indisponivel}
                    onClick={() => selecionarPagador(conta)}
                  >
                    <span className="avatar-conta-boleto">{nomeConta(conta).slice(0, 1).toUpperCase()}</span>
                    <span className="identificacao-conta-boleto">
                      <strong>{nomeConta(conta)}</strong>
                      <small>{conta.banco || 'Banco não informado'} · Agência {conta.agencia || 'Não informada'} · Conta {numeroConta(conta)}</small>
                      <small>{documentoConta(conta)}</small>
                    </span>
                    <span className="tipo-conta-boleto">{tipoConta(conta) || 'Conta'}</span>
                    {propria && <em>Sua conta atual</em>}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <footer>
          <button className="botao botao-secundario" type="button" onClick={fechar}>Cancelar</button>
        </footer>
      </div>
    )
  } else if (etapa === 'dados') {
    conteudo = (
      <form className="conteudo-boleto" onSubmit={revisarBoleto}>
        <div className="pagador-selecionado-boleto">
          <span>{nomeConta(contaSelecionada).slice(0, 1).toUpperCase()}</span>
          <div>
            <small>PAGADOR SELECIONADO · {tipoConta(contaSelecionada)}</small>
            <strong>{nomeConta(contaSelecionada)}</strong>
            <p>{contaSelecionada.banco || 'Banco não informado'} · Agência {contaSelecionada.agencia || 'Não informada'} · Conta {numeroConta(contaSelecionada)}</p>
          </div>
        </div>

        <div className="campos-boleto">
          <label>
            <span>Valor do boleto</span>
            <input
              autoFocus
              inputMode="decimal"
              value={moeda.format(centavos / 100)}
              onChange={alterarValor}
              aria-label="Valor do boleto"
            />
            <small>Informe um valor maior que zero.</small>
          </label>
          <label>
            <span>Data de vencimento</span>
            <input
              type="date"
              min={hoje}
              value={dataVencimento}
              onChange={(evento) => { setDataVencimento(evento.target.value); setErro('') }}
            />
            <small>A data não pode ser anterior a hoje.</small>
          </label>
        </div>

        {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}

        <footer>
          <button className="botao botao-secundario" type="button" onClick={() => { setErro(''); setEtapa('busca') }}>Voltar</button>
          <button className="botao botao-principal" type="submit" disabled={centavos <= 0 || !dataVencimento}>Revisar boleto</button>
        </footer>
      </form>
    )
  } else if (etapa === 'revisao') {
    conteudo = (
      <div className="conteudo-boleto revisao-boleto">
        <dl>
          <div><dt>Pagador</dt><dd>{nomeConta(contaSelecionada)}</dd></div>
          <div><dt>Tipo</dt><dd>Conta {tipoConta(contaSelecionada)}</dd></div>
          <div><dt>Conta pagadora</dt><dd>Agência {contaSelecionada.agencia || 'Não informada'} · Conta {numeroConta(contaSelecionada)}</dd></div>
          <div><dt>Valor</dt><dd>{moeda.format(centavos / 100)}</dd></div>
          <div><dt>Vencimento</dt><dd>{formatarDataBrasileira(dataVencimento)}</dd></div>
          <div><dt>Conta recebedora</dt><dd>{descricaoRecebedora(usuario)}</dd></div>
        </dl>

        {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}

        <footer>
          <button className="botao botao-secundario" type="button" disabled={processando} onClick={() => { setErro(''); setEtapa('dados') }}>Voltar</button>
          <button className="botao botao-principal" type="button" disabled={processando} onClick={emitirBoleto}>
            {processando ? 'Emitindo...' : 'Confirmar emissão'}
          </button>
        </footer>
      </div>
    )
  } else {
    const codigo = String(resultado?.codigo_pagamento || '')
    const valorFinal = Number(resultado?.valor ?? centavos / 100)
    const vencimentoFinal = resultado?.data_vencimento || dataVencimento

    conteudo = (
      <div className="sucesso-boleto" role="status">
        <span>✓</span>
        <h3>Boleto emitido com sucesso</h3>
        <p>{nomeConta(contaSelecionada)}</p>
        <strong>{moeda.format(valorFinal)}</strong>
        <small>Vencimento em {formatarDataBrasileira(vencimentoFinal)}</small>

        <div className="codigo-boleto">
          <label htmlFor="codigo-pagamento-boleto">Código de pagamento</label>
          <div>
            <input id="codigo-pagamento-boleto" value={codigo} readOnly onFocus={(evento) => evento.target.select()} />
            <button type="button" onClick={copiarCodigo}>{copiado ? 'Copiado!' : 'Copiar'}</button>
          </div>
        </div>

        <AcoesBoletoPdf idCobranca={resultado?.id_cobranca} />

        {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}
        <button className="botao botao-principal" type="button" onClick={fechar}>Concluir</button>
      </div>
    )
  }

  return (
    <div className="fundo-modal-perfil" role="presentation" onMouseDown={fecharAoClicarFora}>
      <section className="modal-perfil modal-boleto" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-boleto">
        <header>
          <div>
            <p>COBRANÇA EMPRESARIAL</p>
            <h2 id="titulo-modal-boleto">Emitir boleto</h2>
            <span>Crie uma cobrança para outra conta do Banco Arkhé.</span>
          </div>
          <button type="button" disabled={processando} onClick={fechar} aria-label="Fechar modal">×</button>
        </header>
        {conteudo}
      </section>
    </div>
  )
}
