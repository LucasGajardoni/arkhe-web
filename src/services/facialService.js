import { FACE_API_URL } from '../config/api.js'

const SDK_ID = 'arkhe-face-identity-sdk'

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

  if (modo === 'cadastro') return window.FaceIdentity.enroll(configuracao)

  return window.FaceIdentity.verify(configuracao)
}
