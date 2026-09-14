import { useEffect, useRef } from 'react'

const seletorFoco = [
  'button:not(:disabled)',
  'a[href]',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function useModalAcessivel(fechar, bloqueado = false) {
  const modalRef = useRef(null)
  const fecharRef = useRef(fechar)
  const bloqueadoRef = useRef(bloqueado)

  useEffect(() => {
    fecharRef.current = fechar
  }, [fechar])

  useEffect(() => {
    bloqueadoRef.current = bloqueado
  }, [bloqueado])

  useEffect(() => {
    const elementoAnterior = document.activeElement
    const overflowAnterior = document.body.style.overflow
    const modal = modalRef.current

    document.body.style.overflow = 'hidden'
    window.requestAnimationFrame(() => modal?.focus())

    function tratarTecla(evento) {
      if (evento.key === 'Escape' && !bloqueadoRef.current) {
        fecharRef.current()
        return
      }

      if (evento.key !== 'Tab' || !modalRef.current) return

      const focaveis = [...modalRef.current.querySelectorAll(seletorFoco)]
      if (focaveis.length === 0) {
        evento.preventDefault()
        modalRef.current.focus()
        return
      }

      const primeiro = focaveis[0]
      const ultimo = focaveis[focaveis.length - 1]

      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault()
        ultimo.focus()
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault()
        primeiro.focus()
      }
    }

    document.addEventListener('keydown', tratarTecla)

    return () => {
      document.removeEventListener('keydown', tratarTecla)
      document.body.style.overflow = overflowAnterior
      if (elementoAnterior instanceof HTMLElement) elementoAnterior.focus()
    }
  }, [])

  function fecharAoClicarFora(evento) {
    if (evento.target === evento.currentTarget && !bloqueadoRef.current) fecharRef.current()
  }

  return { modalRef, fecharAoClicarFora }
}
