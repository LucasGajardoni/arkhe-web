import { formatarDataBrasileira, mascaraCnpjParcial, mascaraCpfParcial } from '../../utils/formatadores.js'

function BlocoRevisao({ titulo, itens, editar }) {
  const itensPreenchidos = itens.filter((item) => item[1])

  return (
    <section className="bloco-revisao">
      <div className="topo-revisao">
        <h3>{titulo}</h3>
        <button type="button" onClick={editar}>Editar</button>
      </div>
      <dl>
        {itensPreenchidos.map(([nome, valor]) => (
          <div key={nome}>
            <dt>{nome}</dt>
            <dd>{valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function RevisaoContaExistente({ empresarial, dadosPJ, editarEtapa }) {
  let blocoEmpresa = null
  let etapaAcesso = 0
  let tipoConta = 'Pessoa Física'

  if (empresarial) {
    etapaAcesso = 1
    tipoConta = 'Pessoa Jurídica'
    blocoEmpresa = (
      <BlocoRevisao
        titulo="Dados da nova empresa"
        itens={[
          ['CNPJ', mascaraCnpjParcial(dadosPJ.cnpj)],
          ['Razão social', dadosPJ.razaoSocial],
          ['Nome fantasia', dadosPJ.nomeFantasia],
        ]}
        editar={() => editarEtapa(0)}
      />
    )
  }

  return (
    <div className="revisao-cadastro">
      {blocoEmpresa}
      <BlocoRevisao
        titulo="Nova conta"
        itens={[
          ['Tipo', tipoConta],
          ['PIN', '••••••'],
        ]}
        editar={() => editarEtapa(etapaAcesso)}
      />
    </div>
  )
}

export default function RevisaoCadastro({
  empresarial,
  clienteExistente,
  dadosPF,
  dadosPJ,
  dadosAtuais,
  editarEtapa,
}) {
  if (clienteExistente) {
    return (
      <RevisaoContaExistente
        empresarial={empresarial}
        dadosPJ={dadosPJ}
        editarEtapa={editarEtapa}
      />
    )
  }

  let tituloDados = 'Dados pessoais'
  let etapaDados = 0
  let etapaContato = 1
  let etapaEndereco = 2
  let etapaAcesso = 3
  let itensDados = [
    ['Nome', dadosPF.nome],
    ['CPF', mascaraCpfParcial(dadosPF.cpf)],
    ['Nascimento', formatarDataBrasileira(dadosPF.dataNascimento)],
  ]
  let itensContato = [
    ['E-mail', dadosPF.email],
    ['Telefone', dadosPF.telefone],
  ]
  let blocoEmpresa = null

  if (empresarial) {
    tituloDados = 'Responsável'
    etapaDados = 1
    etapaContato = 2
    etapaEndereco = 3
    etapaAcesso = 4
    itensDados = [
      ['Nome', dadosPJ.nomeResponsavel],
      ['CPF', mascaraCpfParcial(dadosPJ.cpfResponsavel)],
      ['Nascimento', formatarDataBrasileira(dadosPJ.dataNascimentoResponsavel)],
    ]
    itensContato = [
      ['E-mail', dadosPJ.emailEmpresarial],
      ['Telefone', dadosPJ.telefoneEmpresarial],
    ]
    blocoEmpresa = (
      <BlocoRevisao
        titulo="Dados da empresa"
        itens={[
          ['CNPJ', mascaraCnpjParcial(dadosPJ.cnpj)],
          ['Razão social', dadosPJ.razaoSocial],
          ['Nome fantasia', dadosPJ.nomeFantasia],
        ]}
        editar={() => editarEtapa(0)}
      />
    )
  }

  const itensEndereco = [
    ['CEP', dadosAtuais.cep],
    ['Logradouro', `${dadosAtuais.logradouro}, ${dadosAtuais.numero}`],
    ['Complemento', dadosAtuais.complemento],
    ['Bairro', dadosAtuais.bairro],
    ['Cidade/Estado', `${dadosAtuais.cidade} - ${dadosAtuais.estado}`],
  ]

  return (
    <div className="revisao-cadastro">
      {blocoEmpresa}
      <BlocoRevisao titulo={tituloDados} itens={itensDados} editar={() => editarEtapa(etapaDados)} />
      <BlocoRevisao titulo="Contato" itens={itensContato} editar={() => editarEtapa(etapaContato)} />
      <BlocoRevisao titulo="Endereço" itens={itensEndereco} editar={() => editarEtapa(etapaEndereco)} />
      <BlocoRevisao
        titulo="Acesso"
        itens={[['Status', 'PIN de acesso criado']]}
        editar={() => editarEtapa(etapaAcesso)}
      />
    </div>
  )
}
