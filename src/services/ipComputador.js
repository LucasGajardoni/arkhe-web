export async function registrarIpComputador(ip, apiUrl) {
  const resposta = await fetch(`${apiUrl}/ip_computador`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ip }),
    signal: AbortSignal.timeout(10000),
  })
  return resposta.ok
}
