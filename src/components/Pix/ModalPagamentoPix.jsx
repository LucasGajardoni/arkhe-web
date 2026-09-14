import { useEffect, useRef, useState } from 'react'
import { useModalAcessivel } from '../../hooks/useModalAcessivel.js'
import AcoesComprovante from '../Comprovante/AcoesComprovante.jsx'
import {
  buscarCobrancaPixPorCodigo,
  buscarContasUsuario,
  pagarCobrancaPix,
  realizarPix,
} from '../../services/pixService.js'
import { mascaraCnpj, mascaraCpf, mascaraTelefone, somenteNumeros } from '../../utils/formatadores.js'
import ScannerQrPix from './ScannerQrPix.jsx'
import './ModalPagamentoPix.css'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const tiposChave = [['email', 'E-mail'], ['cpf', 'CPF'], ['cnpj', 'CNPJ'], ['telefone', 'Telefone'], ['aleatoria', 'Aleatória']]

function detectarTipo(valor, atual) {
  const texto = String(valor || '').trim()
  if (texto.includes('@')) return 'email'
  if (/^[+()\d.\s-]+$/.test(texto)) {
    if (texto.startsWith('+') || atual === 'telefone') return 'telefone'
    return somenteNumeros(texto).length > 11 ? 'cnpj' : 'cpf'
  }
  return 'aleatoria'
}

function formatarChave(tipo, valor) {
  if (tipo === 'cpf') return mascaraCpf(valor)
  if (tipo === 'cnpj') return mascaraCnpj(valor)
  if (tipo === 'telefone') return mascaraTelefone(valor)
  return String(valor || '')
}

function limparChave(tipo, valor) {
  return ['cpf', 'cnpj', 'telefone'].includes(tipo) ? somenteNumeros(valor) : String(valor || '').trim()
}

function chaveCompleta(tipo, valor) {
  const limpa = limparChave(tipo, valor)
  if (tipo === 'cpf') return limpa.length === 11
  if (tipo === 'cnpj') return limpa.length === 14
  if (tipo === 'telefone') return limpa.length === 10 || limpa.length === 11
  if (tipo === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpa)
  return limpa.length >= 8
}

function contaDaChave(contas, tipo, chave) {
  const procurada = limparChave(tipo, chave).toLowerCase()
  return contas.find((conta) => conta.chaves_pix?.some((item) => (
    item.tipo === tipo && limparChave(tipo, item.valor).toLowerCase() === procurada
  ))) || null
}

function nomeRecebedor(cobranca) {
  if (typeof cobranca?.recebedor === 'string' && cobranca.recebedor.trim()) return cobranca.recebedor.trim()
  return cobranca?.recebedor?.nome_fantasia
    || cobranca?.recebedor?.razao_social
    || cobranca?.recebedor?.nome
    || cobranca?.nome_recebedor
    || cobranca?.nome_fantasia
    || cobranca?.razao_social
    || (cobranca?.id_recebedor != null ? `Conta recebedora #${cobranca.id_recebedor}` : 'Recebedor não informado')
}

function descricaoConta(usuario) {
  const partes = [`Conta ${usuario?.tipoConta || 'atual'}`]
  if (usuario?.banco) partes.push(usuario.banco)
  if (usuario?.agencia) partes.push(`Agência ${usuario.agencia}`)
  if (usuario?.numeroConta) partes.push(`Conta ${usuario.numeroConta}`)
  return partes.join(' · ')
}

function cobrancaPaga(cobranca) {
  const statusOriginal = cobranca?.status
  const status = String(statusOriginal ?? '').trim().toLowerCase()
  return statusOriginal === 1 || statusOriginal === '1' || ['pago', 'paga', 'baixado', 'baixada'].includes(status)
}

function cobrancaPendente(cobranca) {
  const statusOriginal = cobranca?.status
  const status = String(statusOriginal ?? '').trim().toLowerCase()
  return statusOriginal === 0 || statusOriginal === '0' || ['pendente', 'aberto', 'aberta'].includes(status)
}

function rotuloMetodo(metodo) {
  if (metodo === 'qr') return 'Pix por QR Code'
  if (metodo === 'copia') return 'Pix Copia e Cola'
  return 'Chave Pix'
}

