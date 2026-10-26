import { useState } from 'react'

const moedaBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2,
})

function valorParaApi(texto) {
  const limpo = String(texto || '').replace(/[^0-9,.]/g, '')
  if (!limpo) return ''
  let resultado
  if (limpo.includes(',')) {
    resultado = limpo.replace(/\./g, '').replace(',', '.')
  } else if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) {
    resultado = limpo.replace(/\./g, '')
  } else {
    resultado = limpo
  }
  if (!/^\d+(\.\d{0,2})?$/.test(resultado)) return ''
  const valor = Number(resultado)
  return Number.isFinite(valor) && valor > 0 ? valor.toFixed(2) : ''
}

function exibirMoeda(valor) {
  if (valor === '' || valor == null) return ''
  const numero = Number(valor)
  return Number.isFinite(numero) ? moedaBRL.format(numero) : ''
}

function numeroEditavel(valor) {
  if (valor === '' || valor == null) return ''
  const numero = Number(valor)
  return Number.isFinite(numero)
    ? numero.toLocaleString('pt-BR', { useGrouping: false, minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : ''
}

export default function CampoMoeda({ value, onChange, maxValue, minValue = 0.01, required = false, disabled = false, placeholder = 'R$ 5.000,00', ...props }) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState('')
  const numero = value === '' || value == null ? null : Number(value)
  const excede = numero !== null && Number.isFinite(numero) && maxValue != null && numero > Number(maxValue)
  const insuficiente = numero !== null && Number.isFinite(numero) && numero < Number(minValue)
  const invalido = excede || insuficiente

  return <>
    <input
      {...props}
      className={['campo-moeda', props.className].filter(Boolean).join(' ')}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      disabled={disabled}
      required={required}
      placeholder={placeholder}
      aria-invalid={invalido || undefined}
      value={editando ? texto : exibirMoeda(value)}
      onFocus={(evento) => { setTexto(numeroEditavel(value)); setEditando(true); evento.target.select() }}
      onChange={(evento) => {
        const novoTexto = evento.target.value
        setTexto(novoTexto)
        if (novoTexto.trim() === '') {
          onChange('')
        } else {
          const normalizado = valorParaApi(novoTexto)
          if (normalizado) onChange(normalizado)
        }
      }}
      onBlur={() => { setEditando(false); setTexto('') }}
    />
    {excede && <small role="alert" className="erro-teto-campo">O teto permitido é {exibirMoeda(maxValue)}.</small>}
    {insuficiente && <small role="alert" className="erro-teto-campo">O valor mínimo é {exibirMoeda(minValue)}.</small>}
  </>
}
