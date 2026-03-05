import { type Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";

// Tipo para função de log que ajuda no debug do sistema
type DebugLog = (...args: unknown[]) => void;

// Configurações necessárias para a classe AI funcionar
type params = {
  debugLog: DebugLog,                  // Função para mostrar mensagens de debug
  vectorStore: Neo4jVectorStore,        // Banco de vetores onde os documentos estão armazenados
  nlpModel: ChatOpenAI,                  // Modelo de linguagem (ex: GPT) para gerar respostas
  promptConfig: any,                     // Configurações do prompt (papel, tom, formato)
  templateText: string,                   // Template do prompt que será preenchido
  topK: number,                           // Número de documentos mais relevantes a buscar
}

// Estado que será passado entre as etapas do processo
interface ChainState {
  question: string;        // Pergunta do usuário
  context?: string;        // Contexto encontrado na busca (trechos relevantes)
  topScore?: number;       // Pontuação de similaridade do melhor resultado
  error?: string;          // Mensagem de erro, se houver
  answer?: string;         // Resposta final gerada pela IA
}

export class AI {
  private params: params
  
  constructor(params: params) {
    this.params = params
  }

  // ETAPA 1: Busca por similaridade no banco de vetores
  // Encontra os trechos do documento que são mais relevantes para a pergunta
  async retrieveVectorSearchResults(input: ChainState): Promise<ChainState> {
    this.params.debugLog("🔍 Buscando no vector store do Neo4j...");
    
    // Busca os documentos mais similares à pergunta, retornando também a pontuação de similaridade
    const vectorResults = await this.params.vectorStore.similaritySearchWithScore(input.question, this.params.topK);

    // Se não encontrar nada, retorna um erro amigável
    if (!vectorResults.length) {
      this.params.debugLog("⚠️  Nenhum resultado encontrado no vector store.");
      return {
        ...input,
        error: "Desculpe, não encontrei informações relevantes sobre essa pergunta na base de conhecimento."
      };
    }

    // Pega a pontuação do resultado mais relevante (primeiro da lista)
    const topScore = vectorResults[0]![1]
    this.params.debugLog(`✅ Encontrados ${vectorResults.length} resultados relevantes (melhor score: ${topScore.toFixed(3)})`);

    // Filtra apenas resultados com pontuação acima de 0.5 (mais relevantes)
    // Junta todos os textos encontrados em um único contexto separado por marcadores
    const contexts = vectorResults
      .filter(([, score]) => score > 0.5)
      .map(([doc]) => doc.pageContent)
      .join("\n\n---\n\n");

    return {
      ...input,
      context: contexts,     // Textos relevantes encontrados
      topScore,              // Pontuação do melhor resultado
    }
  }

  // ETAPA 2: Geração de resposta usando o modelo de linguagem
  // Usa o contexto encontrado para responder à pergunta de forma natural
  async generateNLPResponse(input: ChainState): Promise<ChainState> {
    // Se houve erro na etapa anterior, não tenta gerar resposta
    if (input.error) return input
    
    this.params.debugLog("🤖 Gerando resposta com IA...");

    // Cria um template de prompt com as instruções para o modelo
    const responsePrompt = ChatPromptTemplate.fromTemplate(
      this.params.templateText
    )
    
    // Monta uma sequência: prompt → modelo de IA → parser de texto
    const responseChain = responsePrompt
      .pipe(this.params.nlpModel)           // Envia o prompt para o modelo
      .pipe(new StringOutputParser())        // Converte a resposta em texto simples

    // Executa o modelo com todas as configurações e o contexto encontrado
    const rawResponse = await responseChain.invoke({
      role: this.params.promptConfig.role,                    // Papel da IA (ex: "assistente especialista")
      task: this.params.promptConfig.task,                    // Tarefa a ser executada
      tone: this.params.promptConfig.constraints.tone,        // Tom da resposta (ex: "didático")
      language: this.params.promptConfig.constraints.language, // Idioma da resposta
      format: this.params.promptConfig.constraints.format,     // Formato esperado (ex: "markdown")
      instructions: this.params.promptConfig.instructions.map((instruction: string, idx: number) =>
        `${idx + 1}. ${instruction}`                           // Lista numerada de instruções
      ).join('\n'),
      question: input.question,                                // Pergunta original do usuário
      context: input.context                                   // Contexto encontrado na busca
    })

    return {
      ...input,
      answer: rawResponse,    // Resposta gerada pela IA
    }
  }

  // Método principal que integra todo o fluxo: busca + geração de resposta
  async answerQuestion(question: string) {
    // Cria uma sequência executável que vai passar o estado pelas duas etapas
    const chain = RunnableSequence.from([
      this.retrieveVectorSearchResults.bind(this),  // Primeiro: busca no vetor store
      this.generateNLPResponse.bind(this)           // Segundo: gera resposta com IA
    ])
    
    // Executa a sequência com a pergunta do usuário
    const result = await chain.invoke({ question })
    
    // Mostra no console o resultado final
    this.params.debugLog("\n🎙️  Pergunta:");
    this.params.debugLog(question, "\n");
    this.params.debugLog("💬 Resposta:");
    this.params.debugLog(result.answer || result.error, "\n");

    return result
  }
}
