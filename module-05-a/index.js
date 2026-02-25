// ESTADO GLOBAL DA APLICAÇÃO
// Guarda informações sobre a sessão atual e controle de geração
const aiContext = {
  session: null,           // Sessão atual com o modelo de IA
  abortController: null,    // Controlador para cancelar requisições em andamento
  isGenerating: false,      // Flag indicando se está gerando resposta no momento
};

// REFERÊNCIAS PARA OS ELEMENTOS DA PÁGINA (DOM)
// Agrupa todos os elementos HTML que vamos manipular
const elements = {
  temperature: document.getElementById('temperature'),      // Slider de temperatura
  temperatureValue: document.getElementById('temp-value'), // Texto mostrando valor da temperatura
  topKValue: document.getElementById('topk-value'),        // Texto mostrando valor do topK
  topK: document.getElementById('topK'),                    // Slider de topK
  form: document.getElementById('question-form'),           // Formulário da pergunta
  questionInput: document.getElementById('question'),       // Campo de texto da pergunta
  output: document.getElementById('output'),                 // Área onde a resposta aparece
  button: document.getElementById('ask-button'),             // Botão de enviar/parar
  year: document.getElementById('year'),                     // Elemento para o ano atual
}

// CONFIGURAÇÃO DOS LISTENERS DE EVENTOS
async function setupEventListeners() {

  // Quando o slider de temperatura muda, atualiza o texto ao lado
  elements.temperature.addEventListener('input', (e) => {
    elements.temperatureValue.textContent = e.target.value;
  });

  // Quando o slider de topK muda, atualiza o texto ao lado
  elements.topK.addEventListener('input', (e) => {
    elements.topKValue.textContent = e.target.value;
  });

  // Quando o formulário é enviado (botão Enter ou clique)
  elements.form.addEventListener('submit', async function (event) {
    event.preventDefault(); // Impede o recarregamento da página

    // Se já está gerando, o botão vira "Parar"
    if (aiContext.isGenerating) {
      toggleSendOrStopButton(false) // Muda para modo "Enviar" e cancela
      return;
    }

    // Se não está gerando, começa a processar a pergunta
    onSubmitQuestion();
  });
}

// PROCESSAMENTO DA PERGUNTA DO USUÁRIO
async function onSubmitQuestion() {
  const questionInput = elements.questionInput;
  const output = elements.output;
  const question = questionInput.value;

  // Se a pergunta estiver vazia, não faz nada
  if (!question.trim()) {
    return;
  }

  // Pega os valores atuais dos sliders
  const temperature = parseFloat(elements.temperature.value);
  const topK = parseInt(elements.topK.value);
  console.log('Using parameters:', { temperature, topK });

  // Muda o botão para modo "Parar"
  toggleSendOrStopButton(true)

  // Mensagem temporária enquanto processa
  output.textContent = 'Processing your question...';

  // Chama a IA e recebe um fluxo (stream) de resposta
  const aiResponseChunks = await askAI(question, temperature, topK);

  // Limpa a mensagem temporária
  output.textContent = '';

  // Itera sobre cada pedaço (chunk) da resposta
  for await (const chunk of aiResponseChunks) {
    // Se o usuário clicou em "Parar", interrompe
    if (aiContext.abortController.signal.aborted) {
      break;
    }
    console.log('Received chunk:', chunk);
    // Adiciona o novo pedaço ao texto existente
    output.textContent += chunk;
  }

  // Volta o botão para modo "Enviar"
  toggleSendOrStopButton(false);
}

// ALTERNAR ENTRE BOTÃO "ENVIAR" E "PARAR"
function toggleSendOrStopButton(isGenerating) {
  if (isGenerating) {
    // Muda para modo "Parar"
    aiContext.isGenerating = isGenerating;
    elements.button.textContent = 'Parar';
    elements.button.classList.add('stop-button'); // Adiciona estilo vermelho
  } else {
    // Muda para modo "Enviar"
    aiContext.abortController?.abort(); // Cancela qualquer geração em andamento
    aiContext.isGenerating = isGenerating;
    elements.button.textContent = 'Enviar';
    elements.button.classList.remove('stop-button'); // Remove estilo vermelho
  }
}

