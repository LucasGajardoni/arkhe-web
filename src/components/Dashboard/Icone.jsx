const caminhos = {
  inicio: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
  pix: <><path d="m12 2 4.2 4.2a3 3 0 0 1 0 4.2L12 14.6 7.8 10.4a3 3 0 0 1 0-4.2L12 2Z"/><path d="m12 9.4 4.2 4.2a3 3 0 0 1 0 4.2L12 22l-4.2-4.2a3 3 0 0 1 0-4.2L12 9.4Z"/></>,
  transferir: <><path d="M7 7h11l-3-3"/><path d="m18 7-3 3"/><path d="M17 17H6l3 3"/><path d="m6 17 3-3"/></>,
  cartao: <><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18"/><path d="M7 15h3"/></>,
  extrato: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/></>,
  olho: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></>,
  sino: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
  sair: <><path d="M10 5H5v14h5"/><path d="m14 8 4 4-4 4M18 12H9"/></>,
  seta: <><path d="m9 18 6-6-6-6"/></>,
  mais: <><path d="M12 5v14M5 12h14"/></>,
  setaCima: <><path d="M12 19V5M6 11l6-6 6 6"/></>,
  setaBaixo: <><path d="M12 5v14M18 13l-6 6-6-6"/></>,
  chave: <><circle cx="8" cy="15" r="4"/><path d="m11 12 8-8M15 8l3 3M17 6l2 2"/></>,
}

export default function Icone({ nome, tamanho = 22 }) {
  return <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{caminhos[nome]}</svg>
}
