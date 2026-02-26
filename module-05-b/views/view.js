// view.js - Responsável por tudo que o usuário vê e interage
// Não tem lógica de negócio, só manipulação do DOM

export class View {
  constructor() {
    // Agrupa todos os elementos HTML em um objeto para fácil acesso
    this.elements = {
      temperature: document.getElementById('temperature'),      // Slider temperatura
      temperatureValue: document.getElementById('temp-value'), // Valor mostrado
      topKValue: document.getElementById('topk-value'),       // Valor mostrado topK
      topK: document.getElementById('topK'),                   // Slider topK
      form: document.getElementById('question-form'),          // Formulário
      questionInput: document.getElementById('question'),      // Campo pergunta
      output: document.getElementById('output'),               // Área resposta
      button: document.getElementById('ask-button'),           // Botão
      year: document.getElementById('year'),                   // Ano rodapé
      fileInput: document.getElementById('file-input'),        // Input arquivo
      filePreview: document.getElementById('file-preview'),    // Prévia do arquivo
      fileUploadBtn: document.getElementById('file-upload-btn'), // Botão upload
      fileSelectedName: document.getElementById('file-selected-name'), // Nome arquivo
    };
  }

  // Define o ano atual no rodapé
  setYear() {
    this.elements.year.textContent = new Date().getFullYear();
  }

  // Configura os sliders com os valores padrão do modelo
  initializeParameters(params) {
    // topK: controla diversidade das respostas
    this.elements.topK.max = params.maxTopK;
    this.elements.topK.min = 1;
    this.elements.topK.value = params.defaultTopK;
    this.elements.topKValue.textContent = params.defaultTopK;

    // temperature: controla criatividade
    this.elements.temperatureValue.textContent = params.defaultTemperature;
    this.elements.temperature.max = params.maxTemperature;
    this.elements.temperature.min = 0;
    this.elements.temperature.value = params.defaultTemperature;
  }

  // Getters - pegam valores dos inputs
  updateTemperatureDisplay(value) {
    this.elements.temperatureValue.textContent = value;
  }

  updateTopKDisplay(value) {
    this.elements.topKValue.textContent = value;
  }

  getQuestionText() {
    return this.elements.questionInput.value;
  }

  getTemperature() {
    return parseFloat(this.elements.temperature.value);
  }

  getTopK() {
    return parseInt(this.elements.topK.value);
  }

  getFile() {
    return this.elements.fileInput.files[0];
  }

  // Manipulação da saída (output)
  setOutput(text) {
    this.elements.output.textContent = text; // Substitui todo o texto
  }

  appendOutput(text) {
    this.elements.output.textContent += text; // Adiciona ao texto existente
  }

  // Exibe erros na tela
  showError(errors) {
    this.elements.output.innerHTML = errors.join('<br/>');
    this.elements.button.disabled = true; // Desabilita o botão
  }

  // Controle do botão (modo enviar/parar)
  setButtonToStopMode() {
    this.elements.button.textContent = 'Parar';
    this.elements.button.classList.add('stop-button');
  }

  setButtonToSendMode() {
    this.elements.button.textContent = 'Enviar';
    this.elements.button.classList.remove('stop-button');
  }

  // Preview de arquivos (imagem/áudio)
  handleFilePreview(event) {
    const file = event.target.files[0];
    this.elements.filePreview.innerHTML = '';
    this.elements.fileSelectedName.textContent = '';

    if (!file) return;

    // Mostra nome do arquivo selecionado
    this.elements.fileSelectedName.textContent = `✓ ${file.name}`;
    this.elements.fileSelectedName.classList.add('selected');

    const fileType = file.type.split('/')[0];
    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-info';

    // Cria preview baseado no tipo do arquivo
    if (fileType === 'image') {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.className = 'preview-image';
      fileInfo.appendChild(img);
    } else if (fileType === 'audio') {
      const audio = document.createElement('audio');
      audio.src = URL.createObjectURL(file);
      audio.controls = true;
      audio.className = 'preview-audio';
      fileInfo.appendChild(audio);
    }

    // Botão para remover o arquivo
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-file-btn';
    removeBtn.textContent = '× Remover arquivo';
    removeBtn.onclick = () => {
      this.elements.fileInput.value = '';
      this.elements.filePreview.innerHTML = '';
      this.elements.fileSelectedName.textContent = '';
      this.elements.fileSelectedName.classList.remove('selected');
    };
    fileInfo.appendChild(removeBtn);

    this.elements.filePreview.appendChild(fileInfo);
  }

  // Aciona o input de arquivo (quando clica no botão)
  triggerFileInput() {
    this.elements.fileInput.click();
  }

  // Event listeners - a view só notifica, não processa
  onTemperatureChange(callback) {
    this.elements.temperature.addEventListener('input', callback);
  }

  onTopKChange(callback) {
    this.elements.topK.addEventListener('input', callback);
  }

  onFileChange(callback) {
    this.elements.fileInput.addEventListener('change', callback);
  }

  onFileButtonClick(callback) {
    this.elements.fileUploadBtn.addEventListener('click', callback);
  }

  onFormSubmit(callback) {
    this.elements.form.addEventListener('submit', callback);
  }
}
