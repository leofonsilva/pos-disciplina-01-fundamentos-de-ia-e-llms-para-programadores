importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest');

// Caminhos para o modelo YOLO e rótulos das classes
const MODEL_PATH = `yolov5n_web_model/model.json`;
const LABELS_PATH = `yolov5n_web_model/labels.json`;

// Dimensão que o modelo espera para as imagens de entrada (640x640 pixels)
const INPUT_MODEL_DIMENTIONS = 640

// Limiar de confiança: só consideramos detecções com pontuação acima de 0.4 (40%)
const CLASS_THRESHOLD = 0.4

// Variáveis globais para armazenar os rótulos e o modelo carregado
let _labels = []
let _model = null

/**
 * Carrega o modelo YOLO e os rótulos das classes
 */
async function loadModelAndLabels() {
  // Aguarda o TensorFlow.js estar pronto para uso
  await tf.ready()

  // Carrega os rótulos (ex: "pessoa", "carro", "kite", etc.)
  _labels = await (await fetch(LABELS_PATH)).json()
  
  // Carrega o modelo YOLO pré-treinado
  _model = await tf.loadGraphModel(MODEL_PATH)

  // Aquecer o modelo (warmup): faz uma inferência com dados fictícios
  // Isso evita lentidão na primeira inferência real
  const dummyInput = tf.ones(_model.inputs[0].shape)
  await _model.executeAsync(dummyInput)
  tf.dispose(dummyInput) // libera memória do tensor temporário

  // Avisa a thread principal que o modelo está pronto
  postMessage({ type: 'model-loaded' })
}

/**
 * Pré-processa a imagem para o formato aceito pelo YOLO
 * 
 * Etapas:
 * 1. Converte ImageBitmap/ImageData para tensor [Altura, Largura, 3 canais RGB]
 * 2. Redimensiona para 640x640 (tamanho que o YOLO espera)
 * 3. Divide por 255 para normalizar os valores para o intervalo [0, 1]
 * 4. Adiciona uma dimensão extra para o lote (batch)
 * 
 * Uso do tf.tidy(): garante que tensores temporários sejam descartados
 * automaticamente, evitando vazamento de memória
 */
function preprocessImage(input) {
  return tf.tidy(() => {
    // Converte a imagem para tensor
    const image = tf.browser.fromPixels(input)

    // Redimensiona, normaliza e adiciona dimensão de lote
    return tf.image
      .resizeBilinear(image, [INPUT_MODEL_DIMENTIONS, INPUT_MODEL_DIMENTIONS])
      .div(255)                     // normaliza para 0-1
      .expandDims(0)                 // adiciona dimensão batch
  })
}

/**
 * Executa a inferência com o modelo YOLO
 * 
 * Retorna três arrays:
 * - boxes: coordenadas das bounding boxes (x1, y1, x2, y2) normalizadas
 * - scores: pontuações de confiança para cada detecção
 * - classes: índices das classes detectadas
 */
async function runInference(tensor) {
  // Executa o modelo com o tensor de entrada
  const output = await _model.executeAsync(tensor)
  
  // Libera o tensor de entrada (já não precisamos mais dele)
  tf.dispose(tensor)
  
  // As 3 primeiras saídas do modelo são: caixas, pontuações e classes
  const [boxes, scores, classes] = output.slice(0, 3)
  
  // Converte os tensores para arrays JavaScript
  const [boxesData, scoresData, classesData] = await Promise.all(
    [
      boxes.data(),
      scores.data(),
      classes.data(),
    ]
  )

  // Libera os tensores de saída
  output.forEach(t => t.dispose())

  return {
    boxes: boxesData,
    scores: scoresData,
    classes: classesData
  }
}

/**
 * Filtra e processa as detecções encontradas pelo modelo
 * 
 * Etapas:
 * 1. Aplica o limiar de confiança (só considera detecções com score >= 0.4)
 * 2. Filtra apenas a classe desejada (neste caso, 'kite' = pipa)
 * 3. Converte coordenadas normalizadas para pixels reais (baseado no tamanho da imagem)
 * 4. Calcula o centro da bounding box (x, y)
 * 
 * Uso de generator (function*): permite enviar cada detecção assim que processada,
 * sem precisar criar uma lista intermediária, economizando memória
 */
function* processPrediction({ boxes, scores, classes }, width, height) {
  for (let index = 0; index < scores.length; index++) {
    // Ignora detecções com confiança baixa
    if (scores[index] < CLASS_THRESHOLD) continue

    // Pega o nome da classe (ex: "pessoa", "carro", "kite")
    const label = _labels[classes[index]]
    
    // Neste exemplo, só nos interessam pipas (kite)(que na verdade são os patos)
    // Se quiser outras classes, basta remover esta linha ou ajustar
    if (label !== 'kite') continue

    // Extrai as coordenadas da bounding box (formato: [x1, y1, x2, y2])
    // O modelo retorna valores normalizados entre 0 e 1
    let [x1, y1, x2, y2] = boxes.slice(index * 4, (index + 1) * 4)
    
    // Converte para pixels reais baseado no tamanho da imagem original
    x1 *= width
    x2 *= width
    y1 *= height
    y2 *= height

    // Calcula largura, altura e centro da bounding box
    const boxWidth = x2 - x1
    const boxHeight = y2 - y1
    const centerX = x1 + boxWidth / 2
    const centerY = y1 + boxHeight / 2

    // Retorna uma detecção (o yield é do generator)
    yield {
      x: centerX,
      y: centerY,
      score: (scores[index] * 100).toFixed(2) // converte para porcentagem
    }
  }
}

// Inicia o carregamento do modelo assim que o worker é criado
loadModelAndLabels()

// Escuta mensagens enviadas para este worker
self.onmessage = async ({ data }) => {
  // Só processa mensagens do tipo 'predict'
  if (data.type !== 'predict') return
  
  // Se o modelo ainda não carregou, ignora
  if (!_model) return

  // Pré-processa a imagem recebida
  const input = preprocessImage(data.image)
  
  // Guarda as dimensões originais da imagem
  const { width, height } = data.image

  // Executa a inferência
  const inferenceResults = await runInference(input)

  // Processa cada detecção encontrada e envia para a thread principal
  for (const prediction of processPrediction(inferenceResults, width, height)) {
    postMessage({
      type: 'prediction',
      ...prediction
    });
  }
};

// Avisa que o worker foi inicializado
console.log('🧠 YOLOv5n Web Worker initialized');
