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

## 🚀 Instalação e Uso

### Pré-requisitos
*   [Node.js](https://nodejs.org/) (v14+ recomendado).
*   Chaves de API:
    *   **OpenAI API Key** (Essencial).
    *   **Google Cloud API Key** & **Search Engine ID (CX)** (Opcional, para busca de imagens e Imagen).

### Passo a Passo

1.  **Clone ou baixe o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/quiz-generator.git
    cd quiz-generator
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure o ambiente:**
    Crie um arquivo `.env` na raiz do projeto com suas credenciais:
    ```env
    # Obrigatório para geração de texto e imagens DALL-E
    OPENAI_API_KEY=YOUR_OPENAI_API_KEY

    # Opcional: Para Google Imagen e Busca de Imagens
    GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY
    GOOGLE_CX=YOUR_GOOGLE_CX

    # Porta do servidor (Padrão: 3000)
    PORT=3000
    ```

4.  **Inicie a aplicação:**
    ```bash
    npm start
    ```

5.  **Acesse:**
    Abra seu navegador em [http://localhost:3000](http://localhost:3000).

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
