export function transicionarFormulario(transicao) {
  document.activeElement?.blur()
  transicao()
  window.scrollTo(0, 0)
  window.requestAnimationFrame(() => window.scrollTo(0, 0))
}
