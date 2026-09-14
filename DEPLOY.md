# Deploy (link público de visualização) — tudo no Vercel

A aplicação roda inteira num único projeto Vercel:

- **Frontend**: build estático do Vite (`client/`), servido diretamente.
- **Backend**: o mesmo Express de sempre, mas empacotado como uma
  [Serverless Function](https://vercel.com/docs/functions) em `api/index.ts`
  — o `vercel.json` redireciona toda chamada `/api/*` para essa função.
- **Banco de dados**: Postgres (SQLite não funciona em serverless, porque não
  há disco persistente entre uma requisição e outra).

Nenhuma etapa abaixo pode ser feita por mim — exige login na sua conta.

## 1. Criar o banco Postgres

Mais simples direto pelo próprio Vercel (usa Neon por baixo, plano gratuito):

1. Acesse https://vercel.com/dashboard → aba **Storage** → **Create Database** → **Postgres** (Neon).
2. Dê um nome (ex: `people-dev-db`) e crie. Você vai usar a connection string dele no passo 3.
3. Copie a **connection string** (algo como `postgresql://usuario:senha@ep-xxxx.neon.tech/neondb?sslmode=require`).
   Prefira a variante com **pooling** (geralmente identificada como "Pooled connection" no painel — importante porque funções serverless abrem muitas conexões simultâneas e o Postgres tem limite).

## 2. Criar o projeto na Vercel

1. Acesse https://vercel.com/new e faça login com GitHub.
2. Importe o repositório `afilho193/afilho193`.
3. Configurações do projeto:
   - **Root Directory**: deixe a raiz do repositório (não entre em `client/`)
   - **Framework Preset**: "Other" (o `vercel.json` já define build e output)
   - **Branch**: `claude/app-development-continuation-oos6f9` (ou a que estiver usando)
4. Em **Environment Variables**, adicione:
   - `DATABASE_URL` = a connection string copiada no passo 1.3
   - `JWT_SECRET` = qualquer string aleatória longa (ex: gere uma com `openssl rand -hex 32`)
5. Clique em **Deploy**. O build já roda as migrations do Prisma contra o banco (`prisma migrate deploy`) automaticamente — não precisa fazer isso à parte.
6. Ao terminar, você recebe a URL pública (`https://<algo>.vercel.app`) — não precisa configurar `VITE_API_URL`, o frontend já chama `/api` no mesmo domínio.

## 3. Popular os dados de demonstração (uma vez)

O seed não roda automaticamente a cada deploy (rodar sempre apagaria dados reais de quem estiver testando). Rode uma única vez, do seu computador ou desta sessão, apontando para o banco de produção:

```bash
DATABASE_URL="<a mesma connection string do passo 1.3>" npm run db:seed -w server
```

Isso cria os usuários de demonstração (`rh@empresa.com`, `carlos.gestor@empresa.com` etc., senha `senha123`) e os dados de exemplo.

## Checklist rápido

- [ ] Banco Postgres criado, connection string copiada
- [ ] Projeto importado na Vercel com Root Directory = raiz do repo
- [ ] `DATABASE_URL` e `JWT_SECRET` configurados nas Environment Variables
- [ ] Deploy concluído sem erro
- [ ] Seed rodado uma vez contra o banco de produção
- [ ] Login testado com `rh@empresa.com` / `senha123` no link do Vercel

## Se algo der errado

- **Erro 500 no login / "Prisma Client could not locate the Query Engine"**:
  normalmente é `DATABASE_URL` ausente/errada, ou faltou rodar o seed. Veja
  os logs da função em Vercel → seu projeto → aba **Logs**.
- **"too many connections" no Postgres**: use a connection string com
  *pooling* (passo 1.3), não a direta.
- **Tela em branco ao recarregar uma rota interna** (ex: `/dashboard` direto
  na URL): o `vercel.json` já tem o rewrite de fallback para `index.html` —
  se acontecer, confira se o arquivo `vercel.json` foi mesmo publicado no
  deploy (aparece em Vercel → seu projeto → **Source**).
- **Build falha no `prisma migrate deploy`**: geralmente é a `DATABASE_URL`
  não estar disponível durante o build — confirme que a env var está
  marcada para os ambientes "Production" *e* "Preview"/"Build" no painel da Vercel.
