// index.js - Arquivo principal que inicia toda a aplicação

// Importa as dependências necessárias
import { AIService } from './services/aiService.js';           // Serviço de IA
import { TranslationService } from './services/translationService.js'; // Serviço de tradução
import { View } from './views/view.js';                         // Camada de visualização
import { FormController } from './controllers/formController.js'; // Controlador do formulário

// Função auto-executável que inicia a aplicação
(async function main() {
  // 1 - INICIALIZAÇÃO DOS SERVIÇOS E VIEW
  const aiService = new AIService();              // Cria instância do serviço de IA
  const translationService = new TranslationService(); // Cria instância do serviço de tradução
  const view = new View();                         // Cria instância da view

  // 2 - CONFIGURAÇÕES INICIAIS
  view.setYear(); // Atualiza o ano no rodapé automaticamente

  // 3 - VERIFICAÇÃO DE REQUISITOS
  // Checa se o navegador suporta as APIs necessárias
  const errors = await aiService.checkRequirements();
  if (errors) {
    view.showError(errors); // Mostra erros na tela se houver
    return; // Para a execução
  }

  // 4 - INICIALIZA TRADUÇÃO
  try {
    await translationService.initialize(); // Prepara o serviço de tradução
  } catch (error) {
    console.error('Error initializing translation:', error);
    view.showError([error.message]);
    return;
  }

  // 5 - CONFIGURA PARÂMETROS DA IA
  const params = await aiService.getParams(); // Pega valores padrão do modelo
  view.initializeParameters(params); // Ajusta os sliders com esses valores

  // 6 - INICIALIZA CONTROLADOR E EVENTOS
  const controller = new FormController(aiService, translationService, view);
  controller.setupEventListeners(); // Configura todos os listeners de eventos

  console.log('Application initialized successfully');
})();
