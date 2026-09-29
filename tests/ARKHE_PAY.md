# Validação do Arkhé Pay

O módulo aparece exclusivamente na Dashboard PJ, logo abaixo do cartão. A PF
continua com o panorama mensal. Não há alteração no backend ou nos contratos.

## Teste com a maquininha

1. Abra o frontend em Chrome ou Edge no computador, em HTTPS ou localhost,
   e entre em uma conta PJ. Feche outros programas que estejam usando a porta USB.
2. Clique em **Conectar maquininha** e selecione a ESP32. A porta abre a 115200 baud.
3. Digite `1000` no valor ou no teclado visual: o resultado é **R$ 10,00**.
4. Escolha **Débito** ou **Crédito**. No crédito, selecione de 1x a 12x. Ao clicar em
   **Cobrar**, a maquininha recebe `INICIAR|10.00|DEBITO\n` ou
   `INICIAR|10.00|CREDITO\n`.
5. Aproxime o cartão. `PRONTO` é reconhecido sem reiniciar a venda. A linha
   `CARTAO|UID` inicia a identificação, inclusive quando recebida em fragmentos.
6. Confira nome e final do cartão no modal e informe o PIN de seis dígitos.
   A maquininha recebe `PROCESSANDO\n`; o PIN segue exclusivamente para a API.
7. Confirme o resultado na tela e no dispositivo. A aprovação envia
   `APROVADO|10.00\n` e atualiza saldo/movimentações. Uma recusa conhecida envia
   `NEGADO|CODIGO\n` e apresenta uma mensagem amigável.
8. Clique em **Nova venda**: valor e dados da venda são limpos, mantendo a conexão.
9. Teste também PIN incorreto, saldo insuficiente, cartão bloqueado ou desconhecido,
   cancelamento, clique duplo, retirada do cabo e navegação para outra página.
   Depois de desconectar ou sair, confira que outro aplicativo consegue abrir a COM.
10. Entre em uma PF e confirme que o panorama continua no lugar do Arkhé Pay.

## Automação

Com o Vite ativo (`npm.cmd run dev -- --host 127.0.0.1`), execute:

```sh
node tests/maquininha.mjs
npm.cmd run lint
npm.cmd run build
```

A suíte reutiliza o Playwright externo das suítes existentes, sem dependências
novas no projeto. O diretório padrão é `%TEMP%/arkhe-migration-checks`; a variável
`ARKHE_TEST_TOOLS` permite apontar outro diretório com Playwright instalado.
`ARKHE_BROWSER` escolhe o navegador (padrão `msedge`) e `ARKHE_TEST_URL` altera
o endereço do frontend (padrão `http://127.0.0.1:5173`).

São 35 cenários com API e Web Serial simuladas, cobrindo os contratos enviados,
cookies, comandos e sua ordem, fragmentos, duplicação, erros, limpeza dos streams,
respostas atrasadas, PIN, cancelamento, ausência de Web Serial e responsividade
em 320, 390, 650, 900 e 1440 px. As capturas ficam em
`%TEMP%/arkhe-migration-checks/maquininha`.

## Limitações verificadas

- É necessário validar a comunicação final com a ESP32 e o backend reais;
  a automação não substitui o teste físico.
- A entrada aceita até R$ 999.999,99. Débito usa saldo; crédito valida o limite
  disponível e aceita de 1x a 12x. Nesta etapa, a compra no crédito cria
  COMPRA/FATURA_COMPRA, mas não movimenta o saldo da conta do comprador nem faz
  o repasse ao estabelecimento; esse acerto pertence ao fluxo de fatura/repasse.
- Para repetir um PIN recusado, inicie uma nova venda e aproxime o cartão novamente.
- Se a conexão USB cair durante uma compra já enviada, a tela continua aguardando
  o banco. Uma aprovação não é convertida em recusa porque a notificação USB falhou.
- Se a API não confirmar o resultado de uma compra, a tela orienta conferir o
  extrato antes de outra venda. Não há reenvio automático. O contrato fornecido
  não contém consulta de status nem chave de idempotência para reconciliar
  uma resposta perdida ou uma compra após o fechamento da página.
- O build já apresentava aviso de bundle maior que 500 kB: a versão anterior,
  sem Arkhé Pay, gera um chunk principal de 542.806 bytes.
- A suíte existente `tests/cartao.mjs` passa em 17 de 18 cenários tanto antes
  quanto depois desta alteração. O teste de geração espera vencimento dia 10,
  enquanto a regra atual de três dias úteis sugere dia 7. Cartão e teste existente
  foram preservados por estarem fora deste escopo.
