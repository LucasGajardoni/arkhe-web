# Migração de identidade, contas e acessos

Implementação concluída no frontend. O backend foi consultado apenas para leitura. Nenhum commit ou push foi realizado.

## Comportamento implementado

- Login: CPF e PIN pessoal em `/login_usuario`, sem escolha PF/PJ. Após a face, uma segunda chamada cria a identidade autenticada. PIN temporário expirado tem mensagem específica.
- Biometria: reutiliza o scanner existente. Tenta verification; somente quando a API identifica ausência de biometria consulta `/verificar_usuario` e prepara enrollment. A consulta de dados ocorre depois da validação das credenciais.
- Primeiro acesso: `/primeiro-acesso` exige identidade, permite definir e confirmar o PIN pessoal de seis números, mostrar/ocultar os campos e continuar para o seletor sem selecionar uma conta automaticamente.
- Sessão: distingue usuário deslogado, identidade autenticada e conta selecionada. Restaura pelo cookie com `/sessao_usuario`, `/sessao` e `/contas_disponiveis`. Não grava tokens em storage. Logout limpa identidade e perfil.
- Perfil: preserva `idUsuario`, `idConta`, `idTitular`, `vinculo` e `cargo`. Dados empresariais vêm da conta; o nome da pessoa permanece separado. O perfil continua permitindo editar dados pessoais, sem expor edição empresarial ao delegado.
- Seleção e troca: `/selecionar-conta` lista contas próprias e delegadas, cargo, agência, número e empresa. Selecionar chama `/selecionar_conta` e depois `/sessao`. As páginas bancárias são remontadas por conta, evitando dados anteriores. Há troca no cabeçalho e perfil.
- Convites: aceitar é sempre uma ação explícita; recusar exige confirmação. Após responder, contas e convites são consultados novamente. Há estados de carregamento, erro, sucesso e ausência de contas.
- Equipe: `/dashboard/acessos` está disponível somente ao proprietário PJ, inclusive com bloqueio do acesso direto por delegado. Consulta CPF, reaproveita dados existentes ou pede nome/email/telefone de novos usuários, distingue vínculos existentes, permite convidar/reconvidar, reenviar, alterar cargo, bloquear, reativar e revogar. Bloqueio e revogação exigem confirmação; mutações atualizam a lista. O PIN temporário não é mostrado.
- Cadastro autenticado: usa `/contas_disponiveis` para oferecer somente tipos de conta própria ainda ausentes. PJ delegada não impede PJ própria. Cria pela rota `/adicionar_conta`, sem novo usuário ou novo PIN, e consulta `/sessao` depois. Uma falha nessa consulta pode ser repetida sem repetir a criação.
- Cadastro novo: mantém os fluxos PF/PJ e criação do PIN pessoal; envia `data_nascimento` do titular PF ou responsável PJ.
- Recuperação: usa email, código e novo PIN pessoal, sem tipo de conta.
- Navegação: mantém Pix, Extrato, Cobranças e API; adiciona Equipe para proprietários e troca de conta em desktop/mobile. Modais reutilizam o controle de foco, com correção de Shift+Tab no foco inicial.

## Arquivos criados

- `src/components/Cadastro/AberturaAutenticada.jsx`
- `src/components/Identidade/Confirmacao.jsx`
- `src/components/Identidade/Identidade.css`
- `src/components/Identidade/LayoutIdentidade.jsx`
- `src/components/ProtectedRoute/EstadoSessao.jsx`
- `src/components/ProtectedRoute/IdentityRoute.jsx`
- `src/pages/Acessos/Acessos.jsx`
- `src/pages/Acessos/Acessos.css`
- `src/pages/Acessos/ConvidarPessoa.jsx`
- `src/pages/PrimeiroAcesso/PrimeiroAcesso.jsx`
- `src/pages/SelecionarConta/SelecionarConta.jsx`
- `src/services/acessosService.js`
- `src/services/sessaoService.js`
- `src/utils/contas.js`
- `src/utils/perfil.js`
- `tests/migracao-identidade.mjs`
- `MIGRACAO_IDENTIDADE.md`

