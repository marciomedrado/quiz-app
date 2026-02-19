# 🎯 Quiz Generator - AI Powered Suite

> **A ferramenta definitiva para criadores de conteúdo educacional e de entretenimento.**

O **Quiz Generator** é uma aplicação web de ponta, construída com **Node.js** e **Vanilla JavaScript**, que utiliza o poder da Inteligência Artificial (**OpenAI GPT-4o/o1** e **Google Imagen**) para criar quizzes estruturados, visualmente deslumbrantes e prontos para produção de vídeo.

![Design Premium](https://img.shields.io/badge/Design-Glassmorphism-purple?style=for-the-badge)
![AI Power](https://img.shields.io/badge/AI-OpenAI%20%2B%20Google-green?style=for-the-badge)
![Video Ready](https://img.shields.io/badge/Export-CapCut%20Ready-blue?style=for-the-badge)

---

## ✨ Funcionalidades Premium

### 🧠 Inteligência & Criação
*   **Geração de Quizzes via IA:** Crie quizzes completos sobre qualquer tema, com controle de dificuldade (*Iniciante* ao *Extremo*), idioma e formato.
*   **Brainstorm Chat 🤖:** Um assistente de estratégia integrado para ajudar você a refinar ideias vagas e transformá-las em roteiros estruturados antes da geração.
*   **Regeneração Inteligente ⚡:** Não gostou de uma questão? Regenere apenas ela com um clique, mudando o foco ou contexto sem perder o resto do quiz.
*   **Narrativa Automática 🎙️:** Gera scripts de locução otimizados para vídeos, com tons personalizáveis (Animado, Suspense, Educativo, etc.).

### 🎨 Design & Personalização (Glassmorphism)
*   **Editor Visual Completo:** Controle total sobre tipografia (Google Fonts), cores, bordas, sombras, opacidades e espaçamentos.
*   **Layouts Flexíveis:** Alterne instantaneamente entre layout **Padrão** (Centralizado) e **Imagem à Direita** (Ideal para YouTube/TikTok).
*   **Presets de Estilo:** Salve suas configurações visuais favoritas e aplique-as em novos projetos com um clique.
*   **Importação de Backgrounds:** Upload em massa de imagens de fundo ou uso de cores sólidas/gradientes.

### 🖼️ Multimídia & Imagens
*   **Geração de Imagens IA:** Integração nativa com **DALL-E 3** e **Google Imagen 3**.
*   **Busca de Imagens Reais:** Pesquise imagens CC (Creative Commons) diretamente do Google Images sem sair da interface.
*   **Edição em Lote:** Importe pastas inteiras de imagens locais para preencher seu quiz rapidamente.

### 🚀 Exportação & Produção
*   **Integração CapCut (Beta) 🎬:** Exporta a estrutura completa do projeto (JSON + Assets) pronta para automação de edição de vídeo.
*   **Controle de Timing ⏱️:** Ajuste a duração exata de cada cena (Intro, Pergunta, Timer, Resposta) para sincronia perfeita.
*   **Pacote de Imagens (PNG):** Renderização de alta qualidade de todos os slides (Perguntas e Respostas) via `html2canvas`.
*   **PDF Generator 📕:** Exporte roteiros em PDF com múltiplos layouts (Só Perguntas, Só Respostas, Sequencial, Agrupado).
*   **Backup e Migração 💾:** Exporte e importe metadados completos do projeto (JSON) para nunca perder seu trabalho.

---

## 🛠️ Tecnologias & Arquitetura

O projeto foi desenhado para ser leve, rápido e fácil de manter, sem a complexidade de frameworks frontend pesados.

*   **Backend:** [Node.js](https://nodejs.org/) com [Express](https://expressjs.com/) (Proxy para APIs e Servidor de Arquivos).
*   **Frontend:** HTML5, CSS3 (Variáveis & Flexbox/Grid), Vanilla JS Modular.
*   **APIs Integradas:**
    *   **OpenAI API:** Chat Completion (GPT-4o, GPT-4 Turbo) e Image Generation (DALL-E 3).
    *   **Google Cloud:** Generative Language (Imagen 3) e Custom Search API.
*   **Bibliotecas (via CDN):**
    *   `html2canvas`: Renderização de DOM para Imagem.
    *   `jspdf`: Geração de documentos PDF.
    *   `jszip`: Criação de arquivos ZIP para download.
    *   `axios`: Requisições HTTP.

---

## 🚀 Instalação e Uso (Nova Versão com Login & Créditos)

### Pré-requisitos
*   [Node.js](https://nodejs.org/) (v16+ recomendado).
*   Chaves de API (OpenAI / Google).

### Passo a Passo

1.  **Instalação:**
    ```bash
    npm install
    ```

2.  **Banco de Dados:**
    Inicialize o Prisma e as tabelas do banco de dados (SQLite):
    ```bash
    npx prisma generate
    npx prisma migrate dev --name init
    ```

3.  **Configuração do `.env`:**
    Crie o arquivo `.env` baseado no `.env.example` e preencha as chaves:
    *   `JWT_SECRET`: Uma string aleatória para segurança.
    *   `ADMIN_EMAIL` e `ADMIN_PASSWORD`: Use estes para criar seu primeiro acesso administrativo.

4.  **Inicie a aplicação:**
    ```bash
    npm start
    ```

### 💎 Sistema de Créditos
*   Cada novo usuário começa com **10 créditos**.
*   Cada quiz gerado consome **1 crédito**.
*   Administradores podem adicionar créditos via interface ou API.

---

## 🔒 Segurança & Arquitetura
*   **Autenticação:** Sessões seguras via JWT armazenado em Cookies `httpOnly`.
*   **Hash de Senha:** Proteção com `bcrypt`.
*   **Validação:** Todas as entradas são validadas com `zod`.
*   **Proteção de Headers:** Uso de `helmet` para segurança adicional.
*   **Rate Limiting:** Limite de tentativas de login para evitar ataques de força bruta.
*   **Banco de Dados:** SQLite com **better-sqlite3** (driver de alta performance e seguro).
*   **ORM:** [Prisma](https://www.prisma.io/) com Driver Adapter especializado.

---

## 📂 Estrutura do Projeto

```
/
├── app.js            # Lógica principal do Frontend (Estado, Eventos, UI)
├── server.js         # Servidor Express e Proxies de API
├── index.html        # Estrutura HTML e Modais
├── styles.css        # Design System e Estilização Global
├── package.json      # Dependências e Scripts
├── .env              # Variáveis de Ambiente (Não comitar!)
└── README.md         # Documentação
```

---

## 📄 Licença

Este projeto é distribuído sob a licença **ISC**. Sinta-se livre para usar, modificar e distribuir.

---

*Desenvolvido com ❤️ e ☕ por Antigravity.*
