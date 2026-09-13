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

- **Backend**: Node.js + Express + TypeScript, Prisma ORM sobre SQLite, autenticação via JWT.
- **Frontend**: React + Vite + TypeScript, React Router, Tailwind CSS.

## Estrutura

```
server/   API REST (Express + Prisma)
client/   SPA React (Vite)
```

## Como rodar localmente

Pré-requisito: Node.js 18+.

```bash
# 1. Instalar dependências (na raiz, usa npm workspaces)
npm install

# 2. Configurar variáveis de ambiente do backend
cp server/.env.example server/.env
# server/.env já vem com valores padrão prontos para uso local

# 3. Criar o banco (SQLite) e rodar as migrations
npm run db:migrate

# 4. Popular o banco com dados de exemplo (usuários, trilhas, feedbacks)
npm run db:seed

# 5. Subir backend (porta 4000) e frontend (porta 5173) juntos
npm run dev
```

Acesse `http://localhost:5173`.

### Deploy (link público)

Veja [DEPLOY.md](./DEPLOY.md) para o passo a passo de deploy gratuito
(Render para o backend + Vercel para o frontend).

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

A aplicação já foi instalada, migrada, populada com dados de exemplo e testada de ponta a ponta (login, catálogo, inscrição em trilha, conclusão de módulos, envio/recebimento de feedback, painel de equipe/RH e administração), com backend e frontend rodando lado a lado. Principais correções feitas nesta rodada:

- SQLite (via Prisma) não suporta `enum` nativo: os campos `role`, `status` e `type` do schema passaram a ser `String`, com os valores válidos centralizados em `server/src/lib/enums.ts` (mantendo a mesma ergonomia de uso, ex. `Role.HR`).
- Faltava `client/src/vite-env.d.ts`, o que quebrava o build do frontend (`ImportMeta.env` não tipado).
- Ajuste de tipagem no seed (`prisma/seed.ts`) e nas rotas de usuários para refletir o novo tipo `String` vindo do Prisma.

Rode `npm install && npm run dev` localmente para reproduzir.