## Arquivos modificados

- `src/App.jsx`
- `src/components/Cadastro/EtapaAcesso.jsx`
- `src/components/Cadastro/RevisaoCadastro.jsx`
- `src/components/Dashboard/CabecalhoDashboard.jsx`
- `src/components/Dashboard/ModalPerfil.jsx`
- `src/components/Login/ConteudoLogin.jsx`
- `src/components/Login/CredenciaisLogin.jsx`
- `src/components/Login/ReconhecimentoLogin.jsx`
- `src/components/Login/RecuperacaoPin.jsx`
- `src/components/ModalTipoConta/ModalTipoConta.jsx`
- `src/components/ProtectedRoute/ProtectedRoute.jsx`
- `src/contexts/SessaoProvider.jsx`
- `src/hooks/useCadastro.js`
- `src/hooks/useLogin.js`
- `src/hooks/useModalAcessivel.js`
- `src/hooks/useRecuperacaoPin.js`
- `src/pages/Cadastro/Cadastro.jsx`
- `src/pages/Dashboard/Dashboard.css`
- `src/pages/EscolherConta/EscolherConta.jsx`
- `src/pages/Login/Login.jsx`
- `src/services/authService.js`
- `src/services/facialService.js`

## Modelo antigo removido

- Removido `src/components/Login/EscolhaTipoConta.jsx`.
- Removida a chamada à API `/login` e o envio de `tipo_conta` na autenticação.
- Removidas dependências de `tipoContaAutenticada` e `abrindoOutraConta`.
- Removidos PIN em `/adicionar_conta`, etapas de criação de PIN para usuário existente e tipo de conta na recuperação.
- Removida a seleção de conta apenas local, substituída pela sessão retornada pelo backend.

## Validação

- `npm run lint`: aprovado, sem erros. Executado por `npm.cmd` no PowerShell devido à política de execução de scripts.
- `npm run build`: aprovado, build de produção gerado.
- `tests/migracao-identidade.mjs`: 25/25 cenários aprovados no Edge headless, com APIs e scanner simulados.
- Os primeiros 16 cenários correspondem aos 16 solicitados. Os adicionais cobrem recusa com confirmação, mobile/logout, restauração após erro, FormData de nascimento PF/PJ e campos de identidade/perfil, PJ própria com acesso delegado, convite pendente sem duplicata, falha facial sem enrollment indevido, recuperação de sessão após criação sem duplicar conta e preservação de identidade quando a conta deixa de estar acessível.
- Capturas de seleção de conta e equipe no mobile foram inspecionadas; o problema de largura encontrado foi corrigido.
- Revisão de rotas antigas, PIN por conta, armazenamento de tokens, imports, credenciais das chamadas bancárias e diferenças de código realizada.

## Reexecutar os testes de navegador

Os testes usam Playwright instalado em uma pasta temporária, sem alterar as dependências do projeto. No PowerShell:

```powershell
npm.cmd install --prefix "$env:TEMP\arkhe-migration-checks" --no-audit --no-fund playwright
npm.cmd run dev -- --host 127.0.0.1
```

Em outro terminal na raiz do repositório:

```powershell
node tests/migracao-identidade.mjs
```

Por padrão usam Microsoft Edge e `http://127.0.0.1:5173`. É possível configurar `ARKHE_BROWSER`, `ARKHE_TEST_URL` e `ARKHE_TEST_TOOLS`. Capturas ficam em `%TEMP%\arkhe-migration-checks\artifacts`.

## Limites da validação

A integração com banco de dados real, envio real de emails, cookies/CORS do ambiente de implantação e reconhecimento por câmera real não foi exercitada. Os testes validam o frontend usando respostas simuladas dos contratos fornecidos e conferidos no backend local. Os contratos e componentes financeiros existentes foram preservados, mas não foram feitas transações reais de Pix/boletos nem validação completa de PDFs e integrações externas.
