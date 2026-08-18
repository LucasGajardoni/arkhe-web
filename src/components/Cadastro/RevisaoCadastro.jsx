import { formatarDataBrasileira } from '../../utils/formatadores.js'

function BlocoRevisao({ titulo, itens, editar }) {
  return <section className="bloco-revisao"><div className="topo-revisao"><h3>{titulo}</h3><button type="button" onClick={editar}>Editar</button></div><dl>{itens.filter((item) => item[1]).map(([nome, valor]) => <div key={nome}><dt>{nome}</dt><dd>{valor}</dd></div>)}</dl></section>
}

export default function RevisaoCadastro({ empresarial, dadosPF, dadosPJ, dadosAtuais, editarEtapa }) {
  return <div className="revisao-cadastro">
    {empresarial && <BlocoRevisao titulo="Dados da empresa" itens={[["CNPJ", dadosPJ.cnpj], ['Razão social', dadosPJ.razaoSocial], ['Nome fantasia', dadosPJ.nomeFantasia]]} editar={() => editarEtapa(0)} />}
    <BlocoRevisao titulo={empresarial ? 'Responsável' : 'Dados pessoais'} itens={empresarial ? [['Nome', dadosPJ.nomeResponsavel], ['CPF', dadosPJ.cpfResponsavel], ['Nascimento', formatarDataBrasileira(dadosPJ.dataNascimentoResponsavel)]] : [['Nome', dadosPF.nome], ['CPF', dadosPF.cpf], ['Nascimento', formatarDataBrasileira(dadosPF.dataNascimento)]]} editar={() => editarEtapa(empresarial ? 1 : 0)} />
    <BlocoRevisao titulo="Contato" itens={empresarial ? [['E-mail', dadosPJ.emailEmpresarial], ['Telefone', dadosPJ.telefoneEmpresarial]] : [['E-mail', dadosPF.email], ['Telefone', dadosPF.telefone]]} editar={() => editarEtapa(empresarial ? 2 : 1)} />
    <BlocoRevisao titulo="Endereço" itens={[["CEP", dadosAtuais.cep], ['Logradouro', `${dadosAtuais.logradouro}, ${dadosAtuais.numero}`], ['Complemento', dadosAtuais.complemento], ['Bairro', dadosAtuais.bairro], ['Cidade/Estado', `${dadosAtuais.cidade} - ${dadosAtuais.estado}`]]} editar={() => editarEtapa(empresarial ? 3 : 2)} />
    <BlocoRevisao titulo="Acesso" itens={[["Status", 'Senha de acesso criada']]} editar={() => editarEtapa(empresarial ? 4 : 3)} />
  </div>
}
