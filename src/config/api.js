export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'
export const FACE_API_URL =
  import.meta.env.VITE_FACE_API_URL ||
  'https://apps-arkhe-identity-api.ucxocw.easypanel.host'

// A criação de sessões biométricas exige um proxy no backend.
// Segredos de cliente nunca devem ser enviados para o navegador.
export const FACE_SESSION_API_URL =
  import.meta.env.VITE_FACE_SESSION_API_URL || ''
