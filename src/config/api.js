const env = import.meta.env

export const API_URL = env.VITE_API_URL || 'http://localhost:5000'
export const FACE_API_URL = env.VITE_FACE_API_URL || 'https://apps-arkhe-identity-api.ucxocw.easypanel.host'
