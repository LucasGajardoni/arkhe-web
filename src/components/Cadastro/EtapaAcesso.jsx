import Campo from './CampoFormulario.jsx'
import RequisitosSenha from '../RequisitosSenha/RequisitosSenha.jsx'
import { requisitosDaSenha } from '../../utils/validadores.js'

export default function EtapaAcesso({ empresarial, dadosPF, dadosPJ, dadosAtuais, dadosValidacao, alterar, mostrarSenha, alternarSenha }) {
  const requisitos = requisitosDaSenha(dadosValidacao)

  return (
    <>
      <div className="grade-formulario">
        <Campo nome="senha" rotulo="Senha" valor={dadosAtuais.senha} alterar={alterar} tipo={mostrarSenha ? 'text' : 'password'} autocomplete="new-password" />
        <Campo nome="confirmarSenha" rotulo="Confirmar senha" valor={dadosAtuais.confirmarSenha} alterar={alterar} tipo={mostrarSenha ? 'text' : 'password'} autocomplete="new-password" erro={dadosAtuais.confirmarSenha && dadosAtuais.senha !== dadosAtuais.confirmarSenha ? 'As senhas não são iguais.' : ''} />
      </div>
      <RequisitosSenha requisitos={requisitos} />
      <button className="mostrar-senha" type="button" onClick={alternarSenha}>{mostrarSenha ? 'Ocultar senhas' : 'Mostrar senhas'}</button>
      <div className="consentimentos">
        <label><input name="aceitarTermos" type="checkbox" checked={dadosAtuais.aceitarTermos} onChange={alterar} /> Li e aceito os termos de uso do projeto acadêmico.</label>
        {empresarial ? <>
          <label><input name="aceitarDadosPessoais" type="checkbox" checked={dadosPJ.aceitarDadosPessoais} onChange={alterar} /> Autorizo o tratamento dos dados pessoais nesta simulação.</label>
          <label><input name="aceitarDadosEmpresariais" type="checkbox" checked={dadosPJ.aceitarDadosEmpresariais} onChange={alterar} /> Autorizo o tratamento dos dados empresariais nesta simulação.</label>
        </> : <label><input name="aceitarDados" type="checkbox" checked={dadosPF.aceitarDados} onChange={alterar} /> Autorizo o tratamento dos meus dados pessoais para esta simulação.</label>}
        <label><input name="aceitarBiometria" type="checkbox" checked={dadosAtuais.aceitarBiometria} onChange={alterar} /> Autorizo o cadastro e o uso do meu rosto para autenticação.</label>
      </div>
      <p className="aviso-simulacao">Este projeto é acadêmico e não representa uma instituição financeira real.</p>
    </>
  )
}