// COMUNICAÇÃO COM O MODELO DE IA (generator function)
// O asterisco (*) indica que é uma generator function
// Isso permite enviar resultados aos poucos (yield) em vez de tudo de uma vez
async function* askAI(question, temperature, topK) {
  // Cancela qualquer requisição anterior que ainda esteja rodando
  aiContext.abortController?.abort();

  // Cria um novo controlador para esta requisição
  aiContext.abortController = new AbortController();

  // Se já existia uma sessão anterior, destrói
  if (aiContext.session) {
    aiContext.session.destroy();
  }

  // Cria uma nova sessão com os parâmetros atualizados
  const session = await LanguageModel.create({
    expectedInputLanguages: ["pt"],                     // Idioma esperado
    temperature: temperature,                            // Criatividade (0-2)
    topK: topK,                                          // Diversidade (1-128)
    initialPrompts: [                                    // Configuração do assistente
      {
        role: 'system',
        content: `
                Você é um assistente de IA que responde de forma clara e objetiva.
                Responda sempre em formato de texto ao invés de markdown`
      },
    ],
  });

  // Guarda a sessão no contexto global
  aiContext.session = session;

  // Envia a pergunta e recebe uma stream (fluxo) de resposta
  const responseStream = await session.promptStreaming(
    [
      {
        role: 'user',
        content: question,
      },
    ],
    {
      signal: aiContext.abortController.signal, // Para poder cancelar
    }
  );

  // Itera sobre cada chunk da stream e vai enviando (yield)
  for await (const chunk of responseStream) {
    if (aiContext.abortController.signal.aborted) {
      break; // Se foi cancelado, para
    }
    yield chunk; // Envia o chunk para quem chamou a função
  }
}

// VERIFICAÇÃO DE REQUISITOS (navegador + modelo)
async function checkRequirements() {
  const errors = [];
  const returnResults = () => errors.length ? errors : null;

  // Verifica se é Chrome (as APIs nativas só funcionam no Chrome)
  // @ts-ignore
  const isChrome = !!window.chrome;
  if (!isChrome)
    errors.push("Este recurso só funciona no Google Chrome ou Chrome Canary (versão recente).");

  // Verifica se a API LanguageModel existe no navegador
  if (!('LanguageModel' in self)) {
    errors.push("As APIs nativas de IA não estão ativas.");
    errors.push("Ative a seguinte flag em chrome://flags/:");
    errors.push("- Prompt API for Gemini Nano (chrome://flags/#prompt-api-for-gemini-nano)");
    errors.push("Depois reinicie o Chrome e tente novamente.");
    return returnResults();
  }

  // Verifica a disponibilidade do modelo para português
  const availability = await LanguageModel.availability({ languages: ["pt"] });
  console.log('Language Model Availability:', availability);

  // Se já está disponível, tudo ok
  if (availability === 'available') {
    return returnResults();
  }

  // Casos de erro ou necessidade de download
  if (availability === 'unavailable') {
    errors.push(`O seu dispositivo não suporta modelos de linguagem nativos de IA.`);
  }

  if (availability === 'downloading') {
    errors.push(`O modelo de linguagem de IA está sendo baixado. Por favor, aguarde alguns minutos e tente novamente.`);
  }

  if (availability === 'downloadable') {
    errors.push(`O modelo de linguagem de IA precisa ser baixado, baixando agora... (acompanhe o progresso no terminal do chrome)`);

    // Tenta fazer o download do modelo
    try {
      const session = await LanguageModel.create({
        expectedInputLanguages: ["pt"],
        monitor(m) {
          // Monitora o progresso do download
          m.addEventListener('downloadprogress', (e) => {
            const percent = ((e.loaded / e.total) * 100).toFixed(0);
            console.log(`Downloaded ${percent}%`);
          });
        }
      });

      // Testa se o modelo funcionou
      await session.prompt('Olá');
      session.destroy();

      // Verifica novamente a disponibilidade
      const newAvailability = await LanguageModel.availability({ languages: ["pt"] });
      if (newAvailability === 'available') {
        return null; // Download successful
      }
    } catch (error) {
      console.error('Error downloading model:', error);
      errors.push(`⚠️ Erro ao baixar o modelo: ${error.message}`);
    }
  }

  return returnResults();
}

// FUNÇÃO PRINCIPAL (executada quando a página carrega)
(async function main() {
  // Atualiza o ano no rodapé (copyright automático)
  elements.year.textContent = new Date().getFullYear();

  // Verifica se o navegador suporta as APIs
  const reqErrors = await checkRequirements();
  if (reqErrors) {
    // Se tiver erros, mostra na tela e desabilita o botão
    elements.output.innerHTML = reqErrors.join('<br/>');
    elements.button.disabled = true;
    return;
  }

  // Pega os parâmetros padrão do modelo
  const params = await LanguageModel.params();
  console.log('Language Model Params:', params);
  /*
  Valores típicos:
  defaultTemperature: 1
  defaultTopK: 3
  maxTemperature: 2
  maxTopK: 128
  */

  // Configura os sliders com os valores padrão do modelo
  elements.topK.max = params.maxTopK;
  elements.topK.min = 1;
  elements.topK.value = params.defaultTopK;
  elements.topKValue.textContent = params.defaultTopK;

  elements.temperatureValue.textContent = params.defaultTemperature;
  elements.temperature.max = params.maxTemperature;
  elements.temperature.min = 0;
  elements.temperature.value = params.defaultTemperature;

  // Configura todos os listeners de eventos
  return setupEventListeners()
})();