export default function ModalPagamentoPix({ usuario, fechar, aoConcluir }) {
  const [etapa, setEtapa] = useState('metodo')
  const [metodo, setMetodo] = useState('')
  const [chave, setChave] = useState('')
  const [tipoChave, setTipoChave] = useState('cpf')
  const [codigo, setCodigo] = useState('')
  const [centavos, setCentavos] = useState(0)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')
  const [destinatario, setDestinatario] = useState(null)
  const [cobranca, setCobranca] = useState(null)
  const [buscandoDestinatario, setBuscandoDestinatario] = useState(false)
  const [erroBusca, setErroBusca] = useState('')
  const [idMovimentacao, setIdMovimentacao] = useState(null)
  const processandoRef = useRef(false)
  const { modalRef, fecharAoClicarFora } = useModalAcessivel(fechar, processando)

  useEffect(() => {
    if (etapa !== 'chave' || !chaveCompleta(tipoChave, chave)) return undefined
    let ativo = true
    const temporizador = setTimeout(async () => {
      setBuscandoDestinatario(true)
      try {
        const resposta = await buscarContasUsuario(limparChave(tipoChave, chave))
        if (!ativo) return
        const conta = contaDaChave(Array.isArray(resposta.contas) ? resposta.contas : [], tipoChave, chave)
        setDestinatario(conta)
        setErroBusca(conta ? '' : 'Nenhuma conta encontrada para esta chave Pix.')
      } catch (falha) {
        if (ativo) {
          setDestinatario(null)
          setErroBusca(falha.message)
        }
      } finally {
        if (ativo) setBuscandoDestinatario(false)
      }
    }, 550)
    return () => {
      ativo = false
      clearTimeout(temporizador)
    }
  }, [chave, etapa, tipoChave])

  function selecionarMetodo(novoMetodo) {
    setMetodo(novoMetodo)
    setErro('')
    setCobranca(null)
    if (novoMetodo === 'chave') setEtapa('chave')
    if (novoMetodo === 'qr') setEtapa('scanner')
    if (novoMetodo === 'copia') setEtapa('copia')
  }

  function voltarAosMetodos() {
    setEtapa('metodo')
    setMetodo('')
    setErro('')
    setCobranca(null)
  }

  function alterarValor(evento) {
    const digitos = evento.target.value.replace(/\D/g, '').slice(0, 13)
    setCentavos(Number(digitos) || 0)
    setErro('')
  }

  function alterarChave(evento) {
    const valor = evento.target.value
    const tipo = detectarTipo(valor, tipoChave)
    setTipoChave(tipo)
    setChave(formatarChave(tipo, valor))
    setErro('')
    setDestinatario(null)
    setErroBusca('')
    setBuscandoDestinatario(false)
  }

  function selecionarTipo(tipo) {
    setTipoChave(tipo)
    setChave(formatarChave(tipo, chave))
    setDestinatario(null)
    setErroBusca('')
  }

  async function localizarCobranca(codigoInformado, origem = metodo) {
    const codigoLimpo = String(codigoInformado || '').trim()
    if (processandoRef.current || !codigoLimpo) {
      if (!codigoLimpo) setErro('Cole um código Pix ou leia um QR Code para continuar.')
      return
    }

    processandoRef.current = true
    setProcessando(true)
    setErro('')
    setCodigo(codigoLimpo)
    setMetodo(origem)
    setEtapa('buscando')

    try {
      const resposta = await buscarCobrancaPixPorCodigo(codigoLimpo)
      const cobrancaEncontrada = resposta.cobranca || resposta

      if (cobrancaEncontrada?.id_cobranca == null) throw new Error('Esta cobrança Pix não foi encontrada.')
      if (Number(cobrancaEncontrada.tipo_cobranca) !== 1) throw new Error('Este código não corresponde a uma cobrança Pix.')
      if (!cobrancaPendente(cobrancaEncontrada) && !cobrancaPaga(cobrancaEncontrada)) {
        throw new Error('Esta cobrança Pix não está pendente e não pode ser paga.')
      }

      setCobranca(cobrancaEncontrada)
      setEtapa('revisao_codigo')
    } catch (falha) {
      setCobranca(null)
      let mensagem = falha.message || 'Não foi possível localizar esta cobrança Pix.'
      if (falha.status === 404) {
        mensagem = origem === 'qr'
          ? 'Este QR Code não identifica uma cobrança Pix válida do Arkhé.'
          : 'Este código não identifica uma cobrança Pix válida do Arkhé.'
      }
      setErro(mensagem)
      setEtapa(origem === 'qr' ? 'scanner' : 'copia')
    } finally {
      processandoRef.current = false
      setProcessando(false)
    }
  }

  async function enviarPorChave() {
    if (processandoRef.current || centavos <= 0 || !chave.trim()) return
    processandoRef.current = true
    setProcessando(true)
    setErro('')
    try {
      const resposta = await realizarPix(tipoChave, limparChave(tipoChave, chave), centavos / 100)
      setIdMovimentacao(resposta.id_movimentacao || null)
      Promise.resolve(aoConcluir?.()).catch(() => {})
      setEtapa('sucesso')
    } catch (falha) {
      setErro(falha.message)
    } finally {
      processandoRef.current = false
      setProcessando(false)
    }
  }

  async function pagarCodigo() {
    if (!cobranca || cobrancaPaga(cobranca) || processandoRef.current) return
    processandoRef.current = true
    setProcessando(true)
    setErro('')
    try {
      const resposta = await pagarCobrancaPix(cobranca.id_cobranca)
      setIdMovimentacao(resposta.id_movimentacao || null)
      Promise.resolve(aoConcluir?.()).catch(() => {})
      setEtapa('sucesso')
    } catch (falha) {
      setErro(falha.message || 'Não foi possível pagar esta cobrança Pix.')
    } finally {
      processandoRef.current = false
      setProcessando(false)
    }
  }

  const valorCobranca = Number(cobranca?.valor) || 0
  const valorSucesso = metodo === 'chave' ? centavos / 100 : valorCobranca
  const recebedorSucesso = metodo === 'chave'
    ? destinatario?.nome_fantasia || destinatario?.nome
    : nomeRecebedor(cobranca)

  let conteudo
  let etapaAtual = 1
  let titulo = 'Como você quer pagar?'

  if (['chave', 'scanner', 'copia', 'buscando'].includes(etapa)) etapaAtual = 2
  if (etapa === 'valor') etapaAtual = 3
  if (['confirmacao', 'revisao_codigo', 'confirmacao_codigo'].includes(etapa)) etapaAtual = 4
  if (etapa === 'chave') titulo = 'Pagar com chave Pix'
  if (etapa === 'scanner') titulo = 'Ler QR Code Pix'
  if (etapa === 'copia') titulo = 'Pix Copia e Cola'
  if (etapa === 'buscando') titulo = 'Consultando o Pix'
  if (etapa === 'valor') titulo = 'Informe o valor'
  if (etapa === 'confirmacao' || etapa === 'revisao_codigo') titulo = 'Revise antes de pagar'
  if (etapa === 'confirmacao_codigo') titulo = 'Confirme o pagamento'
  if (etapa === 'sucesso') titulo = 'Pix concluído'

  if (etapa === 'metodo') {
    conteudo = (
      <div className="conteudo-metodos-pix">
        <p>Escolha como deseja identificar quem vai receber.</p>
        <div className="metodos-pagamento-pix">
          <button type="button" onClick={() => selecionarMetodo('chave')}>
            <span aria-hidden="true">◇</span>
            <div><strong>Chave Pix</strong><small>CPF, CNPJ, e-mail, telefone ou aleatória</small></div>
            <b aria-hidden="true">›</b>
          </button>
          <button type="button" onClick={() => selecionarMetodo('qr')}>
            <span aria-hidden="true">▦</span>
            <div><strong>Ler QR Code</strong><small>Aponte a câmera para uma cobrança Pix</small></div>
            <b aria-hidden="true">›</b>
          </button>
          <button type="button" onClick={() => selecionarMetodo('copia')}>
            <span aria-hidden="true">⧉</span>
            <div><strong>Pix Copia e Cola</strong><small>Cole o código completo da cobrança</small></div>
            <b aria-hidden="true">›</b>
          </button>
        </div>
        <footer><button className="botao botao-secundario" type="button" onClick={fechar}>Cancelar</button></footer>
      </div>
    )
  } else if (etapa === 'chave') {
    conteudo = (
      <form onSubmit={(evento) => { evento.preventDefault(); if (destinatario) setEtapa('valor') }}>
        <label className="campo-chave-pix">
          <span>Chave Pix do destinatário</span>
          <input autoFocus value={chave} onChange={alterarChave} placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória" />
          <small>Tipo identificado: {tiposChave.find(([tipo]) => tipo === tipoChave)?.[1]}</small>
        </label>
        <div className="tipos-chave-pagamento" aria-label="Tipo da chave Pix">
          {tiposChave.map(([tipo, rotulo]) => <button className={tipoChave === tipo ? 'ativo' : ''} type="button" key={tipo} onClick={() => selecionarTipo(tipo)}>{rotulo}</button>)}
        </div>
        {buscandoDestinatario && <div className="busca-destinatario-pix"><span className="carregando-pix" /><p>Buscando destinatário...</p></div>}
        {!buscandoDestinatario && destinatario && (
          <div className="destinatario-pix" role="status">
            <span>{(destinatario.nome_fantasia || destinatario.nome || 'D').slice(0, 1).toUpperCase()}</span>
            <div><small>DESTINATÁRIO ENCONTRADO</small><strong>{destinatario.nome_fantasia || destinatario.nome}</strong><p>{destinatario.banco || 'Banco não informado'} · Agência {destinatario.agencia}</p></div>
          </div>
        )}
        {!buscandoDestinatario && erroBusca && <p className="erro-busca-destinatario" role="alert">{erroBusca}</p>}
        <footer>
          <button className="botao botao-secundario" type="button" onClick={voltarAosMetodos}>Voltar</button>
          <button className="botao botao-principal" type="submit" disabled={!destinatario || buscandoDestinatario}>Continuar</button>
        </footer>
      </form>
    )
  } else if (etapa === 'scanner') {
    conteudo = (
      <div className="conteudo-scanner-pix">
        <ScannerQrPix aoLer={(codigoLido) => localizarCobranca(codigoLido, 'qr')} aoColar={() => selecionarMetodo('copia')} erroExterno={erro} />
        <footer><button className="botao botao-secundario" type="button" onClick={voltarAosMetodos}>Voltar</button></footer>
      </div>
    )
  } else if (etapa === 'copia') {
    conteudo = (
      <form className="form-copia-cola-pix" onSubmit={(evento) => { evento.preventDefault(); localizarCobranca(codigo, 'copia') }}>
        <label>
          <span>Código Pix Copia e Cola</span>
          <textarea autoFocus autoComplete="off" spellCheck="false" value={codigo} onChange={(evento) => { setCodigo(evento.target.value); setErro('') }} placeholder="ARKHEPIX:..." />
          <small>O código será consultado antes de qualquer pagamento.</small>
        </label>
        {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}
        <footer>
          <button className="botao botao-secundario" type="button" onClick={voltarAosMetodos}>Voltar</button>
          <button className="botao botao-principal" type="submit" disabled={!codigo.trim()}>Continuar</button>
        </footer>
      </form>
    )
  } else if (etapa === 'buscando') {
    conteudo = (
      <div className="buscando-cobranca-pix" role="status" aria-live="polite">
        <span />
        <strong>Consultando a cobrança Pix...</strong>
        <p>Estamos validando o código e os dados do recebedor.</p>
      </div>
    )
  } else if (etapa === 'valor') {
    conteudo = (
      <form onSubmit={(evento) => { evento.preventDefault(); if (centavos > 0) setEtapa('confirmacao') }}>
        <label className="campo-chave-pix campo-valor-pix">
          <span>Valor do Pix</span>
          <input autoFocus inputMode="decimal" value={moeda.format(centavos / 100)} onChange={alterarValor} aria-label="Valor do Pix" />
          <small>Informe um valor maior que zero.</small>
        </label>
        <footer>
          <button className="botao botao-secundario" type="button" onClick={() => setEtapa('chave')}>Voltar</button>
          <button className="botao botao-principal" type="submit" disabled={centavos <= 0}>Revisar Pix</button>
        </footer>
      </form>
    )
  } else if (etapa === 'confirmacao') {
    conteudo = (
      <div className="confirmacao-pagamento-pix">
        <dl>
          <div><dt>Método</dt><dd>Chave Pix</dd></div>
          <div><dt>Chave Pix</dt><dd>{chave}</dd></div>
          {destinatario && <div><dt>Destinatário</dt><dd>{destinatario.nome_fantasia || destinatario.nome}</dd></div>}
          <div><dt>Valor</dt><dd>{moeda.format(centavos / 100)}</dd></div>
          <div><dt>Conta de origem</dt><dd>{descricaoConta(usuario)}</dd></div>
        </dl>
        {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}
        <footer>
          <button className="botao botao-secundario" type="button" disabled={processando} onClick={() => setEtapa('valor')}>Voltar</button>
          <button className="botao botao-principal" type="button" disabled={processando} onClick={enviarPorChave}>{processando ? 'Enviando...' : 'Confirmar e enviar'}</button>
        </footer>
      </div>
    )
  } else if (etapa === 'revisao_codigo') {
    const paga = cobrancaPaga(cobranca)
    conteudo = (
      <div className="revisao-cobranca-pix">
        <div className="recebedor-cobranca-pix">
          <span>{nomeRecebedor(cobranca).slice(0, 1).toUpperCase()}</span>
          <div><small>RECEBEDOR</small><strong>{nomeRecebedor(cobranca)}</strong></div>
        </div>
        <strong className="valor-cobranca-pix">{moeda.format(valorCobranca)}</strong>
        <dl>
          <div><dt>Método</dt><dd>{rotuloMetodo(metodo)}</dd></div>
          <div><dt>Situação</dt><dd>{paga ? 'Pix já pago' : 'Pendente'}</dd></div>
          <div><dt>Conta de origem</dt><dd>{descricaoConta(usuario)}</dd></div>
        </dl>
        {paga && <p className="aviso-cobranca-pix-paga" role="status">Este Pix já foi pago e não pode ser pago novamente.</p>}
        {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}
        <footer>
          <button className="botao botao-secundario" type="button" onClick={() => { setErro(''); setEtapa(metodo === 'qr' ? 'scanner' : 'copia') }}>Voltar</button>
          <button className="botao botao-principal" type="button" disabled={paga} onClick={() => setEtapa('confirmacao_codigo')}>Pagar {moeda.format(valorCobranca)}</button>
        </footer>
      </div>
    )
  } else if (etapa === 'confirmacao_codigo') {
    conteudo = (
      <div className="confirmar-cobranca-pix">
        <span aria-hidden="true">!</span>
        <h3>Confirmar pagamento?</h3>
        <p>Você pagará <strong>{moeda.format(valorCobranca)}</strong> para <strong>{nomeRecebedor(cobranca)}</strong>.</p>
        <small>O valor será debitado de {descricaoConta(usuario)}.</small>
        {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}
        <footer>
          <button className="botao botao-secundario" type="button" disabled={processando} onClick={() => { setErro(''); setEtapa('revisao_codigo') }}>Voltar</button>
          <button className="botao botao-principal" type="button" disabled={processando} onClick={pagarCodigo}>{processando ? 'Enviando Pix...' : 'Confirmar Pix'}</button>
        </footer>
      </div>
    )
  } else {
    conteudo = (
      <div className="sucesso-pagamento-pix" role="status">
        <span>✓</span>
        <h3>Pix enviado com sucesso</h3>
        <strong>{moeda.format(valorSucesso)}</strong>
        {recebedorSucesso && <p>{recebedorSucesso}</p>}
        <AcoesComprovante idMovimentacao={idMovimentacao} />
        <button className="botao botao-principal" type="button" onClick={fechar}>Concluir</button>
      </div>
    )
  }

  return (
    <div className="fundo-modal-perfil" role="presentation" onMouseDown={fecharAoClicarFora}>
      <section ref={modalRef} className="modal-perfil modal-chave-pix modal-pagamento-pix" role="dialog" aria-modal="true" aria-labelledby="titulo-pagamento-pix" tabIndex="-1">
        <header>
          <div><p>PAGAR COM PIX</p><h2 id="titulo-pagamento-pix">{titulo}</h2><span>O pagamento só acontece depois da sua confirmação.</span></div>
          <button type="button" disabled={processando} onClick={fechar} aria-label="Fechar modal">×</button>
        </header>
        {etapa !== 'sucesso' && (
          <p className="progresso-operacao" aria-label={`Etapa ${etapaAtual} de 4`}>
            <span style={{ width: `${(etapaAtual / 4) * 100}%` }} />
          </p>
        )}
        {conteudo}
      </section>
    </div>
  )
}
