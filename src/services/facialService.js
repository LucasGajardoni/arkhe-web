import { FACE_API_URL, FACE_CLIENT_ID, FACE_CLIENT_SECRET } from '../config/api.js'
import { somenteNumeros } from '../utils/formatadores.js'

const SDK_ID = 'arkhe-face-identity-sdk'

async function requisicaoFacial(caminho, dados, mensagemPadrao) {
  const resposta = await fetch(`${FACE_API_URL}${caminho}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Id': FACE_CLIENT_ID,
      'X-Client-Secret': FACE_CLIENT_SECRET,
    },
    body: JSON.stringify(dados),
  })
  let resultado = {}
  try {
    resultado = await resposta.json()
  } catch {
    // A mensagem padrão será usada quando a API não devolver JSON.
  }

  if (!resposta.ok) {
    const detalhe = resultado.detail?.message || resultado.detail
    const mensagem = typeof detalhe === 'string' ? detalhe : `${mensagemPadrao} (erro ${resposta.status}).`
    const erro = new Error(mensagem)
    erro.status = resposta.status
    erro.dados = resultado
    throw erro
  }

  return resultado
}

export function criarSessaoVerificacao(cpf) {
  return requisicaoFacial('/v1/verifications', {
    cpf: somenteNumeros(cpf),
    purpose: 'login',
    ttl_minutes: 10,
  }, 'Não foi possível iniciar o reconhecimento facial')
}

export function criarSessaoCadastro({ cpf, nome, email, telefone }) {
  return requisicaoFacial('/v1/enrollments', {
    cpf: somenteNumeros(cpf),
    display_name: nome,
    email,
    phone: somenteNumeros(telefone),
    consent: {
      accepted: true,
      version: 'arkhe-termos-v1',
      purpose: 'Cadastro e autenticação facial no Banco Arkhé',
    },
    ttl_minutes: 15,
  }, 'Não foi possível iniciar o cadastro facial')
}

export function carregarSdkFacial() {
  if (window.FaceIdentity) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const existente = document.getElementById(SDK_ID)
    if (existente) {
      existente.addEventListener('load', resolve, { once: true })
      existente.addEventListener('error', reject, { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = SDK_ID
    script.src = `${FACE_API_URL}/static/sdk/face-identity.js`
    script.onload = resolve
    script.onerror = () => reject(new Error('Não foi possível carregar o scanner facial.'))
    document.head.appendChild(script)
  })
}

export function criarScannerFacial(modo, opcoes) {
  const configuracao = { ...opcoes, baseUrl: FACE_API_URL }
  return modo === 'cadastro'
    ? window.FaceIdentity.enroll(configuracao)
    : window.FaceIdentity.verify(configuracao)
}
