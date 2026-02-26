// aiService.js - Responsável por toda comunicação com o modelo de IA
// Isola a complexidade das APIs nativas do navegador

export class AIService {
  constructor() {
    this.session = null;           // Sessão atual com o modelo
    this.abortController = null;    // Controle de cancelamento
  }

  // Verifica se o navegador suporta todas as APIs necessárias
  async checkRequirements() {
    const errors = [];

    // Verifica se é Chrome (APIs nativas só funcionam nele)
    // @ts-ignore
    const isChrome = !!window.chrome;
    if (!isChrome) {
      errors.push("Este recurso só funciona no Google Chrome ou Chrome Canary (versão recente).");
    }

    // Verifica API de modelo de linguagem
    if (!('LanguageModel' in self)) {
      errors.push("As APIs nativas de IA não estão ativas.");
      errors.push("Ative a seguinte flag em chrome://flags/:");
      errors.push("- Prompt API for Gemini Nano (chrome://flags/#prompt-api-for-gemini-nano)");
      errors.push("Depois reinicie o Chrome e tente novamente.");
      return errors;
    }

    // Verifica API de tradução
    if ('Translator' in self) {
      const translatorAvailability = await Translator.availability({
        sourceLanguage: 'en',
        targetLanguage: 'pt'
      });
      console.log('Translator Availability:', translatorAvailability);

      if (translatorAvailability === 'no') {
        errors.push("Tradução de inglês para português não está disponível.");
      }
    } else {
      errors.push("A API de Tradução não está ativa.");
      errors.push("Ative a seguinte flag em chrome://flags/:");
      errors.push("- Translation API (chrome://flags/#translation-api)");
    }

    // Verifica API de detecção de idioma
    if (!('LanguageDetector' in self)) {
      errors.push("A API de Detecção de Idioma não está ativa.");
      errors.push("Ative a seguinte flag em chrome://flags/:");
      errors.push("- Language Detection API (chrome://flags/#language-detector-api)");
    }

    if (errors.length > 0) {
      return errors;
    }

    // Verifica disponibilidade do modelo de linguagem
    const availability = await LanguageModel.availability({ languages: ["en"] });
    console.log('Language Model Availability:', availability);

    if (availability === 'available') {
      return null; // Tudo ok!
    }

    // Trata diferentes estados de disponibilidade
    if (availability === 'unavailable') {
      errors.push(`O seu dispositivo não suporta modelos de linguagem nativos de IA.`);
    }

    if (availability === 'downloading') {
      errors.push(`O modelo de linguagem de IA está sendo baixado. Por favor, aguarde alguns minutos e tente novamente.`);
    }

    if (availability === 'downloadable') {
      errors.push(`O modelo de linguagem de IA precisa ser baixado, baixando agora...`);
      try {
        // Faz o download do modelo
        const session = await LanguageModel.create({
          expectedInputLanguages: ["en"],
          monitor(m) {
            m.addEventListener('downloadprogress', (e) => {
              const percent = ((e.loaded / e.total) * 100).toFixed(0);
              console.log(`Downloaded ${percent}%`);
            });
          }
        });
        await session.prompt('Hello'); // Testa se funcionou
        session.destroy();

        // Verifica novamente
        const newAvailability = await LanguageModel.availability({ languages: ["en"] });
        if (newAvailability === 'available') {
          return null; // Download bem-sucedido
        }
      } catch (error) {
        console.error('Error downloading model:', error);
        errors.push(`Erro ao baixar o modelo: ${error.message}`);
      }
    }

    return errors.length > 0 ? errors : null;
  }

  // Pega parâmetros padrão do modelo
  async getParams() {
    const params = await LanguageModel.params();
    console.log('Language Model Params:', params);
    return params;
  }

  // Cria uma sessão e gera resposta (streaming)
  async* createSession(question, temperature, topK, file = null) {
    // Cancela sessão anterior se existir
    this.abortController?.abort();
    this.abortController = new AbortController();

    // Destrói sessão anterior
    if (this.session) {
      this.session.destroy();
    }

    // Cria nova sessão com parâmetros atualizados
    this.session = await LanguageModel.create({
      expectedInputs: [
        { type: "text", languages: ["en"] },
        // Infelizmente não está funcionando para a minha máquina por limitação de hardware
        // { type: "audio" },
        // { type: "image" }
      ],
      expectedOutputs: [{ type: "text", languages: ["en"] }],
      temperature: temperature,
      topK: topK,
      initialPrompts: [
        {
          role: 'system',
          content: [{
            type: "text",
            value: `You are an AI assistant that responds clearly and objectively.
                        Always respond in plain text format instead of markdown.`
          }]
        },
      ],
    });

    // Constrói array de conteúdo (texto + arquivo opcional)
    const contentArray = [{ type: "text", value: question }];

    // Se tiver arquivo, adiciona ao prompt
    if (file) {
      const fileType = file.type.split('/')[0];
      if (fileType === 'image' || fileType === 'audio') {
        // Converte para blob (formato que a API espera)
        const blob = new Blob([await file.arrayBuffer()], { type: file.type });
        contentArray.push({ type: fileType, value: blob });
        console.log(`Adding ${fileType} to prompt:`, file.name);
      }
    }

    // Envia prompt e recebe stream de resposta
    const responseStream = await this.session.promptStreaming(
      [
        {
          role: 'user',
          content: contentArray,
        },
      ],
      {
        signal: this.abortController.signal, // Para poder cancelar
      }
    );

    // Itera sobre os chunks e vai retornando (yield)
    for await (const chunk of responseStream) {
      if (this.abortController.signal.aborted) {
        break;
      }
      yield chunk; // Envia cada pedaço para quem chamou
    }
  }

  // Cancela a geração atual
  abort() {
    this.abortController?.abort();
  }

  // Verifica se foi cancelado
  isAborted() {
    return this.abortController?.signal.aborted;
  }
}
