# Banco Arkhé — Frontend

Interface web de uma plataforma bancária acadêmica, desenvolvida para exercitar
produto, UI/UX, autenticação, integração com APIs e fluxos para contas de pessoa
física e jurídica.

> Projeto educacional e fictício. Não representa uma instituição financeira
> nem deve ser usado com dados reais.

![Prévia do Banco Arkhé](src/assets/arkhe-app-preview.png)

## Funcionalidades

- Landing page responsiva e apresentação do ecossistema de produtos.
- Cadastro guiado em etapas para contas PF e PJ.
- Login, recuperação de senha e dashboard do cliente.
- Validação e formatação de CPF, CNPJ, telefone, CEP e senha.
- Integração com backend por API.
- Fluxo preparado para cadastro e verificação facial.

## Tecnologias

- React 19
- React Router
- JavaScript
- Vite
- CSS responsivo
- ESLint

## Arquitetura relacionada

- **Frontend:** este repositório.
- **Backend bancário:** [GPontin78/back_arkche](https://github.com/GPontin78/back_arkche).
- **Identidade facial:** [LucasGajardoni/arkhe-identity-api](https://github.com/LucasGajardoni/arkhe-identity-api).

A criação de sessões biométricas deve passar por um proxy seguro no backend.
Segredos de cliente não são armazenados nem enviados pelo código do navegador.

## Como executar

Requisitos: Node.js compatível com Vite 8 e os backends usados pela aplicação.

```bash
git clone https://github.com/LucasGajardoni/arkhe-web.git
cd arkhe-web
npm install
cp .env.example .env
npm run dev
```

No Windows PowerShell, use `Copy-Item .env.example .env` no lugar de `cp`.

Variáveis disponíveis:

```env
VITE_API_URL=http://127.0.0.1:5000
VITE_FACE_API_URL=http://127.0.0.1:8000
VITE_FACE_SESSION_API_URL=
```

Sem `VITE_FACE_SESSION_API_URL`, a criação de sessões faciais fica
intencionalmente desativada. Configure somente a URL de um proxy de backend;
nunca coloque segredos em variáveis `VITE_*`, pois elas ficam públicas no
bundle.

## Verificação

```bash
npm run lint
npm run build
```

## Status

Projeto acadêmico em evolução. A interface principal, os fluxos de
cadastro/login e a integração com o backend estão implementados; os serviços
externos ainda exigem configuração local e validação integrada.
