// Uma sessão possui seus próprios streams e tarefa de leitura. Fechá-la também
// aguarda a abertura pendente, para não deixar a porta presa ao sair da página.
export class SerialMaquininha {
  constructor(serial, aoLinha, aoDesconectar) {
    this.serial = serial
    this.aoLinha = aoLinha
    this.aoDesconectar = aoDesconectar
    this.encerrada = false
    this.conectando = false
    this.sessao = null
    this.desconexao = (evento) => {
      if ((evento.port || evento.target) === this.sessao?.porta) this.perderConexao(this.sessao)
    }
    serial.addEventListener('disconnect', this.desconexao)
  }

  async conectar() {
    if (this.encerrada || this.conectando || this.sessao) return false
    this.conectando = true
    try {
      // Antes do primeiro await: preserva a ativação do clique do usuário.
      const porta = await this.serial.requestPort()
      if (this.encerrada) return false
      const sessao = { porta, fechando: false, fila: Promise.resolve() }
      this.sessao = sessao
      try {
        sessao.abertura = porta.open({ baudRate: 115200 })
        await sessao.abertura
        if (this.encerrada || sessao.fechando) {
          await this.fechar(sessao)
          return false
        }
        sessao.reader = porta.readable.getReader()
        sessao.writer = porta.writable.getWriter()
        sessao.leitura = this.ler(sessao)
        return true
      } catch (erro) {
        await this.fechar(sessao)
        throw erro
      }
    } finally {
      this.conectando = false
    }
  }

  async ler(sessao) {
    const decoder = new TextDecoder()
    let buffer = ''
    try {
      while (!sessao.fechando) {
        const { value, done } = await sessao.reader.read()
        if (done || sessao.fechando) break
        buffer += decoder.decode(value, { stream: true })
        let fim
        while ((fim = buffer.indexOf('\n')) !== -1) {
          const linha = buffer.slice(0, fim).replace(/\r/g, '').trim()
          buffer = buffer.slice(fim + 1)
          if (linha && !sessao.fechando) this.aoLinha(linha)
        }
        // Firmware inesperado não pode acumular memória indefinidamente.
        if (buffer.length > 4096) throw new Error('Linha serial inválida')
      }
    } catch {
      // Falhas de leitura são tratadas como desconexão, sem expor dados.
    } finally {
      sessao.reader.releaseLock()
      sessao.reader = null
      if (!sessao.fechando) this.perderConexao(sessao)
    }
  }

  enviar(comando) {
    const sessao = this.sessao
    if (!sessao?.writer || sessao.fechando || /[\r\n]/.test(comando)) {
      return Promise.reject(new Error('Maquininha indisponível'))
    }
    const envio = sessao.fila.then(async () => {
      if (sessao.fechando) throw new Error('Maquininha indisponível')
      await sessao.writer.write(new TextEncoder().encode(`${comando}\n`))
    })
    sessao.fila = envio.catch(() => {})
    return envio.catch((erro) => {
      this.perderConexao(sessao)
      throw erro
    })
  }

  perderConexao(sessao) {
    if (sessao.fechando) return
    this.aoDesconectar()
    void this.fechar(sessao)
  }

  fechar(sessao = this.sessao) {
    if (!sessao) return Promise.resolve()
    if (sessao.limpeza) return sessao.limpeza
    sessao.fechando = true
    sessao.limpeza = (async () => {
      try { await sessao.abertura } catch { /* Porta não chegou a abrir. */ }
      await Promise.allSettled([
        sessao.reader?.cancel(),
        sessao.writer?.abort(),
      ])
      await sessao.leitura
      // Também cobre uma falha ao obter o writer, antes de iniciar o loop.
      sessao.reader?.releaseLock()
      sessao.reader = null
      await sessao.fila
      sessao.writer?.releaseLock()
      sessao.writer = null
      try { await sessao.porta.close() } catch { /* Remoção física ou falha na abertura. */ }
      if (this.sessao === sessao) this.sessao = null
    })()
    return sessao.limpeza
  }

  encerrar() {
    this.encerrada = true
    this.serial.removeEventListener('disconnect', this.desconexao)
    return this.fechar()
  }
}
