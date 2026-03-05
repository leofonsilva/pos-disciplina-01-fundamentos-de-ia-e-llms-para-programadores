import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { type TextSplitterConfig } from './config.ts'

export class DocumentProcessor {
  private pdfPath: string
  private textSplitterConfig: TextSplitterConfig

  constructor(pdfPath: string, textSplitterConfig: TextSplitterConfig) {
    this.pdfPath = pdfPath
    this.textSplitterConfig = textSplitterConfig
  }

  async loadAndSplit() {
    // Cria um carregador que vai ler o arquivo PDF do caminho especificado
    const loader = new PDFLoader(this.pdfPath)
    
    // Carrega todas as páginas do PDF como documentos individuais
    const rawDocuments = await loader.load()
    
    // Mostra no console quantas páginas foram carregadas do PDF
    console.log(`📄 Loaded ${rawDocuments.length} pages from PDF`);

    // Cria um divisor de texto que vai quebrar documentos grandes em pedaços menores
    // Isso é importante porque os modelos de IA têm limite de tamanho de texto
    const splitter = new RecursiveCharacterTextSplitter(
      this.textSplitterConfig
    )
    
    // Divide os documentos em pedaços menores (chunks) para processamento
    const documents = await splitter.splitDocuments(rawDocuments)
    
    // Mostra no console em quantos pedaços o documento foi dividido
    console.log(`✂️  Split into ${documents.length} chunks`);

    // Retorna os documentos processados, mantendo apenas a informação de origem
    // Simplifica os metadados removendo informações desnecessárias
    return documents.map(doc => ({
      ...doc,
      metadata: {
        source: doc.metadata.source,
      }
    }))
  }
}
