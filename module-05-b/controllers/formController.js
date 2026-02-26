// formController.js - Cérebro da aplicação, conecta View e Services
// Decide o que fazer quando o usuário interage

export class FormController {
  constructor(aiService, translationService, view) {
    this.aiService = aiService;           // Serviço de IA
    this.translationService = translationService; // Serviço de tradução
    this.view = view;                      // View
    this.isGenerating = false;              // Estado: está gerando resposta?
  }

  // Configura todos os eventos da interface
  setupEventListeners() {
    // Slider de temperatura: atualiza display
    this.view.onTemperatureChange((e) => {
      this.view.updateTemperatureDisplay(e.target.value);
    });

    // Slider de topK: atualiza display
    this.view.onTopKChange((e) => {
      this.view.updateTopKDisplay(e.target.value);
    });

    // Upload de arquivo: mostra preview
    this.view.onFileChange((event) => {
      this.view.handleFilePreview(event);
    });

    // Clique no botão de upload
    this.view.onFileButtonClick(() => {
      this.view.triggerFileInput();
    });

    // Envio do formulário (principal)
    this.view.onFormSubmit(async (event) => {
      event.preventDefault(); // Não recarrega a página

      // Se já está gerando, para a geração
      if (this.isGenerating) {
        this.stopGeneration();
        return;
      }

      // Se não está gerando, processa a pergunta
      await this.handleSubmit();
    });
  }

  // Processa o envio da pergunta
  async handleSubmit() {
    const question = this.view.getQuestionText();

    // Não faz nada se pergunta vazia
    if (!question.trim()) {
      return;
    }

    // Pega valores atuais dos controles
    const temperature = this.view.getTemperature();
    const topK = this.view.getTopK();
    const file = this.view.getFile();

    console.log('Using parameters:', { temperature, topK });

    // Muda botão para modo "Parar"
    this.toggleButton(true);

    this.view.setOutput('Processing your question...');

    try {
      // Chama a IA e recebe resposta em streaming
      const aiResponseChunks = await this.aiService.createSession(
        question,
        temperature,
        topK,
        file
      );

      this.view.setOutput('');

      let fullResponse = '';
      // Processa cada pedaço da resposta
      for await (const chunk of aiResponseChunks) {
        if (this.aiService.isAborted()) {
          break; // Se cancelou, para
        }
        console.log('Received chunk:', chunk);
        fullResponse += chunk;
        this.view.setOutput(fullResponse); // Mostra em tempo real
      }

      // Traduz a resposta completa para português
      if (fullResponse && !this.aiService.isAborted()) {
        this.view.setOutput('Traduzindo resposta...');
        const translatedResponse = await this.translationService.translateToPortuguese(fullResponse);
        this.view.setOutput(translatedResponse); // Mostra tradução
      }
    } catch (error) {
      console.error('Error during AI generation:', error);
      this.view.setOutput(`Erro: ${error.message}`);
    }

    // Volta botão para modo "Enviar"
    this.toggleButton(false);
  }

  // Para a geração em andamento
  stopGeneration() {
    this.aiService.abort(); // Cancela requisição
    this.toggleButton(false); // Volta botão ao normal
  }

  // Alterna entre modo enviar/parar
  toggleButton(isGenerating) {
    this.isGenerating = isGenerating;

    if (isGenerating) {
      this.view.setButtonToStopMode();
    } else {
      this.view.setButtonToSendMode();
    }
  }
}
