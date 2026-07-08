# Estoque da Dispensa — passo a passo para publicar

Este projeto tem duas partes gratuitas:
- **Supabase** → guarda os dados do estoque (compartilhado entre Admin e Usuário)
- **Vercel** → hospeda o app e te dá um link próprio (ex: `estoque-dispensa.vercel.app`)

Nenhuma das duas exige cartão de crédito no plano gratuito.

---

## Parte 1 — Criar o banco de dados (Supabase)

1. Acesse **https://supabase.com** e crie uma conta gratuita (pode entrar com o GitHub).
2. Clique em **"New project"**.
   - Dê um nome (ex: `estoque-dispensa`)
   - Crie uma senha para o banco (guarde ela, mas você não vai precisar usar no dia a dia)
   - Escolha a região mais próxima (ex: South America - São Paulo)
   - Clique em **Create new project** e espere ~2 minutos ele ficar pronto
3. No menu lateral, clique em **SQL Editor** → **New query**.
4. Cole exatamente este código e clique em **Run**:

```sql
create table items (
  id text primary key,
  name text not null,
  category text not null,
  unit text not null,
  current int not null default 0,
  min int not null default 0
);

alter table items enable row level security;

create policy "Acesso público de leitura e escrita"
on items for all
using (true)
with check (true);
```

   > Isso cria a tabela onde ficam os itens, e libera leitura/escrita para o app (como é um app simples de uso pessoal/familiar, não criamos login de usuário — quem tiver o link do app consegue usar).

5. No menu lateral, clique em **Project Settings** (ícone de engrenagem) → **API**.
6. Você vai precisar de dois valores dessa página:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **anon public key** (uma chave longa)

Guarde os dois — vai usar na Parte 3.

---

## Parte 2 — Colocar o código no GitHub

1. Acesse **https://github.com** e crie uma conta gratuita, se ainda não tiver.
2. Clique em **New repository** (botão verde).
   - Nome: `estoque-dispensa`
   - Deixe como **Public** ou **Private**, tanto faz
   - Não marque nenhuma opção extra (README, .gitignore, etc.)
   - Clique em **Create repository**
3. Na página que abrir, clique no link **"uploading an existing file"**.
4. Arraste **todos os arquivos e pastas** deste projeto para a área de upload (menos a pasta `node_modules`, se existir — não é necessária).
5. Clique em **Commit changes**.

---

## Parte 3 — Publicar (Vercel)

1. Acesse **https://vercel.com** e crie uma conta gratuita usando o **mesmo login do GitHub** (facilita a conexão).
2. Clique em **Add New... → Project**.
3. Selecione o repositório `estoque-dispensa` que você acabou de criar → **Import**.
4. Antes de clicar em Deploy, abra **Environment Variables** e adicione as duas chaves que você guardou na Parte 1:

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | (a Project URL do Supabase) |
   | `VITE_SUPABASE_ANON_KEY` | (a anon public key do Supabase) |

5. Clique em **Deploy**. Em 1-2 minutos a Vercel te dá um link tipo `estoque-dispensa.vercel.app` — esse é o link definitivo do seu app.

---

## Usando no celular

1. Abra o link da Vercel no navegador do celular.
2. **Android (Chrome):** menu (⋮) → **"Adicionar à tela inicial"**.
3. **iPhone (Safari):** ícone de compartilhar → **"Adicionar à Tela de Início"**.

O ícone vai aparecer na tela do celular e abrir em tela cheia, como um app normal.

---

## Se quiser mudar algo depois (cores, itens padrão, PIN do admin, etc.)

Volte na conversa com o Claude, peça o ajuste, e ele te devolve os arquivos atualizados. Você só precisa repetir a Parte 2 (subir os arquivos novos no GitHub) — a Vercel publica a atualização sozinha automaticamente assim que detecta a mudança no repositório.

## Sincronização entre Admin e Usuário

Os dados ficam salvos no Supabase e visíveis para qualquer pessoa com o link. Se alguém mexer no estoque em outro celular, toque no ícone de atualizar (🔄) no topo do app para ver as mudanças mais recentes.
