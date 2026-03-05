# Pós Disciplina 01 – Fundamentos de IA e LLMs para Programadores

## Introdução
Este repositório contém todos os projetos desenvolvidos durante a disciplina **Fundamentos de IA e LLMs para Programadores**, abordando desde conceitos básicos de Machine Learning até técnicas avançadas de RAG (Retrieval-Augmented Generation) e sistemas de telemetria com IA.

Cada projeto foi desenvolvido para demonstrar na prática as tecnologias e conceitos teóricos abordados nos módulos, utilizando JavaScript/TypeScript como linguagem principal e explorando tanto modelos open-source quanto proprietários.

## Módulos

### Módulo 01: Introdução ao curso
- Sem projetos

### Módulo 02: Machine Learning, Deep Learning e IA - a base de tudo
**Projeto:** [Criando e Treinando minha primeira Rede Neural para determinar a categoria de alunos](module-02)

**Tecnologias utilizadas:**
- **TensorFlow.js** - Biblioteca de Machine Learning para JavaScript
- **@tensorflow/tfjs-node** - Versão Node.js do TensorFlow
- **JavaScript ES6+** - Linguagem de programação

**Conceitos abordados:**
- Redes Neurais Artificiais (RNA)
- Camadas densas com ativação ReLU
- Função de ativação Softmax para classificação
- Otimizador Adam para treinamento
- Perda categórica cross-entropy
- Treinamento com 100 épocas e dados embaralhados

**Aplicação prática:**
O projeto treina uma rede neural para classificar alunos em categorias (premium, medium, basic) baseado em características como idade, cores e localizações, demonstrando o processo completo de criação e treinamento de modelos de Deep Learning.

### Módulo 03: Deep Learning - Sistemas de Recomendação na prática
**Projeto:** [Como funcionam Sistemas de Recomendação](module-03)

**Tecnologias utilizadas:**
- **TensorFlow.js** - Biblioteca de Machine Learning
- **Browser-Sync** - Servidor de desenvolvimento para testes
- **JavaScript ES6+** - Linguagem de programação

**Conceitos abordados:**
- Sistemas de recomendação baseados em conteúdo
- Filtragem colaborativa
- Processamento de dados de e-commerce
- Visualização de resultados em tempo real

**Aplicação prática:**
Desenvolvimento de um sistema de recomendação para e-commerce que sugere produtos aos usuários baseado em seu histórico e preferências, utilizando técnicas de Deep Learning para melhorar a precisão das recomendações.

### Módulo 04: Web Machine Learning - Como vencer qualquer jogo
**Projeto:** [Como Vencer Qualquer Jogo](module-04)

**Tecnologias utilizadas:**
- **Webpack** - Empacotador de módulos e ferramenta de build
- **Babel** - Compilador de JavaScript moderno
- **Pixi.js** - Biblioteca de renderização 2D
- **GSAP** - Biblioteca de animações
- **Howler.js** - Biblioteca de áudio
- **ESLint** - Linter de código

**Conceitos abordados:**
- Desenvolvimento de jogos web com Machine Learning
- Processamento de imagens e áudio
- Animações e efeitos visuais
- Arquitetura modular com Webpack

**Aplicação prática:**
Implementação do clássico jogo Duck Hunt utilizando tecnologias web modernas, demonstrando como Machine Learning pode ser aplicado para criar experiências interativas e envolventes em jogos.

### Módulo 05: Inteligência artificial na Web
**Projeto:** [Web AI Teste](module-05)

**Tecnologias utilizadas:**
- **JavaScript ES6+** - Linguagem de programação
- **HTTP-Server** - Servidor local para desenvolvimento

**Conceitos abordados:**
- Integração básica de IA em aplicações web
- Testes de funcionalidades de IA
- Configuração de ambiente de desenvolvimento

**Projeto:** [Web AI Chat Interativo](module-05-a)

