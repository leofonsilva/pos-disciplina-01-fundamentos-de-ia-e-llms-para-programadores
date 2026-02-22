import tf from '@tensorflow/tfjs-node';

async function trainModel(inputXs, outputYs) {
  const model = tf.sequential()

  // Primeira camada da rede neural
  // Recebe 7 entradas: idade normalizada + 3 cores (one-hot) + 3 localizações (one-hot)
  // Usa 80 neurônios porque temos poucos exemplos de treino
  // Mais neurônios = mais capacidade de aprendizado, mas também mais processamento
  // Ativação ReLU: só repassa valores positivos para frente
  // Valores negativos ou zero são "ignorados" (não passam informação útil)
  model.add(tf.layers.dense({ inputShape: [7], units: 80, activation: 'relu' }))

  // Camada de saída com 3 neurônios (um para cada categoria: premium, medium, basic)
  // Softmax: transforma os valores em probabilidades que somam 100%
  // Exemplo: [0.7, 0.2, 0.1] = 70% premium, 20% medium, 10% basic
  model.add(tf.layers.dense({ units: 3, activation: 'softmax' }))

  // Compilando o modelo - configurando como ele vai aprender
  // Optimizer Adam: algoritmo que ajusta os pesos de forma inteligente
  // Ele aprende com os erros e acertos anteriores para melhorar as próximas tentativas
  // Loss categoricalCrossentropy: mede o erro entre o previsto e o real
  // Quanto maior a diferença, maior o erro (loss)
  // Ideal para problemas de classificação com múltiplas categorias
  // Metrics accuracy: acompanha a taxa de acertos durante o treinamento
  model.compile({
    optimizer: 'adam',
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  })

  // Treinamento do modelo
  // verbose: 0 = não mostra logs internos (usamos só o callback personalizado)
  // epochs: 100 = passa pelo dataset completo 100 vezes
  // shuffle: true = embaralha os dados a cada época para evitar padrões indesejados
  // Callback onEpochEnd: mostra o erro (loss) ao final de cada época
  await model.fit(
    inputXs,
    outputYs,
    {
      verbose: 0,
      epochs: 100,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, log) => console.log(
          `Epoch: ${epoch}: loss = ${log.loss}`
        )
      }
    }
  )

  return model
}

async function predict(model, pessoa) {
  // Converte o array JavaScript para tensor (formato que o TensorFlow entende)
  const tfInput = tf.tensor2d(pessoa)

  // Faz a previsão: retorna 3 probabilidades (uma para cada categoria)
  const pred = model.predict(tfInput)
  const predArray = await pred.array()

  // Retorna array com probabilidade e índice de cada categoria
  // Exemplo: [{ prob: 0.7, index: 0 }, { prob: 0.2, index: 1 }, ...]
  return predArray[0].map((prob, index) => ({ prob, index }))
}

// Exemplo de pessoas para treino (cada pessoa com idade, cor e localização)
// const people = [
//     { nome: "Erick", idade: 30, cor: "azul", localizacao: "São Paulo" },
//     { nome: "Ana", idade: 25, cor: "vermelho", localizacao: "Rio" },
//     { nome: "Carlos", idade: 40, cor: "verde", localizacao: "Curitiba" }
// ];

// Dados de entrada convertidos para números (redes neurais só entendem números)
// Cada linha representa uma pessoa com suas características codificadas
const normalizedPeopleTensor = [
  [0.33, 1, 0, 0, 1, 0, 0], // Erick: idade 0.33, cor azul, local SP
  [0,    0, 1, 0, 0, 1, 0],    // Ana: idade 0, cor vermelho, local Rio
  [1,    0, 0, 1, 0, 0, 1]     // Carlos: idade 1, cor verde, local Curitiba
]

// Categorias que queremos prever (codificadas em one-hot)
// Ordem: [premium, medium, basic]
const labelsName = ["premium", "medium", "basic"];
const tensorLabels = [
  [1, 0, 0], // premium - Erick
  [0, 1, 0], // medium - Ana
  [0, 0, 1]  // basic - Carlos
];

// Converte os arrays para tensores - dados prontos para o treinamento
const inputXs = tf.tensor2d(normalizedPeopleTensor)
const outputYs = tf.tensor2d(tensorLabels)

// Mostra os dados normalizados para verificação
inputXs.print();
outputYs.print();

// Treina o modelo com os dados disponíveis
// Quanto mais dados de treino, melhor o modelo aprende padrões complexos
const model = await trainModel(inputXs, outputYs)

// Exemplo de pessoa para testar o modelo treinado
// const newPersonTest = { nome: 'Zé', idade: 28, cor: 'verde', localizacao: "Curitiba" }

// Normalizando a idade da nova pessoa usando o mesmo padrão do treino
// idade_min = 25, idade_max = 40, então (28 - 25) / (40 - 25) = 0.2
// Como a normalização é manual, deve-se atentar a entrada de dados correta
// Se você colocar lixo para dentro, o modelo vai devolver lixo para fora
// Garbage In, Garbage Out
const normalizedNewPersonTestTensor = [
  [
    0.2, // idade normalizada?
    0,   // cor azul?
    0,   // cor vermelho?
    1,   // cor verde?
    0,   // localização São Paulo?
    0,   // localização Rio?
    1    // localização Curitiba?
  ]
]

// Faz a previsão para a nova pessoa
const predictions = await predict(model, normalizedNewPersonTestTensor)

// Organiza os resultados da maior para menor probabilidade
// Mostra cada categoria com sua respectiva probabilidade em porcentagem
const results = predictions
  .sort((a, b) => b.prob - a.prob)
  .map(p => `${labelsName[p.index]} (${(p.prob * 100).toFixed(2)}%)`)
  .join('\n')

console.log(results)
