# 🚀 Guia de Implantação: CRM Escolar na Vercel com Supabase

Este guia orienta o processo completo para publicar o **CRM Escolar** gratuitamente na **Vercel**, conectando com o banco de dados e autenticação oficial do **Supabase**.

---

## 🏗️ Arquitetura da Aplicação

```
┌────────────────────────────────────────────────────────┐
│                        VERCEL                          │
│  - Hospedagem Estática (HTML5 / CSS / ES Modules)      │
│  - Serverless Function (/api/config)                   │
│  - Variáveis de Ambiente (SUPABASE_URL, SUPABASE_KEY)  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                       SUPABASE                         │
│  - Banco de Dados PostgreSQL                           │
│  - Autenticação (Google OAuth + E-mail/Senha)          │
│  - Row Level Security (RLS)                            │
└────────────────────────────────────────────────────────┘
```

---

## 📋 Pré-requisitos

1. Conta gratuita no [GitHub](https://github.com/) (já criada e sincronizada).
2. Conta gratuita no [Supabase](https://supabase.com/).
3. Conta gratuita na [Vercel](https://vercel.com/).

---

## 🔹 Passo 1: Criar o Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com/) e faça login.
2. Clique em **"New Project"**.
3. Preencha as informações:
   - **Name**: `crm-escolar`
   - **Database Password**: Escolha uma senha forte e anote-a com segurança.
   - **Region**: `South America (São Paulo)` (ou a mais próxima).
   - **Pricing Plan**: `Free` (Gratuito).
4. Clique em **"Create new project"** e aguarde cerca de 1 a 2 minutos para provisionar o banco.

---

## 🔹 Passo 2: Executar o Script SQL no Supabase

1. No menu lateral esquerdo do Supabase, clique em **"SQL Editor"** (ícone `>_`).
2. Clique em **"New Query"**.
3. Abra o arquivo [`schema.sql`](./schema.sql) deste projeto, copie todo o conteúdo e cole no editor do Supabase.
4. Clique no botão **"Run"** (ou `Ctrl + Enter` / `Cmd + Enter`).
5. Você verá a mensagem `Success. No rows returned`. Todas as tabelas, triggers de auditoria, gatilhos de criação de perfil de Administrador e categorias padrão foram criadas.

---

## 🔹 Passo 3: Obter as Credenciais do Supabase

1. No menu lateral esquerdo do Supabase, clique em **"Project Settings"** (ícone de engrenagem ⚙️) e selecione **"API"**.
2. Localize as seguintes credenciais:
   - **Project URL**: (ex: `https://abcdefghijkl.supabase.co`)
   - **Project API Keys** -> chave **`anon` `public`** (ex: `eyJhbGciOi...`)

> [!CAUTION]
> **ATENÇÃO À SEGURANÇA:**
> - Copie **APENAS** a chave `anon` `public`.
> - **NUNCA** use nem compartilhe a chave `service_role` `secret` no frontend ou em repositórios públicos. A chave `service_role` ignora todas as regras de segurança e deve ser mantida confidencial.

---

## 🔹 Passo 4: Configurar Autenticação (Google e E-mail)

### 4.1. Habilitar E-mail / Senha:
1. No menu do Supabase, vá em **Authentication** -> **Providers**.
2. Certifique-se de que **Email** está habilitado (`Enabled`).
3. (Opcional) Desmarque *"Confirm email"* caso deseje login imediato sem envio obrigatório de e-mail de confirmação.

### 4.2. Habilitar Google OAuth:
1. Em **Authentication** -> **Providers**, clique em **Google**.
2. Ative a opção **Enable Google provider**.
3. No [Google Cloud Console](https://console.cloud.google.com/):
   - Crie uma credencial de **ID do cliente OAuth 2.0**.
   - Em **"URIs de redirecionamento autorizados"**, adicione a URL fornecida pelo Supabase (ex: `https://<seu-projeto>.supabase.co/auth/v1/callback`).
   - Copie o **Client ID** e o **Client Secret** do Google e cole nos campos correspondentes no painel do Supabase.
4. Clique em **"Save"**.

---

## 🔹 Passo 5: Publicar na Vercel pelo GitHub

1. Acesse [vercel.com](https://vercel.com/) e faça login (recomendado conectar com sua conta do GitHub).
2. No painel principal da Vercel, clique em **"Add New..."** -> **"Project"**.
3. Na lista de repositórios, encontre **`crm-escolar`** (ou `thamyoliveira-create/crm-escolar`) e clique em **"Import"**.
4. Na tela de configuração do projeto:
   - **Framework Preset**: `Other`
   - **Root Directory**: `./`

---

## 🔹 Passo 6: Configurar as Variáveis de Ambiente na Vercel

Antes de clicar em Deploy, expanda a seção **"Environment Variables"** na Vercel e adicione:

| Nome da Variável | Valor |
| :--- | :--- |
| `SUPABASE_URL` | `https://seu-projeto.supabase.co` (obtida no Passo 3) |
| `SUPABASE_ANON_KEY` | `sua-chave-anon-publica` (obtida no Passo 3) |

Clique em **"Add"** para cada variável.

5. Clique em **"Deploy"**!
6. Em cerca de 30 segundos, seu projeto estará publicado e com URL HTTPS gratuita (ex: `https://crm-escolar-xxx.vercel.app`).

---

## 🔹 Passo 7: Configurar URLs de Redirecionamento no Supabase

Após obter a URL oficial da Vercel:

1. Acesse o painel do Supabase -> **Authentication** -> **URL Configuration**.
2. No campo **Site URL**, informe o endereço da Vercel:
   `https://seu-projeto.vercel.app`
3. No campo **Redirect URLs**, adicione:
   - `https://seu-projeto.vercel.app/app.html`
   - `https://seu-projeto.vercel.app/**`
   - `http://localhost:3000/app.html` (para desenvolvimento local)
4. Clique em **"Save"**.

---

## 🔒 Boas Práticas de Segurança

- **Chave Pública (`anon`)**: Projetada para ser utilizada no navegador em conjunto com as políticas de Row Level Security (RLS) configuradas no `schema.sql`.
- **Chave Privada (`service_role`)**: **NÃO** deve ser adicionada à Vercel nem incluída no código do cliente.
- **Endpoint Seguro (`/api/config.js`)**: Fornece de forma dinâmica apenas as variáveis públicas necessárias (`SUPABASE_URL` e `SUPABASE_ANON_KEY`), garantindo que nenhuma alteração manual em arquivos JS seja necessária durante o deploy.
- **Fallback Automático**: Se nenhuma variável for configurada na Vercel, a aplicação funciona localmente no navegador utilizando o armazenamento `localStorage` sem falhas.

---

## 💡 Atualizações Futuras

Sempre que você fizer novos commits na branch `main` do GitHub:
```bash
git add .
git commit -m "feat: sua alteracao"
git push origin main
```
A Vercel fará a nova publicação automaticamente em poucos segundos! 🚀