**Tecnologias utilizadas:**
- **JavaScript ES6+** - Linguagem de programação
- **HTTP-Server** - Servidor local para desenvolvimento

**Conceitos abordados:**
- Chatbots e interfaces conversacionais
- Processamento de linguagem natural
- Interação em tempo real com usuários

**Projeto:** [Web AI Multi Modal](module-05-b)

**Tecnologias utilizadas:**
- **JavaScript ES6+** - Linguagem de programação
- **HTTP-Server** - Servidor local para desenvolvimento
- **APIs de múltiplos modelos de IA** - Integração com diferentes serviços de IA

**Conceitos abordados:**
- Processamento multi-modal (texto, imagem, áudio)
- Integração com múltiplos serviços de IA
- Validação de requisitos de navegador
- Serviços de tradução automática

**Aplicação prática:**
Desenvolvimento de uma aplicação web completa que integra múltiplos serviços de IA, incluindo processamento de linguagem natural, tradução automática e validação de requisitos do navegador, demonstrando o potencial da IA na web moderna.

### Módulo 06: Prompt Engineering
- Sem projetos

### Módulo 07: Ferramentas de IA para acelerar sua vida como Dev
- Sem projetos

### Módulo 08: MCPs e Automação para Devs
**Projeto:** [Usando IA para: Gerar testes automatizados](module-08)

**Tecnologias utilizadas:**
- **LLMs (Large Language Models)** - Modelos de linguagem avançados
- **MCP (Model Context Protocol)** - Protocolo para integração de IA
- **Playwright** - Framework de automação de testes

**Conceitos abordados:**
- Geração automática de testes
- Integração com MCPs
- Automação de desenvolvimento
- Workflow com LLMs

**Projeto:** [Usando IA para: Navegar em sites e extrair informações](module-08-a)

**Tecnologias utilizadas:**
- **Playwright MCP** - Automação de navegação web
- **DOM manipulation** - Manipulação de elementos HTML

**Conceitos abordados:**
- Extração de dados de websites
- Automação de preenchimento de formulários
- Navegação web programática

**Projeto:** [Usando IA para: Consultar documentações atualizadas](module-08-b)

**Tecnologias utilizadas:**
- **Next.js** - Framework React para aplicações web
- **Better Auth** - Biblioteca de autenticação
- **GitHub OAuth** - Autenticação via GitHub
- **SQLite** - Banco de dados local
- **Context7 MCP** - Consulta de documentações

**Conceitos abordados:**
- Autenticação OAuth com GitHub
- Integração com documentações via MCP
- Desenvolvimento de aplicações Next.js
- Persistência com SQLite

**Projeto:** [Usando IA para: Colher dados de Telemetria de apps](module-08-c)

**Tecnologias utilizadas:**
- **Docker** - Containerização de aplicações
- **Grafana** - Plataforma de observabilidade
- **Prometheus** - Sistema de monitoramento
- **Loki** - Log aggregation
- **Tempo** - Rastreamento distribuído
- **OpenTelemetry** - Padrão de instrumentação
- **PostgreSQL** - Banco de dados

**Conceitos abordados:**
- Observabilidade de aplicações
- Telemetria e monitoramento
- Rastreamento distribuído
- Análise de logs e métricas
- Detecção de vazamentos de recursos

**Aplicação prática:**
Investigação de um bug de vazamento de conexões de banco de dados usando ferramentas de observabilidade. O projeto demonstra como identificar e diagnosticar problemas de performance em produção utilizando Grafana, Prometheus, Loki e Tempo para analisar logs, traces e métricas.

### Módulo 09: Modelos open-source vs. proprietários
**Projeto:** [Como rodar modelos localmente com Ollama](module-09)

**Tecnologias utilizadas:**
- **Ollama** - Plataforma para executar modelos localmente
- **LLaMA 2** - Modelo open-source
- **GPT-OSS** - Modelo open-source

