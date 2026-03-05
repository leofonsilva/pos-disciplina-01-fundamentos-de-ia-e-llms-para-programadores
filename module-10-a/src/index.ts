import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { CONFIG } from "./config.ts";
import { DocumentProcessor } from "./documentProcessor.ts";
import { type PretrainedOptions } from "@huggingface/transformers";
import { Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector";
import { ChatOpenAI } from "@langchain/openai";
import { AI } from "./ai.ts";
import { writeFile, mkdir } from 'node:fs/promises'

let _neo4jVectorStore = null

// Função para limpar todos os documentos existentes no banco de dados Neo4j
// Isso evita duplicação quando executamos o script várias vezes
async function clearAll(vectorStore: Neo4jVectorStore, nodeLabel: string): Promise<void> {
  console.log("🗑️  Removendo todos os documentos existentes...");

  // Executa uma consulta Cypher (linguagem do Neo4j) para deletar todos os nós com o rótulo especificado
  await vectorStore.query(
    `MATCH (n:\`${nodeLabel}\`) DETACH DELETE n`
  )
  console.log("✅ Documentos removidos com sucesso\n");
}

try {
  console.log("🚀 Inicializando sistema de Embeddings com Neo4j...\n");

  // ETAPA 1: PREPARAÇÃO DOS DOCUMENTOS
  // Cria um processador para carregar e dividir o PDF em pedaços menores
  const documentProcessor = new DocumentProcessor(
    CONFIG.pdf.path,           // Caminho do arquivo PDF
    CONFIG.textSplitter,       // Configuração de como dividir o texto (tamanho dos chunks, sobreposição)
  )

  // Carrega o PDF e divide em chunks (pedaços) para processamento
  const documents = await documentProcessor.loadAndSplit()

  // ETAPA 2: CONFIGURAÇÃO DOS MODELOS DE IA
  // Configura o modelo de embeddings que vai transformar textos em vetores numéricos
  // Esses vetores representam o significado semântico do texto
  const embeddings = new HuggingFaceTransformersEmbeddings({
    model: CONFIG.embedding.modelName,                    // Nome do modelo (ex: all-MiniLM-L6-v2)
    pretrainedOptions: CONFIG.embedding.pretrainedOptions as PretrainedOptions  // Configurações do modelo
  })

  // Configura o modelo de linguagem (LLM) que vai gerar as respostas em linguagem natural
  // Usamos OpenRouter que dá acesso a vários modelos como GPT, Claude, etc.
  const nlpModel = new ChatOpenAI({
    temperature: CONFIG.openRouter.temperature,           // Controla criatividade (0 = mais preciso, 1 = mais criativo)
    maxRetries: CONFIG.openRouter.maxRetries,             // Número de tentativas em caso de falha
    modelName: CONFIG.openRouter.nlpModel,                // Modelo escolhido (ex: openai/gpt-4)
    openAIApiKey: CONFIG.openRouter.apiKey,               // Chave de API do OpenRouter
    configuration: {
      baseURL: CONFIG.openRouter.url,                      // URL da API do OpenRouter
      defaultHeaders: CONFIG.openRouter.defaultHeaders     // Headers adicionais para a requisição
    }
  })

  // Código comentado que poderia testar a criação de embeddings para palavras isoladas
  // const response = await embeddings.embedQuery(
  //     "JavaScript"
  // )
  // const response = await embeddings.embedDocuments([
  //     "JavaScript"
  // ])
  // console.log('response', response)

  // ETAPA 3: CONFIGURAÇÃO DO BANCO DE VETORES
  // Conecta a um grafo Neo4j existente para usar como armazenamento de vetores
  // O Neo4j guardará tanto o texto original quanto seus vetores de embedding
  _neo4jVectorStore = await Neo4jVectorStore.fromExistingGraph(
    embeddings,
    CONFIG.neo4j
  )

  // ETAPA 4: POPULAÇÃO DO BANCO DE DADOS
  // Limpa documentos antigos antes de adicionar os novos
  clearAll(_neo4jVectorStore, CONFIG.neo4j.nodeLabel)

  // Adiciona cada chunk de documento ao Neo4j, um por um
  for (const [index, doc] of documents.entries()) {
    console.log(`✅ Adicionando documento ${index + 1}/${documents.length}`);
    await _neo4jVectorStore.addDocuments([doc])
  }
  console.log("\n✅ Base de dados populada com sucesso!\n");

  // ==================== ETAPA 5: SISTEMA DE PERGUNTAS E RESPOSTAS ====================
  // Agora vamos usar o RAG (Retrieval-Augmented Generation) para responder perguntas
  // O sistema busca trechos relevantes e usa a IA para gerar respostas coerentes
  console.log("🔍 Executando buscas por similaridade...\n");

  // Lista de perguntas para testar o sistema RAG
  const questions = [
    "O que são tensores e como são representados em JavaScript?",
    "Como converter objetos JavaScript em tensores?",
    "O que é normalização de dados e por que é necessária?",
    "Como funciona uma rede neural no TensorFlow.js?",
    "O que significa treinar uma rede neural?",
    "o que é hot enconding e quando usar?"
  ]

  // Cria uma instância do sistema de IA que integra busca + geração de resposta
  const ai = new AI({
    nlpModel,                                         // Modelo de linguagem para gerar respostas
    debugLog: console.log,                             // Função para mostrar logs no console
    vectorStore: _neo4jVectorStore,                    // Banco de vetores com os documentos
    promptConfig: CONFIG.promptConfig,                 // Configurações do prompt (papel, tom, formato)
    templateText: CONFIG.templateText,                  // Template do prompt que será preenchido
    topK: CONFIG.similarity.topK,                       // Número de documentos relevantes a buscar
  })

  // Processa cada pergunta da lista
  for (const index in questions) {
    const question = questions[index]
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📌 PERGUNTA: ${question}`);
    console.log('='.repeat(80));
    
    // Envia a pergunta para o sistema de IA e aguarda a resposta
    const result = await ai.answerQuestion(question!)
    
    // Se houve erro na busca (ex: nenhum documento relevante), mostra o erro e pula para próxima pergunta
    if (result.error) {
      console.log(`\n❌ Erro: ${result.error}\n`);
      continue
    }

    // Mostra a resposta gerada no console
    console.log(`\n${result.answer}\n`);
    
    // ETAPA 6: SALVAMENTO DAS RESPOSTAS EM ARQUIVO
    // Cria a pasta de respostas se ela não existir
    await mkdir(CONFIG.output.answersFolder, { recursive: true })

    // Gera um nome único para o arquivo: nome-base + índice da pergunta + timestamp
    const fileName = `${CONFIG.output.answersFolder}/${CONFIG.output.fileName}-${index}-${Date.now()}.md`

    // Salva a resposta em um arquivo markdown para consulta posterior
    await writeFile(fileName, result.answer!)
  }

  // Limpeza final
  console.log(`\n${'='.repeat(80)}`);
  console.log("✅ Processamento concluído com sucesso!\n");

} catch (error) {
  // Captura e mostra qualquer erro que ocorra durante o processo
  console.error('error', error)
} finally {
  // Garante que a conexão com o Neo4j seja fechada mesmo se ocorrer erro
  await _neo4jVectorStore?.close();
}
