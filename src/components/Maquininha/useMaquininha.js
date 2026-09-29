import { useEffect, useRef, useState } from 'react'
import { comprarMaquininha, identificarCartaoMaquininha } from '../../services/maquininhaService.js'
import { SerialMaquininha } from './serialMaquininha.js'

const mensagens = {
  EMPRESA_NAO_AUTENTICADA: 'Sua sessão expirou. Entre novamente para continuar.',
  CONTA_NAO_PJ: 'Entre em uma conta PJ para realizar vendas.',
  UID_INVALIDO: 'Não foi possível ler este cartão. Aproxime-o novamente.',
  CARTAO_NAO_RECONHECIDO: 'Cartão não reconhecido.',
  CARTAO_BLOQUEADO: 'Este cartão está bloqueado.',
  DADOS_INVALIDOS: 'Confira os dados e tente novamente.',
  MODALIDADE_INDISPONIVEL: 'Esta modalidade está indisponível para este cartão.',
  PARCELAS_INVALIDAS: 'Escolha entre 1 e 12 parcelas.',
  LIMITE_INSUFICIENTE: 'Limite insuficiente para esta compra.',
  CONTA_INVALIDA: 'Não foi possível realizar esta venda.',
  PIN_INVALIDO: 'PIN incorreto. Tente novamente.',
  SALDO_INSUFICIENTE: 'Saldo insuficiente.',
  COMPRA_DUPLICADA: 'Uma compra com este mesmo valor já foi realizada neste estabelecimento nos últimos 5 minutos.',
  ERRO_INTERNO: 'Não foi possível processar o pagamento agora.',
}
const inicial = { etapa: 'PRONTA', conectada: false, conectando: false, aviso: '', mensagem: '', valor: 0, cartao: null, tipo: 'DEBITO', parcelas: 1 }