**Conceitos abordados:**
- Execução de modelos localmente
- Modelos open-source vs proprietários
- Limitações de hardware para IA
- Comunicação com modelos locais

**Projeto:** [Como usar OpenRouter para orquestrar vários modelos](module-09-a)

**Tecnologias utilizadas:**
- **OpenRouter** - Hub de modelos de LLM
- **Arcee AI Trinity** - Modelo open-source
- **Google Gemma** - Modelo open-source
- **Shell scripting** - Automação via scripts

**Conceitos abordados:**
- Orquestração de múltiplos modelos de IA
- Integração com hubs de modelos
- Comunicação via API REST
- Teste de diferentes modelos

**Aplicação prática:**
Demonstração de como executar modelos de IA localmente usando Ollama e como orquestrar múltiplos modelos via OpenRouter, comparando as vantagens e desvantagens de modelos open-source versus proprietários.

### Módulo 10: RAG, embeddings e busca semântica
**Projeto:** [Geração Local de Embeddings](module-10)

**Tecnologias utilizadas:**
- **LangChain** - Orquestrador de pipelines de IA
- **Hugging Face Transformers** - Biblioteca de modelos de IA
- **Xenova all-MiniLM-L6-v2** - Modelo de embeddings
- **Neo4j** - Banco de dados orientado a grafos
- **PDF-parse** - Processamento de arquivos PDF

**Conceitos abordados:**
- Geração de embeddings semânticos
- Bancos de dados orientados a grafos
- Processamento de documentos PDF
- Busca semântica e similaridade

**Projeto:** [Criando o primeiro RAG com JavaScript e Neo4j](module-10-a)

**Tecnologias utilizadas:**
- **LangChain** - Orquestrador de pipelines de IA
- **Hugging Face Transformers** - Biblioteca de modelos de IA
- **Xenova all-MiniLM-L6-v2** - Modelo de embeddings
- **Neo4j** - Banco de dados orientado a grafos
- **OpenRouter** - Orquestrador de LLMs
- **Arcee AI Trinity** - Modelo de linguagem

**Conceitos abordados:**
- RAG (Retrieval-Augmented Generation)
- Embeddings semânticos
- Busca por similaridade
- Integração com modelos de linguagem
- Processamento de documentos

**Aplicação prática:**
Implementação de um sistema RAG completo que processa arquivos PDF, gera embeddings semânticos, armazena em banco de dados orientado a grafos e utiliza modelos de linguagem para gerar respostas contextualizadas, demonstrando o poder da busca semântica combinada com geração de linguagem natural.

## Resumo das Tecnologias

### Machine Learning e Deep Learning
- **TensorFlow.js** - Principal biblioteca para modelos de IA no JavaScript
- **Redes Neurais** - Base para aprendizado profundo
- **Sistemas de Recomendação** - Aplicações de Deep Learning

### Web Development
- **Next.js** - Framework React para aplicações web
- **Webpack** - Empacotador de módulos
- **Babel** - Compilador de JavaScript
- **Pixi.js** - Renderização 2D
- **GSAP** - Animações

### IA e LLMs
- **LangChain** - Orquestrador de pipelines de IA
- **Hugging Face Transformers** - Biblioteca de modelos
- **OpenRouter** - Hub de modelos de LLM
- **Ollama** - Execução local de modelos

### Bancos de Dados
- **Neo4j** - Banco orientado a grafos
- **SQLite** - Banco local
- **PostgreSQL** - Banco relacional

### Observabilidade
- **Grafana** - Plataforma de visualização
- **Prometheus** - Monitoramento de métricas
- **Loki** - Log aggregation
- **Tempo** - Rastreamento distribuído
- **OpenTelemetry** - Padrão de instrumentação

### Automação e MCP
- **Playwright** - Automação de testes
- **Better Auth** - Autenticação
- **Context7** - Consulta de documentações
- **Model Context Protocol** - Integração de IA
