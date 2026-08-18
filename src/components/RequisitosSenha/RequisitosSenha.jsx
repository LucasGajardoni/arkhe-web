import './RequisitosSenha.css'

const itens = [
  ['tamanho', 'Entre 8 e 12 caracteres'],
  ['maiuscula', 'Uma letra maiúscula'],
  ['minuscula', 'Uma letra minúscula'],
  ['numero', 'Um número'],
  ['especial', 'Um caractere especial'],
  ['semDadosPessoais', 'Não conter seus dados pessoais'],
]

export default function RequisitosSenha({ requisitos }) {
  return <div className="requisitos-senha" aria-live="polite"><strong>Sua senha precisa ter:</strong><ul>{itens.map(([chave, texto]) => <li className={requisitos[chave] ? 'requisito-atendido' : ''} key={chave}><span>{requisitos[chave] ? '✓' : '○'}</span> {texto}</li>)}</ul></div>
}
