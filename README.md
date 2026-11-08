# 🧠 Second Brain — Deca-Engine v2.0

> Plataforma Agêntica Desktop & Web SPA com Arquitetura Deca-Engine de 10 Camadas Autônomas, Relay Zero-Key, Memória Persistente e Busca Multimídia em Tempo Real.

---

## 🚀 Inicialização com 1 Clique (Desktop Mode)

Para iniciar o Second Brain diretamente no Windows sem barras de navegação (estilo aplicativo nativo):

- **Iniciar:** Dê dois cliques em `iniciar-second-brain.bat`
- **Encerrar:** Dê dois cliques em `parar-second-brain.bat`

---

## 🛠️ Stack Tecnológica

- **Framework:** Next.js 13.5 (App Router com `output: 'export'`)
- **Linguagem:** TypeScript estrito com Tailwind CSS e Shadcn/ui
- **Gerenciamento de Estado:** Zustand v5 (armazenamento reativo com isolamento de digitação)
- **Armazenamento Local:** IndexedDB via `localForage` (Offline-first & Zero-Leak)
- **IA & Provedores:** Claude 3.5 Sonnet (Relay Zero-Key local sem bloqueio de login) + WebMCP Layer 9
- **Multimídia & Dados Vivos:**
  * Wikimedia Commons REST API (fotos de alta resolução e vídeos abertos HTML5)
  * Open-Meteo API (meteorologia em tempo real com previsão de temperatura)
  * Fallback Triplo de Vídeo (HTML5 nativo `.webm`/`.mp4` + YouTube No-Cookie HD + Card Interativo)
  * Galeria com Lightbox responsivo e banner temporal (Horário de Brasília)

---

## 📦 Como Rodar Manualmente

```bash
# 1. Navegue para o diretório do projeto
cd project

# 2. Instale as dependências
npm install

# 3. Execute em modo de desenvolvimento
npm run dev

# 4. Ou gere a build estática de produção
npm run build
```

---

## 🔄 Conexão com GitHub Desktop

Este repositório está configurado para sincronização contínua com o **GitHub Desktop**.

- Para abrir e sincronizar:
```bash
github "D:\Project X"
```
Ou abra o **GitHub Desktop** e visualize o repositório **Project X** para fazer push, pull e publicar no seu GitHub (`jonathanmarquesnet-ctrl`).
