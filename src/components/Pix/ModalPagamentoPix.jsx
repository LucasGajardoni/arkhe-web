import { useEffect, useState } from 'react'
import { buscarContasUsuario, realizarPix } from '../../services/pixService.js'
import { mascaraCnpj, mascaraCpf, mascaraTelefone, somenteNumeros } from '../../utils/formatadores.js'
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

export default function ModalPagamentoPix({ usuario, fechar, aoConcluir }) {
  const [etapa, setEtapa] = useState('chave')
  const [chave, setChave] = useState('')
  const [tipoChave, setTipoChave] = useState('cpf')
  const [centavos, setCentavos] = useState(0)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')
  const [destinatario, setDestinatario] = useState(null)
  const [buscandoDestinatario, setBuscandoDestinatario] = useState(false)
  const [erroBusca, setErroBusca] = useState('')

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

  useEffect(() => {
    if (!chaveCompleta(tipoChave, chave)) return undefined
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
  }, [chave, tipoChave])

  function fecharAoClicarFora(evento) {
    if (evento.target === evento.currentTarget && !processando) fechar()
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

  async function enviar() {
    if (processando || centavos <= 0 || !chave.trim()) return
    setProcessando(true)
    setErro('')
    try {
      await realizarPix(tipoChave, limparChave(tipoChave, chave), centavos / 100)
      await aoConcluir()
      setEtapa('sucesso')
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setProcessando(false)
    }
  }

  let conteudo
  if (etapa === 'chave') {
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
          <button className="botao botao-secundario" type="button" onClick={fechar}>Cancelar</button>
          <button className="botao botao-principal" type="submit" disabled={!destinatario || buscandoDestinatario}>Continuar</button>
        </footer>
      </form>
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
          <div><dt>Chave Pix</dt><dd>{chave}</dd></div>
          {destinatario && <div><dt>Destinatário</dt><dd>{destinatario.nome_fantasia || destinatario.nome}</dd></div>}
          <div><dt>Valor</dt><dd>{moeda.format(centavos / 100)}</dd></div>
          {usuario?.tipoConta && <div><dt>Conta de origem</dt><dd>Conta {usuario.tipoConta}</dd></div>}
        </dl>
        {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}
        <footer>
          <button className="botao botao-secundario" type="button" disabled={processando} onClick={() => setEtapa('valor')}>Voltar</button>
          <button className="botao botao-principal" type="button" disabled={processando} onClick={enviar}>
            {processando ? 'Enviando...' : 'Confirmar e enviar'}
          </button>
        </footer>
      </div>
    )
  } else {
    conteudo = (
      <div className="sucesso-pagamento-pix" role="status">
        <span>✓</span>
        <h3>Pix enviado com sucesso</h3>
        <strong>{moeda.format(centavos / 100)}</strong>
        <p>O pagamento foi concluído e suas movimentações já foram atualizadas.</p>
        <button className="botao botao-principal" type="button" onClick={fechar}>Concluir</button>
      </div>
    )
  }

  return (
    <div className="fundo-modal-perfil" role="presentation" onMouseDown={fecharAoClicarFora}>
      <section className="modal-perfil modal-chave-pix modal-pagamento-pix" role="dialog" aria-modal="true" aria-labelledby="titulo-pagamento-pix">
        <header>
          <div><p>PAGAR COM PIX</p><h2 id="titulo-pagamento-pix">Enviar um Pix</h2><span>Transferência instantânea pela sua conta atual.</span></div>
          <button type="button" disabled={processando} onClick={fechar} aria-label="Fechar modal">×</button>
        </header>
        {conteudo}
      </section>
    </div>
  )
}
