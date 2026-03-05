import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { CONFIG } from "./config.ts";
import { DocumentProcessor } from "./documentProcessor.ts";
import { type PretrainedOptions } from "@huggingface/transformers";
import { Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector";
import { displayResults } from "./util.ts";

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

  // Cria um processador para carregar e dividir o PDF em pedaços menores
  const documentProcessor = new DocumentProcessor(
    CONFIG.pdf.path,           // Caminho do arquivo PDF
    CONFIG.textSplitter,       // Configuração de como dividir o texto
  )
  
  // Carrega o PDF e divide em chunks (pedaços) para processamento
  const documents = await documentProcessor.loadAndSplit()
  
  // Configura o modelo de embeddings que vai transformar textos em vetores numéricos
  // Esses vetores representam o significado semântico do texto
  const embeddings = new HuggingFaceTransformersEmbeddings({
    model: CONFIG.embedding.modelName,                    // Nome do modelo (ex: all-MiniLM-L6-v2)
    pretrainedOptions: CONFIG.embedding.pretrainedOptions as PretrainedOptions  // Configurações do modelo
  })
  
  // Código comentado que poderia testar a criação de embeddings para palavras isoladas
  // const response = await embeddings.embedQuery(
  //     "JavaScript"
  // )
  // const response = await embeddings.embedDocuments([
  //     "JavaScript"
  // ])
  // console.log('response', response)

  // Conecta a um grafo Neo4j existente para usar como armazenamento de vetores
  // O Neo4j guardará tanto o texto original quanto seus vetores de embedding
  _neo4jVectorStore = await Neo4jVectorStore.fromExistingGraph(
    embeddings,
    CONFIG.neo4j
  )

  // Limpa documentos antigos antes de adicionar os novos
  clearAll(_neo4jVectorStore, CONFIG.neo4j.nodeLabel)
  
  // Adiciona cada chunk de documento ao Neo4j, um por um
  for (const [index, doc] of documents.entries()) {
    console.log(`✅ Adicionando documento ${index + 1}/${documents.length}`);
    await _neo4jVectorStore.addDocuments([doc])
  }
  console.log("\n✅ Base de dados populada com sucesso!\n");

  // ==================== EXECUTAR BUSCA POR SIMILARIDADE ====================
  // Agora vamos testar o sistema fazendo perguntas sobre o conteúdo do PDF
  console.log("🔍 Executando buscas por similaridade...\n");
  
  // Lista de perguntas para testar a busca semântica
  const questions = [
    "O que são tensores e como são representados em JavaScript?",
    "Como converter objetos JavaScript em tensores?",
    "O que é normalização de dados e por que é necessária?",
    "Como funciona uma rede neural no TensorFlow.js?",
    "O que significa treinar uma rede neural?",
    "o que é hot enconding e quando usar?"
  ]

  // Para cada pergunta, busca os trechos mais relevantes do documento
  for (const question of questions) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📌 PERGUNTA: ${question}`);
    console.log('='.repeat(80));

    // Faz uma busca por similaridade: encontra os chunks com significado mais próximo da pergunta
    const results = await _neo4jVectorStore.similaritySearch(
      question,                // Texto da pergunta
      CONFIG.similarity.topK    // Número de resultados a retornar (ex: 5 chunks mais relevantes)
    )
    
    // Mostra os resultados de forma organizada
    displayResults(results)
    // console.log(results)  // Versão sem formatação, comentada
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