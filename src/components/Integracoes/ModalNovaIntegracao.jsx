import { useEffect, useRef, useState } from 'react'
import { useModalAcessivel } from '../../hooks/useModalAcessivel.js'
import { criarIntegracao } from '../../services/integracoesService.js'
import './ModalNovaIntegracao.css'

const permissoes = [
  'Consultar dados da conta',
  'Consultar saldo',
  'Consultar movimentações',
  'Criar cobranças Pix',
  'Consultar status de cobranças Pix',
]

export default function ModalNovaIntegracao({ fechar }) {
  const [etapa, setEtapa] = useState('dados')
  const [nome, setNome] = useState('')
  const [credenciais, setCredenciais] = useState(null)
  const [copiado, setCopiado] = useState('')
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')
  const processandoRef = useRef(false)
  const temporizadorRef = useRef(null)

  function encerrar() {
    if (processandoRef.current) return
    setCredenciais(null)
    setCopiado('')
    fechar()
  }

  const { modalRef, fecharAoClicarFora } = useModalAcessivel(encerrar, processando)
  const nomeLimpo = nome.trim()

  useEffect(() => () => {
    if (temporizadorRef.current) clearTimeout(temporizadorRef.current)
  }, [])

  async function autorizar() {
    if (processandoRef.current || !nomeLimpo) return

    processandoRef.current = true
    setProcessando(true)
    setErro('')

    try {
      const resposta = await criarIntegracao(nomeLimpo)
      const clientId = String(resposta.client_id || '')
      const clientSecret = String(resposta.client_secret || '')

      if (!clientId || !clientSecret) {
        throw new Error('O servidor não retornou as credenciais completas. Tente criar uma nova integração.')
      }

      setCredenciais({
        nome: resposta.nome || nomeLimpo,
        clientId,
        clientSecret,
      })
      setEtapa('sucesso')
    } catch (falha) {
      setErro(falha.message || 'Não foi possível autorizar a integração.')
    } finally {
      processandoRef.current = false
      setProcessando(false)
    }
  }

  async function copiar(tipo, valor) {
    try {
      await navigator.clipboard.writeText(valor)
      setCopiado(tipo)
      if (temporizadorRef.current) clearTimeout(temporizadorRef.current)
      temporizadorRef.current = setTimeout(() => setCopiado(''), 1800)
    } catch {
      setErro('Não foi possível copiar a credencial. Selecione o texto e copie manualmente.')
    }
  }

  let titulo = 'Nova integração'
  let subtitulo = 'Identifique o sistema que será conectado à sua conta.'
  if (etapa === 'confirmacao') {
    titulo = 'Autorizar integração'
    subtitulo = 'Confira o sistema e os acessos atuais antes de continuar.'
  }
  if (etapa === 'sucesso') {
    titulo = 'Integração criada'
    subtitulo = 'Salve as credenciais antes de fechar esta tela.'
  }

  return (
    <div className="fundo-modal-perfil" role="presentation" onMouseDown={fecharAoClicarFora}>
      <section
        ref={modalRef}
        className="modal-perfil modal-nova-integracao"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-nova-integracao"
        tabIndex="-1"
      >
        <header>
          <div>
            <p>INTEGRAÇÕES E API</p>
            <h2 id="titulo-nova-integracao">{titulo}</h2>
            <span>{subtitulo}</span>
          </div>
          <button type="button" disabled={processando} onClick={encerrar} aria-label="Fechar modal">×</button>
        </header>

        {etapa !== 'sucesso' && (
          <p className="progresso-operacao" aria-label={`Etapa ${etapa === 'dados' ? 1 : 2} de 2`}>
            <span style={{ width: etapa === 'dados' ? '50%' : '100%' }} />
          </p>
        )}

        {etapa === 'dados' && (
          <form className="form-nova-integracao" onSubmit={(evento) => { evento.preventDefault(); if (nomeLimpo) setEtapa('confirmacao') }}>
            <label>
              <span>Nome da integração</span>
              <input
                autoFocus
                value={nome}
                onChange={(evento) => { setNome(evento.target.value); setErro('') }}
                placeholder="Ex.: Sistema do Salão"
                autoComplete="off"
                maxLength="100"
                required
              />
              <small>Use um nome que ajude sua empresa a reconhecer este sistema.</small>
            </label>

            <div className="vinculo-nova-integracao">
              <span aria-hidden="true">↗</span>
              <p><strong>Vinculada à conta empresarial</strong><small>Esta integração terá acesso aos recursos atuais da API Arkhé.</small></p>
            </div>

            <div className="permissoes-nova-integracao">
              <strong>A API permite atualmente</strong>
              <ul>{permissoes.map((permissao) => <li key={permissao}>{permissao}</li>)}</ul>
            </div>

            {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}

            <footer>
              <button className="botao botao-secundario" type="button" onClick={encerrar}>Cancelar</button>
              <button className="botao botao-principal" type="submit" disabled={!nomeLimpo}>Continuar</button>
            </footer>
          </form>
        )}

        {etapa === 'confirmacao' && (
          <div className="confirmacao-nova-integracao">
            <div className="nome-confirmacao-integracao"><small>NOME DA INTEGRAÇÃO</small><strong>{nomeLimpo}</strong></div>
            <div className="permissoes-nova-integracao">
              <strong>Permissões atuais</strong>
              <ul>{permissoes.map((permissao) => <li key={permissao}>{permissao}</li>)}</ul>
            </div>
            <p className="aviso-autorizacao-integracao"><strong>Você está autorizando um sistema externo.</strong> Compartilhe as credenciais somente com o responsável técnico da sua empresa.</p>
            {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}
            <footer>
              <button className="botao botao-secundario" type="button" disabled={processando} onClick={() => { setErro(''); setEtapa('dados') }}>Voltar</button>
              <button className="botao botao-principal" type="button" disabled={processando} onClick={autorizar}>
                {processando ? 'Autorizando...' : 'Autorizar integração'}
              </button>
            </footer>
          </div>
        )}

        {etapa === 'sucesso' && credenciais && (
          <div className="credenciais-integracao" role="status">
            <span className="icone-sucesso-integracao" aria-hidden="true">✓</span>
            <h3>Credenciais geradas</h3>
            <p className="nome-integracao-criada">{credenciais.nome}</p>

            <div className="aviso-secret-integracao" role="alert">
              <strong>Salve o Client Secret agora</strong>
              <span>Por segurança, ele não poderá ser exibido novamente.</span>
            </div>

            <div className="campo-credencial-integracao">
              <label htmlFor="client-id-integracao">Client ID</label>
              <div>
                <input id="client-id-integracao" value={credenciais.clientId} readOnly />
                <button type="button" aria-label="Copiar Client ID" onClick={() => copiar('id', credenciais.clientId)}>{copiado === 'id' ? 'Copiado' : 'Copiar'}</button>
              </div>
            </div>

            <div className="campo-credencial-integracao destaque">
              <label htmlFor="client-secret-integracao">Client Secret</label>
              <div>
                <input id="client-secret-integracao" value={credenciais.clientSecret} readOnly />
                <button type="button" aria-label="Copiar Client Secret" onClick={() => copiar('secret', credenciais.clientSecret)}>{copiado === 'secret' ? 'Copiado' : 'Copiar'}</button>
              </div>
            </div>

            {erro && <p className="mensagem-modal-perfil erro" role="alert">{erro}</p>}
            {copiado && <p className="feedback-copia-integracao" aria-live="polite">Credencial copiada.</p>}

            <footer><button className="botao botao-principal" type="button" onClick={encerrar}>Concluir</button></footer>
          </div>
        )}
      </section>
    </div>
  )
}
