# Deploy (link público de visualização)

Este guia sobe a aplicação de verdade (backend Express + Prisma/SQLite,
frontend React/Vite) em dois serviços com plano gratuito:

- **Render** para o backend (API + banco SQLite)
- **Vercel** para o frontend (SPA React)

Ambos exigem login (pode ser com a sua conta do GitHub). Nenhuma etapa aqui
pode ser feita por mim — precisa ser você clicando, porque exige autenticação
na sua conta.

## 1. Backend na Render

1. Acesse https://dashboard.render.com/ e faça login com GitHub.
2. **New +** → **Web Service** → selecione o repositório `afilho193/afilho193`.
3. Preencha:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Branch**: `claude/app-development-continuation-oos6f9` (ou a branch que estiver usando)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run db:deploy && npm run db:seed && npm run start`
   - **Instance Type**: `Free`
4. Em **Environment Variables**, adicione:
   - `DATABASE_URL` = `file:./prod.db`
   - `JWT_SECRET` = clique em "Generate" (ou cole qualquer string aleatória longa)
5. Clique em **Create Web Service** e aguarde o build/deploy terminar.
6. Copie a URL pública gerada (formato `https://<algo>.onrender.com`) — você vai usar no passo 2.

> Nota: no plano gratuito da Render, o serviço "dorme" após ~15 min sem
> tráfego e recomeça do zero na próxima visita. Por isso o Start Command
> roda o seed a cada início — garante que o link sempre abre com os
> usuários de demonstração populados, mas dados criados por quem visitar
> (feedbacks, inscrições) não são permanentes entre um sono e outro. Para
> persistência real, use um plano pago com disco, ou migre para Postgres.

## 2. Frontend na Vercel

1. Acesse https://vercel.com/new e faça login com GitHub.
2. Importe o repositório `afilho193/afilho193`.
3. Preencha:
   - **Root Directory**: `client`
   - Framework preset: `Vite` (a Vercel detecta automaticamente)
   - Build Command / Output Directory: deixe os padrões (`npm run build` / `dist`)
4. Em **Environment Variables**, adicione:
   - `VITE_API_URL` = `https://<url-do-backend-da-render>.onrender.com/api`
     (a URL copiada no passo 1.6, com `/api` no final)
5. Clique em **Deploy**.
6. Ao terminar, a Vercel te dá a URL pública (formato `https://<algo>.vercel.app`) — esse é o link para compartilhar/visualizar.

## Checklist rápido

- [ ] Backend deployado na Render, respondendo em `/api/health`
- [ ] `VITE_API_URL` no Vercel apontando para esse backend + `/api`
- [ ] Frontend deployado na Vercel
- [ ] Login testado com `rh@empresa.com` / `senha123` no link da Vercel

## Se algo der errado

- Tela em branco / erro de rede no frontend: confira se `VITE_API_URL` está
  correto e se o backend da Render está com status "Live" (não dormindo/falhando).
- Erro 500 no login: veja os logs do serviço na Render — geralmente é
  `DATABASE_URL` ou `JWT_SECRET` faltando/errado.
- CORS: o backend já libera todas as origens (`cors()` sem restrição), não
  deve ser necessário mexer aqui.
