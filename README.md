# Pós Disciplina 01 – Fundamentos de IA e LLMs para Programadores

## Introdução
- Esse é um repositório com todos os projetos desenvolvidos na disciplina Fundamentos de IA e LLMs para Programadores.
- Para simplificar, cada projeto foi nomeado com o nome do seu módulo e abaixo está o sumário de cada um. 
- Caso haja mais de um projeto no mesmo módulo, será acrescentado um sufixo incremental. Ex: -a, -b, -c
- Caso um projeto seja desenvolvido em mais de um módulo, será unificado o número dos módulos em questão e separados por hífen. Ex: module-02-03, module-04-05

## Módulos

### Módulo 01: Introdução ao curso
- Sem projetos

### Módulo 02: Machine Learning, Deep Learning e IA - a base de tudo
- Projeto: [Criando e Treinando minha primeira Rede Neural para determinar a categoria de alunos](module-02)

### Módulo 03: Deep Learning - Sistemas de Recomendação na prática
- Projeto: [Como funcionam Sistemas de Recomendação](module-03)

### Módulo 04 : Web Machine Learning - Como vencer qualquer jogo
- Projeto: [Como Vencer Qualquer Jogo](module-04)

### Módulo 05: Inteligência artificial na Web
- Projeto: [Web AI Teste](module-05)

- Projeto: [Web AI Chat Interativo](module-05-a)

- Projeto: [Web AI Multi Modal](module-05-b)

### Módulo 06: Prompt Engineering
- Sem projetos

### Módulo 07: Ferramentas de IA para acelerar sua vida como Dev
- Sem projetos

### Módulo 08: MCPs e Automação para Devs
- Projeto: [Usando IA para: Gerar testes automatizados](module-08)
  - Selecione a LLM ideal para a execução
  - Sequência: 
    - Copiar texto de project-scaffolding.md no chat
    - Enviar
    - Enviar arquivo generate_test.prompt.md para o chat
    - Copiar texto de generate-tests.md
    - Enviar
  - Verificar resultados a cada interação com a LLM

- Projeto: [Usando IA para: Navegar em sites e extrair informações](module-08-a)
  - Selecione a LLM ideal para a execução
  - Sequência: 
    - Copiar texto de prompt.md no chat
    - Enviar
  - Não é gerado nenhum código, apenas manipula a DOM da página para preencher dados no formulário conforme solicitado

- Projeto: [Usando IA para: Consultar documentações atualizadas](module-08-b)
  - Selecione a LLM ideal para a execução, de preferência versão premium
  - Sequência: 
    - Copiar texto de prompt.md no chat
    - Enviar
  - É esperado a criação de um projeto simples de autenticação usando o GitHub

- Projeto: [Usando IA para: Colher dados de Telemetria de apps](module-08-c)
  - Subir infra usando docker-compose-infra.yaml
  - Instalar dependência e subir aplicação _alumnus
  - http://localhost:3000/ para verificar se o Grafana está executando
  - Após usar uma pasta vazia para não dar contexto para a IA, forçando ela usar a ferramenta de MCP do Grafana
  - Enviar prompt que está em docs/prompt.md, pegue a parte Single Comprehensive Prompt, mais precisamente os passos de 1 a 5
  - Por fim aguardar a reposta do que está acontecendo por meio do diagnóstica feito pela IA através dos datas de telemetria

### Módulo 09: Modelos open-source vs. proprietários
- Projeto: [Como rodar modelos localmente com Ollama](module-09)
  - Instalado Ollama localmente para testar comunicação com modelos
  - Modelos testados
    - llama2-uncensored:7b
    - gpt-oss:20b
  - Testado apenas modelos pequenos devido limitações de hardware

- Projeto: [Como usar OpenRouter para orquestrar vários modelos](module-09-a)
  - Integrando com OpenRouter que é um hub de modelos de LLM e testando comunicação com eles
  - Modelos testados
    - arcee-ai/trinity-large-preview:free
    - google/gemma-3-27b-it:free
  - Testado com modelos free, porém funciona normalmente com modelos pagos

### Módulo 10: RAG, embeddings e busca semântica
- Projeto: [Geração Local de Embeddings](module-10)
  - Utilizado um modelo de embeddings e enviado os dados para um banco orientado a grafos para processar um arquivo PDF. 
  - Em seguida, é possível fazer pesquisas sobre determinado assunto dentro desse PDF e o banco irá devolver textos relacionados a esse assunto.
  - Tecnologias testadas
    - LangChain (orquestrador de pipelines de IA)
    - Xenova/all-MiniLM-L6-v2 (modelo de embedding)
    - Neo4j (banco orientado a grafos)

- Projeto: [Criando o primeiro RAG com JavaScript e Neo4j](module-10-a)
  - Utilizado um modelo de embeddings e enviado os dados para um banco orientado a grafos para processar um arquivo PDF.
  - Após, os dados filtrados são enviados para um modelo de IA para interá-la sobre o assunto determinado, ao ser perguntada sua resposta é mais humanizada mas mantém o escopo de informação do arquivo PDF inicial 
  - Tecnologias testadas
    - LangChain (orquestrador de pipelines de IA)
    - Xenova/all-MiniLM-L6-v2 (modelo de embedding)
    - Neo4j (banco orientado a grafos)
    - Open Router (orquestrador de LLMs)
    - arcee-ai/trinity-large-preview:free (LLM)