export function useMaquininha(aoPagamentoAprovado) {
  const [estado, setEstado] = useState(inicial)
  const acoes = useRef(null)
  const suportada = typeof navigator !== 'undefined' && 'serial' in navigator

  useEffect(() => {
    let ativa = true
    let conectada = false
    let ocupada = false
    let venda = null
    const atualizar = (dados) => { if (ativa) setEstado((anterior) => ({ ...anterior, ...dados })) }
    const vigente = (atual) => ativa && venda === atual

    function desconexao() {
      conectada = false
      // Uma compra enviada continua aguardando a resposta do banco mesmo sem USB.
      if (venda && ['AGUARDANDO_CARTAO', 'CARTAO_LIDO', 'AGUARDANDO_PIN'].includes(venda.etapa)) venda = null
      atualizar({ conectada: false, aviso: 'A conexão com a maquininha foi interrompida. Conecte-a novamente.',
        ...(venda ? {} : { etapa: 'PRONTA', cartao: null, valor: 0 }) })
    }
    const serial = suportada ? new SerialMaquininha(navigator.serial, receberLinha, desconexao) : null

    async function notificar(comando) {
      if (!conectada) return
      try { await serial.enviar(comando) } catch { /* O resultado do banco prevalece sobre a conexão USB. */ }
    }

    async function negar(atual, dados) {
      if (!vigente(atual)) return
      const codigo = Object.hasOwn(mensagens, dados?.codigo) ? dados.codigo : 'ERRO_INTERNO'
      atual.etapa = 'NEGADO'
      atual.uid = ''
      atualizar({ etapa: 'NEGADO', mensagem: mensagens[codigo] })
      await notificar(`NEGADO|${codigo}`)
    }

    async function receberLinha(linha) {
      if (linha === 'PRONTO') return // Confirmação do firmware; não reinicia uma venda em andamento.
      const atual = venda
      if (!atual || atual.etapa !== 'AGUARDANDO_CARTAO' || !linha.startsWith('CARTAO|')) return
      // O bloqueio é síncrono: até linhas repetidas no mesmo chunk são ignoradas.
      atual.etapa = 'CARTAO_LIDO'
      atual.uid = linha.slice(7).trim()
      atualizar({ etapa: 'CARTAO_LIDO' })
      if (!/^[\da-f]+$/i.test(atual.uid)) {
        await negar(atual, { codigo: 'UID_INVALIDO' })
        return
      }
      try {
        const resultado = await identificarCartaoMaquininha(atual.uid)
        if (!vigente(atual)) return
        if (resultado.cartao_encontrado !== true) return negar(atual, resultado)
        atual.cartao = {
          nome: typeof resultado.nome === 'string' ? resultado.nome : 'Cliente Arkhé',
          final: String(resultado.final_cartao ?? '').slice(-4).replace(/\D/g, ''),
        }
        atual.etapa = 'AGUARDANDO_PIN'
        atualizar({ etapa: atual.etapa, cartao: atual.cartao })
      } catch (erro) { await negar(atual, erro.dados) }
    }

    acoes.current = {
      async conectar() {
        if (!serial || ocupada || conectada || venda?.etapa === 'PROCESSANDO') return
        ocupada = true
        atualizar({ conectando: true, aviso: '' })
        try {
          conectada = await serial.conectar()
          atualizar({ conectada })
        } catch (erro) {
          atualizar({ aviso: erro.name === 'NotFoundError' ? '' : 'Não foi possível conectar. Confira o cabo e feche outros aplicativos que estejam usando a maquininha.' })
        } finally {
          ocupada = false
          atualizar({ conectando: false })
        }
      },
      async desconectar() {
        if (ocupada || venda) return
        ocupada = true
        conectada = false
        atualizar({ conectada: false, conectando: true })
        await serial.fechar()
        ocupada = false
        atualizar({ conectando: false })
      },
      async cobrar(centavos, tipo = 'DEBITO', parcelas = 1) {
        const modalidade = String(tipo).toUpperCase()
        const qtdParcelas = Number(parcelas)
        if (!conectada || ocupada || venda || !Number.isSafeInteger(centavos) || centavos <= 0 || centavos > 99999999
          || !['DEBITO', 'CREDITO'].includes(modalidade)
          || !Number.isInteger(qtdParcelas) || qtdParcelas < 1 || qtdParcelas > 12) return
        const atual = {
          valor: centavos / 100,
          tipo: modalidade,
          parcelas: modalidade === 'CREDITO' ? qtdParcelas : 1,
          etapa: 'AGUARDANDO_CARTAO',
          uid: '',
          cartao: null,
        }
        venda = atual
        atualizar({ etapa: atual.etapa, valor: atual.valor, tipo: atual.tipo, parcelas: atual.parcelas, cartao: null, mensagem: '', aviso: '' })
        try { await serial.enviar(`INICIAR|${atual.valor.toFixed(2)}|${atual.tipo}`) } catch { /* A desconexão atualiza a interface. */ }
      },
      async cancelar() {
        if (!venda || venda.etapa === 'PROCESSANDO' || ocupada) return
        venda = null // Invalida respostas de identificação que chegarem após cancelar.
        ocupada = true
        atualizar({ etapa: 'CANCELANDO', cartao: null })
        await notificar('CANCELAR')
        ocupada = false
        atualizar({ etapa: 'PRONTA', valor: 0, tipo: 'DEBITO', parcelas: 1, mensagem: '' })
      },
      async confirmar(pin) {
        const atual = venda
        if (!atual || atual.etapa !== 'AGUARDANDO_PIN' || !/^\d{6}$/.test(pin) || !conectada) return
        atual.etapa = 'PROCESSANDO'
        atualizar({ etapa: 'PROCESSANDO' })
        try {
          await serial.enviar('PROCESSANDO')
        } catch {
          if (vigente(atual)) {
            venda = null
            atualizar({ etapa: 'PRONTA', cartao: null, valor: 0, tipo: 'DEBITO', parcelas: 1 })
          }
          return
        }
        if (!vigente(atual)) return
        try {
          const requisicao = comprarMaquininha({
            uid: atual.uid,
            pin,
            valor: atual.valor,
            tipo: atual.tipo,
            parcelas: atual.parcelas,
          })
          // Descarta a referência antes de aguardar a resposta; o modal já foi desmontado.
          pin = ''
          const resultado = await requisicao
          if (!vigente(atual)) return
          if (resultado.aprovado === true) {
            atual.etapa = 'APROVADO'
            atual.uid = ''
            atualizar({ etapa: 'APROVADO' })
            // Atualização da dashboard e sinalização USB não alteram uma aprovação.
            Promise.resolve().then(() => aoPagamentoAprovado?.()).catch(() => {})
            await notificar(`APROVADO|${atual.valor.toFixed(2)}`)
          } else {
            await negar(atual, resultado)
          }
        } catch (erro) {
          if (!vigente(atual)) return
          if (erro.dados?.codigo) await negar(atual, erro.dados)
          else {
            atual.etapa = 'INCERTO'
            atual.uid = ''
            atualizar({ etapa: 'INCERTO', mensagem: 'Não foi possível confirmar o resultado. Confira o extrato antes de iniciar outra venda para evitar uma cobrança duplicada.' })
          }
        }
      },
      novaVenda() {
        if (ocupada || !['APROVADO', 'NEGADO', 'INCERTO'].includes(venda?.etapa)) return
        venda = null
        atualizar({ etapa: 'PRONTA', valor: 0, tipo: 'DEBITO', parcelas: 1, cartao: null, mensagem: '' })
      },
    }
    return () => {
      ativa = false
      venda = null
      acoes.current = null
      void serial?.encerrar()
    }
  }, [suportada, aoPagamentoAprovado])

  return { ...estado, suportada,
    conectar: () => acoes.current?.conectar(),
    desconectar: () => acoes.current?.desconectar(),
    cobrar: (valor, tipo, parcelas) => acoes.current?.cobrar(valor, tipo, parcelas),
    cancelar: () => acoes.current?.cancelar(),
    confirmar: (pin) => acoes.current?.confirmar(pin),
    novaVenda: () => acoes.current?.novaVenda(),
  }
}
