# 🎯 Quiz Generator - AI Powered Suite (Premium v1.5)

> **A ferramenta definitiva para criadores de conteúdo educacional e de entretenimento com economia baseada em uso real.**

O **Quiz Generator** é uma aplicação web de ponta que utiliza o poder da Inteligência Artificial (**OpenAI GPT-4o** e **Google Imagen**) para criar quizzes estruturados e prontos para produção. Esta versão introduz um sistema de **faturamento em tempo real** e **gestão administrativa avançada**.

---

## 🚀 Novidades na Versão 1.5

### 👑 Gestão Superadmin
*   **Hierarquia de Papéis:** Diferenciação entre `USER`, `ADMIN` e `SUPERADMIN`.
*   **Painel Administrativo (`/admin`):** Interface para busca de usuários, alteração de cargos e gestão manual de créditos (adicionar/remover).
*   **Seed automático:** Criação automática do primeiro Superadmin via variáveis de ambiente.

### 🪙 Economia Dinâmica & Billing
*   **Cobrança Baseada em Uso:** O sistema calcula o custo exato em tokens e imagens (DALL-E 3 / Imagen) e cobra o usuário com base no custo real x10 (margem de lucro fixa).
*   **Integração Stripe:** Compra de pacotes de créditos via **Stripe Checkout** com confirmação automática via **Webhooks**.
*   **Transparência:** Página de preços (`/pricing`) detalhando exatamente como cada crédito é gasto e o valor de cada ação.
*   **Log de Uso:** Todas as ações de IA são registradas no banco de dados para auditoria (modelo usado, tokens, custo USD).

---

## ✨ Funcionalidades Core

### 🧠 Inteligência & Criação
*   **Geração via IA:** Controle de dificuldade, idioma (20+ suportados) e formato narrativo.
*   **Brainstorm Chat:** Assistente para refinar ideias antes de gastar créditos.
*   **Descoberta automática de Modelos:** O frontend detecta automaticamente novos modelos configurados no backend e atualiza a interface.

### 🎨 Design & Produção
*   **Glassmorphism UI:** Design premium com transparências e animações dinâmicas.
*   **Exportação CapCut Ready:** Gera o ZIP completo para importar no CapCut.
*   **Alta Fidelidade:** Exportação de slides em PNG (1920x1080) e PDF estruturado.

---

## 🛠️ Instalação e Configuração

### Pré-requisitos
*   [Node.js](https://nodejs.org/) (v18+).
*   Conta no [Stripe](https://stripe.com) (para pagamentos).
*   API Keys da OpenAI e Google Cloud.

### Instalação

1.  **Instale as dependências:**
    ```bash
    npm install
    ```

2.  **Configure o Banco de Dados (SQLite):**
    ```bash
    npx prisma generate
    npx prisma migrate dev --name init
    ```

3.  **Variáveis de Ambiente (`.env`):**
    Copie o `.env.example` para `.env` e preencha as informações cruciais:
    - `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD`: Seus dados de acesso mestre.
    - `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`: Para processar pagamentos.
    - `OPENAI_API_KEY`: Para geração de quiz e imagens.

4.  **Inicie o Servidor:**
    ```bash
    npm start
    ```

---

## 🔒 Segurança & Boas Práticas
*   **Cookies HttpOnly:** Sessões JWT seguras que não podem ser acessadas via script.
*   **Rate Limiting:** Proteção contra ataques de força bruta no login.
*   **Helmet & CORS:** Headers de segurança configurados para prevenir vulnerabilidades comuns.
*   **Zod Schema Validation:** Todas as entradas da API são estritamente validadas.

---

## 📁 Estrutura do Backend
*   `src/routes/`: Endpoints de autenticação, admin, billing e IA.
*   `src/services/`: Lógica de negócio (créditos, transações, logs).
*   `src/config/`: Tabelas de preço, pacotes Stripe e configurações globais.
*   `prisma/schema.prisma`: Definição de dados e relações.

---

*Desenvolvido com ❤️ e rigor técnico por Antigravity.*
