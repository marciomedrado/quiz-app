# 🎯 Quiz Generator - Production Suite (PostgreSQL & Stripe)

> **Ambiente escalável com infraestrutura de produção robusta, economia dinâmica e faturamento recorrente.**

Esta versão marca a migração para **PostgreSQL** em produção e a implementação completa de um sistema de billing que suporta tanto **Créditos (Avulsos)** quanto **Assinaturas (Mensais)**.

---

## 🚀 Arquitetura de Produção

### 🐘 Banco de Dados (Dual Mode)
Para garantir velocidade em desenvolvimento e robustez em produção, o sistema utiliza:
- **Dev:** PostegreSQL (Local) ou SQLite (Manual). O `schema.prisma` está configurado para `postgresql` por padrão.
- **Produção:** PostgreSQL gerenciado (Railway, Supabase ou Neon).

### 🚀 Diferenciais de Produção
- **SSL Obrigatório:** Conexão segura com o banco de dados via `?sslmode=require`.
- **Harden Cookies:** Cookies `Secure` e `SameSite: None` para compatibilidade com domínios cruzados.
- **CORS Estrito:** Apenas origens autorizadas via `ALLOWED_ORIGINS`.

---

## 💳 Sistema de Billing (Stripe)

### 🪙 Créditos Avulsos
*   Compra de pacotes de créditos únicos.
*   Entrega automática via **Webhook**.
*   Registro histórico no **Credit Ledger**.

### 📅 Assinaturas Mensais
*   Planos **BASIC** e **PRO**.
*   Recarga automática de créditos a cada renovação de ciclo (invoice.paid).
*   Gestão de status (Ativa, Cancelada, Pendente).

### 🛡️ Segurança de Pagamento
*   **Idempotência:** Garantia de que um pagamento nunca é processado duas vezes via `stripeEventId`.
*   **Validação de Assinatura:** Webhooks protegidos por `STRIPE_WEBHOOK_SECRET`.
*   **Ledger Inviolável:** Toda mudança de saldo gera uma entrada de auditoria.

---

## 🛠️ Guia de Deploy e Migração

### 1. Preparação (Heroku/Railway/Supabase)
1. Crie uma instância de PostgreSQL.
2. Copie a `DATABASE_URL` (ex: `postgres://user:pass@host:5432/db?sslmode=require`).

### 2. Configuração do Stripe
1. Crie os **Produtos** no Stripe Dashboard (um para cada pacote de créditos e um para cada plano).
2. Obtenha os **Price IDs** e configure no `.env`.
3. Configure o **Webhook URL** apontando para `seuapp.com/api/billing/webhook`.
4. Habilite os eventos: `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`.

### 3. Deploy
```bash
# Instalar dependências
npm install

# Rodar migrações em produção
npm run migrate:deploy

# Gerar o client
npm run generate:prod

# Iniciar server
npm start
```

---

## 📂 Estrutura de Variáveis (checklist)
Verifique o arquivo `.env.production.example` para a lista completa de variáveis:
- `APP_URL`: URL base do seu app (ex: `https://quiz.meuapp.com`).
- `ALLOWED_ORIGINS`: Domínios permitidos (separados por vírgula).
- `STRIPE_PRICE_ID_PLAN_...`: IDs de assinatura.
- `STRIPE_PRICE_ID_PACK_...`: IDs de pacotes únicos.

---

## 🧠 Desenvolvimento Local (SQLite)

Para rodar localmente de forma rápida com **SQLite**:

1.  Configure `DATABASE_URL="file:./prisma/dev.db"` no seu `.env`.
2.  Rode as migrações de desenvolvimento:
    ```bash
    npm run migrate:dev
    ```
3.  Gere o client para SQLite:
    ```bash
    npm run generate:dev
    ```
4.  Inicie o servidor:
    ```bash
    npm start
    ```

## 🌍 Produção (PostgreSQL)

Para o ambiente de **Produção**:

1.  Rode as migrações (Managed DB):
    ```bash
    npm run migrate:deploy
    ```
2.  Gere o client para PostgreSQL:
    ```bash
    npm run generate:prod
    ```

---

*Desenvolvido com rigor técnico por Antigravity.*
