// translationService.js - Responsável por tradução e detecção de idioma

export class TranslationService {
  constructor() {
    this.translator = null;        // Tradutor EN → PT
    this.languageDetector = null;   // Detector de idioma
  }

  // Inicializa os serviços de tradução
  async initialize() {
    try {
      // Cria tradutor (inglês → português)
      this.translator = await Translator.create({
        sourceLanguage: 'en',
        targetLanguage: 'pt',
        monitor(m) {
          // Monitora download do modelo (se necessário)
          m.addEventListener('downloadprogress', (e) => {
            const percent = ((e.loaded / e.total) * 100).toFixed(0);
            console.log(`Translator downloaded ${percent}%`);
          });
        }
      });
      console.log('Translator initialized');

      // Cria detector de idioma
      this.languageDetector = await LanguageDetector.create();
      console.log('Language Detector initialized');

      return true;
    } catch (error) {
      console.error('Error initializing translation:', error);
      throw new Error('Erro ao inicializar APIs de tradução.');
    }
  }

  // Traduz texto para português (se necessário)
  async translateToPortuguese(text) {
    if (!this.translator) {
      console.warn('Translator not available, returning original text');
      return text;
    }

    try {
      // PRIMEIRO: detecta o idioma do texto
      if (this.languageDetector) {
        const detectionResults = await this.languageDetector.detect(text);
        console.log('Detected languages:', detectionResults);

        // Se já está em português, não precisa traduzir
        if (detectionResults && detectionResults[0]?.detectedLanguage === 'pt') {
          console.log('Text is already in Portuguese');
          return text;
        }
      }

      // SE NÃO ESTIVER EM PT: traduz usando streaming
      const stream = this.translator.translateStreaming(text);
      let translated = '';
      for await (const chunk of stream) {
        translated = chunk; // Cada chunk é a tradução completa até agora
      }
      console.log('Translated text:', translated);
      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Se erro, retorna texto original
    }
  }
}
