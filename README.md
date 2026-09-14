# Desenvolvimento de Pessoas

Aplicação web para trilhas de aprendizagem e feedback contínuo, com três papéis: **Colaborador**, **Gestor** e **RH**.

## Funcionalidades

- **Catálogo de trilhas**: trilhas de aprendizagem organizadas por categoria/nível, com módulos e competências associadas.
- **Progresso individual**: inscrição em trilhas, conclusão de módulos e acompanhamento de percentual concluído.
- **Feedback contínuo**: envio de elogios, feedback construtivo e registro de check-ins 1:1 (gestor ↔ liderado).
- **Visão de equipe** (Gestor/RH): progresso agregado dos liderados e histórico de feedback por pessoa.
- **Painel organizacional** (RH): métricas gerais, taxa de conclusão e trilhas mais populares.
- **Administração** (RH): CRUD de usuários e de trilhas/módulos.

## Stack

- **Backend**: Node.js + Express + TypeScript, Prisma ORM sobre PostgreSQL, autenticação via JWT. Em produção roda como Serverless Function (`api/index.ts`).
- **Frontend**: React + Vite + TypeScript, React Router, Tailwind CSS.

## Estrutura

```
server/       API REST (Express + Prisma) — código-fonte do backend
api/index.ts  Serverless Function da Vercel que expõe server/src/app.ts em produção
client/       SPA React (Vite)
vercel.json   Config de build/roteamento para deploy 100% na Vercel
```

## Como rodar localmente

Pré-requisitos: Node.js 18+ e um PostgreSQL rodando localmente (ou uma connection string de um Postgres gratuito, ex. Neon/Vercel Storage).

```bash
# 1. Instalar dependências (na raiz, usa npm workspaces)
npm install

# 2. Configurar variáveis de ambiente do backend
cp server/.env.example server/.env
# edite server/.env e ajuste DATABASE_URL para o seu Postgres local

# 3. Criar as tabelas (roda as migrations do Prisma)
npm run db:migrate

# 4. Popular o banco com dados de exemplo (usuários, trilhas, feedbacks)
npm run db:seed

# 5. Subir backend (porta 4000) e frontend (porta 5173) juntos
npm run dev
```

Acesse `http://localhost:5173`.

### Deploy (link público)

Veja [DEPLOY.md](./DEPLOY.md) para o passo a passo de deploy gratuito,
tudo em um único projeto Vercel (frontend estático + backend como
Serverless Function + Postgres).

### Usuários de demonstração

Senha para todos: `senha123`

| Papel      | Email                        |
|------------|------------------------------|
| RH         | rh@empresa.com               |
| Gestor     | carlos.gestor@empresa.com    |
| Gestor     | fernanda.gestor@empresa.com  |
| Colaborador| ana.rocha@empresa.com        |
| Colaborador| bruno.alves@empresa.com      |
| Colaborador| camila.torres@empresa.com    |
| Colaborador| diego.ferreira@empresa.com   |
| Colaborador| elisa.martins@empresa.com    |
| Colaborador| felipe.costa@empresa.com     |

A tela de login tem atalhos para preencher o email desses usuários automaticamente.

## Modelo de permissões

- **Colaborador**: vê e gerencia seu próprio progresso; envia/recebe feedback (elogio ou construtivo) com qualquer colega.
- **Gestor**: tudo do colaborador, mais visão consolidada da sua equipe direta e permissão para registrar check-ins 1:1 com liderados.
- **RH**: visão organizacional completa, gestão de usuários e do catálogo de trilhas.

## Observação sobre este ambiente de desenvolvimento

A aplicação já foi instalada, migrada, populada com dados de exemplo e
testada de ponta a ponta (login, catálogo, inscrição em trilha, conclusão de
módulos, envio/recebimento de feedback, painel de equipe/RH e
administração), tanto no formato tradicional (Express com `app.listen`)
quanto simulando fielmente o ambiente serverless da Vercel (função
`api/index.ts` + rewrites de `vercel.json`, com Postgres real). Principais
mudanças desta rodada:

- Banco trocado de SQLite para PostgreSQL — necessário porque Vercel roda o
  backend como função serverless, sem disco persistente entre requisições
  (SQLite precisa de um arquivo em disco).
- Backend reestruturado: `server/src/app.ts` concentra a configuração do
  Express (sem `listen`); `server/src/index.ts` só é usado para rodar local
  (`npm run dev`); `api/index.ts`, na raiz, expõe esse mesmo app como
  Serverless Function.
- `server/src/lib/prisma.ts` ajustado para reusar a conexão do Prisma entre
  invocações da função (evita esgotar o limite de conexões do Postgres).
- `vercel.json` na raiz: builda o client, aplica `prisma migrate deploy` no
  banco, e roteia `/api/*` para a função e o restante para o SPA.

Rode `npm install && npm run dev` localmente (com um Postgres configurado em
`server/.env`) para reproduzir.
