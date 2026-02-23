import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
import { workerEvents } from '../events/constants.js';

// Variáveis globais para armazenar o contexto e o modelo treinado
// Assim podemos reutilizá-los em diferentes funções (treinar, recomendar)
let _globalCtx = {};
let _model = null

// Pesos que definem a importância de cada característica na recomendação
// Categoria tem maior peso (0.4), idade tem menor peso (0.1)
// Isso significa que a categoria do produto influencia mais a decisão que a idade do usuário
const WEIGHTS = {
  category: 0.4,
  color: 0.3,
  price: 0.2,
  age: 0.1,
};

// Normaliza valores contínuos (preço, idade) para o intervalo 0-1
// Por quê? Para que todas as características tenham o mesmo peso no treinamento
// Se uma característica tem valores muito altos (ex: preço 1000) e outra muito baixos (ex: idade 30)
// a de valores altos poderia dominar o aprendizado
// Fórmula: (valor - mínimo) / (máximo - mínimo)
// Exemplo: preço = R$129,99, preço mínimo = R$39,99, preço máximo = R$199,99 → resultado 0,56
const normalize = (value, min, max) => (value - min) / ((max - min) || 1)

// Prepara os dados para o treinamento do modelo
// Coleta estatísticas e cria estruturas que serão usadas para normalizar os dados
function makeContext(products, users) {
  // Extrai todas as idades dos usuários e preços dos produtos
  const ages = users.map(u => u.age)
  const prices = products.map(p => p.price)

  // Encontra os valores mínimos e máximos para normalização
  const minAge = Math.min(...ages)
  const maxAge = Math.max(...ages)

  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  // Lista todas as cores e categorias únicas dos produtos
  const colors = [...new Set(products.map(p => p.color))]
  const categories = [...new Set(products.map(p => p.category))]

  // Cria um índice para converter cores em números
  // Exemplo: se as cores são ["azul", "vermelho"], o índice fica { azul: 0, vermelho: 1 }
  const colorsIndex = Object.fromEntries(
    colors.map((color, index) => {
      return [color, index]
    })
  )

  // Mesma coisa para categorias
  const categoriesIndex = Object.fromEntries(
    categories.map((category, index) => {
      return [category, index]
    })
  )

  // Calcula a idade média dos compradores para cada produto
  // Isso ajuda o modelo a entender qual faixa etária compra cada produto
  const midAge = (minAge + maxAge) / 2 // idade média geral (usada quando não há dados)
  const ageSums = {} // soma das idades por produto
  const ageCounts = {} // contagem de compradores por produto

  // Para cada usuário, registra a idade dele nos produtos que comprou
  users.forEach(user => {
    user.purchases.forEach(p => {
      ageSums[p.name] = (ageSums[p.name] || 0) + user.age
      ageCounts[p.name] = (ageCounts[p.name] || 0) + 1
    })
  })

  // Calcula a idade média normalizada para cada produto
  // Se um produto nunca foi comprado, usa a idade média geral
  const productAvgAgeNorm = Object.fromEntries(
    products.map(product => {
      const avg = ageCounts[product.name] ?
        ageSums[product.name] / ageCounts[product.name] :
        midAge

      return [product.name, normalize(avg, minAge, maxAge)]
    })
  )

  // Retorna todas as informações necessárias para processar os dados
  return {
    products,
    users,
    colorsIndex,      // mapeamento cor → índice
    categoriesIndex,  // mapeamento categoria → índice
    productAvgAgeNorm, // idade média normalizada por produto
    minAge,
    maxAge,
    minPrice,
    maxPrice,
    numCategories: categories.length, // quantidade total de categorias
    numColors: colors.length,          // quantidade total de cores
    // Total de dimensões do vetor de entrada: preço + idade + cores + categorias
    dimentions: 2 + categories.length + colors.length
  }
}

// Cria um vetor one-hot encoding com peso aplicado
// oneHot: cria um vetor com 1 na posição do índice e 0 nas demais
// weighted: multiplica cada valor pelo peso da característica
const oneHotWeighted = (index, length, weight) =>
  tf.oneHot(index, length).cast('float32').mul(weight)

// Converte um produto em um vetor numérico que a rede neural entende
function encodeProduct(product, context) {
  // Preço normalizado e multiplicado pelo peso
  const price = tf.tensor1d([
    normalize(product.price, context.minPrice, context.maxPrice) * WEIGHTS.price
  ])

  // Idade média dos compradores deste produto (normalizada e com peso)
  const age = tf.tensor1d([
    (context.productAvgAgeNorm[product.name] ?? 0.5) * WEIGHTS.age
  ])

  // Categoria em one-hot encoding com peso
  const category = oneHotWeighted(
    context.categoriesIndex[product.category],
    context.numCategories,
    WEIGHTS.category
  )

  // Cor em one-hot encoding com peso
  const color = oneHotWeighted(
    context.colorsIndex[product.color],
    context.numColors,
    WEIGHTS.color
  )

  // Concatena todos os vetores em um único vetor de características do produto
  return tf.concat1d(
    [price, age, category, color]
  )
}

// Converte um usuário em um vetor numérico que a rede neural entende
function encodeUser(user, context) {
  // Se o usuário já fez compras, calcula a média dos vetores dos produtos comprados
  if (user.purchases.length) {
    return tf.stack(
      user.purchases.map(
        product => encodeProduct(product, context)
      )
    )
      .mean(0) // calcula a média de todos os vetores
      .reshape([
        1,
        context.dimentions
      ])
  }

  // Se o usuário não tem compras, cria um vetor baseado apenas na idade
  // Preço, categoria e cor são zerados (desconhecidos)
  return tf.concat1d(
    [
      tf.zeros([1]), // preço ignorado (zero)
      tf.tensor1d([
        normalize(user.age, context.minAge, context.maxAge) * WEIGHTS.age
      ]),
      tf.zeros([context.numCategories]), // categoria ignorada (zero)
      tf.zeros([context.numColors]), // cor ignorada (zero)
    ]
  ).reshape([1, context.dimentions])
}

// Cria os dados de treinamento: pares (usuário, produto) com rótulo 0 ou 1
// Rótulo 1 = usuário comprou este produto, 0 = não comprou
function createTrainingData(context) {
  const inputs = []
  const labels = []

  // Para cada usuário que tem compras
  context.users
    .filter(u => u.purchases.length)
    .forEach(user => {
      const userVector = encodeUser(user, context).dataSync()

      // Para cada produto disponível
      context.products.forEach(product => {
        const productVector = encodeProduct(product, context).dataSync()

        // Verifica se este usuário comprou este produto
        const label = user.purchases.some(
          purchase => purchase.name === product.name ? 1 : 0
        )

        // Combina vetor do usuário + vetor do produto como entrada
        inputs.push([...userVector, ...productVector])
        labels.push(label) // 1 se comprou, 0 se não comprou
      })
    })

  return {
    xs: tf.tensor2d(inputs), // entradas: pares usuário + produto
    ys: tf.tensor2d(labels, [labels.length, 1]), // saídas: comprou ou não
    inputDimention: context.dimentions * 2 // tamanho = userVector + productVector
  }
}

// ====================================================================
// 📌 Exemplo de como um usuário é ANTES da codificação
// ====================================================================
//
// const exampleUser = {
//     id: 201,
//     name: 'Rafael Souza',
//     age: 27,
//     purchases: [
//         { id: 8, name: 'Boné Estiloso', category: 'acessórios', price: 39.99, color: 'preto' },
//         { id: 9, name: 'Mochila Executiva', category: 'acessórios', price: 159.99, color: 'cinza' }
//     ]
// };
//
// ====================================================================
// 📌 Após a codificação, o modelo NÃO vê nomes ou palavras.
// Ele vê um VETOR NUMÉRICO (todos normalizados entre 0–1).
// Exemplo: [preço_normalizado, idade_normalizada, cat_one_hot..., cor_one_hot...]
//
// Suponha categorias = ['acessórios', 'eletrônicos', 'vestuário']
// Suponha cores      = ['preto', 'cinza', 'azul']
//
// Para Rafael (idade 27, categoria: acessórios, cores: preto/cinza),
// o vetor poderia ficar assim:
//
// [
//   0.45,            // preço normalizado
//   0.60,            // idade normalizada
//   1, 0, 0,         // one-hot de categoria (acessórios = ativo)
//   1, 0, 0          // one-hot de cores (preto e cinza ativos, azul inativo)
// ]
//
// São esses números que vão para a rede neural.
// ====================================================================
//
// ====================================================================
// 🧠 Configuração e treinamento da rede neural
// ====================================================================
async function configureNeuralNetAndTrain(trainData) {

  const model = tf.sequential()

  // Camada de entrada
  // - inputShape: quantidade de características por exemplo (vetor usuário + vetor produto)
  // - units: 128 neurônios (quanto mais neurônios, mais padrões pode aprender)
  // - activation: 'relu' (mantém apenas valores positivos, ajuda a aprender padrões complexos)
  model.add(
    tf.layers.dense({
      inputShape: [trainData.inputDimention],
      units: 128,
      activation: 'relu'
    })
  )

  // Camada oculta 1
  // - 64 neurônios (vai reduzindo a complexidade, extraindo os padrões mais importantes)
  model.add(
    tf.layers.dense({
      units: 64,
      activation: 'relu'
    })
  )

  // Camada oculta 2
  // - 32 neurônios (continua destilando as informações mais relevantes)
  model.add(
    tf.layers.dense({
      units: 32,
      activation: 'relu'
    })
  )

  // Camada de saída
  // - 1 neurônio: retorna uma única pontuação (probabilidade de recomendação)
  // - activation: 'sigmoid' comprime o resultado para 0–1 (como uma probabilidade)
  //   Exemplo: 0.9 = recomendação forte, 0.1 = recomendação fraca
  model.add(
    tf.layers.dense({ units: 1, activation: 'sigmoid' })
  )

  // Configura como o modelo vai aprender
  // optimizer: adam (algoritmo que ajusta os pesos de forma inteligente)
  // loss: binaryCrossentropy (mede o erro para problemas de sim/não)
  // metrics: acompanha a precisão durante o treinamento
  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  })

  // Treina o modelo com os dados preparados
  // epochs: 100 (passa pelo dataset completo 100 vezes)
  // batchSize: 32 (processa 32 exemplos por vez)
  // shuffle: true (embaralha os dados a cada época)
  await model.fit(trainData.xs, trainData.ys, {
    epochs: 100,
    batchSize: 32,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        // Envia progresso do treinamento para a interface
        postMessage({
          type: workerEvents.trainingLog,
          epoch: epoch,
          loss: logs.loss,
          accuracy: logs.acc
        });
      }
    }
  })

  return model
}

// Função principal que treina o modelo com os usuários fornecidos
async function trainModel({ users }) {
  console.log('Training model with users:', users);
  postMessage({ type: workerEvents.progressUpdate, progress: { progress: 1 } });

  // Carrega os produtos do arquivo JSON
  const products = await (await fetch('/data/products.json')).json()

  // Prepara o contexto com todos os dados
  const context = makeContext(products, users)

  // Pré-calcula e armazena os vetores de todos os produtos
  context.productVectors = products.map(product => {
    return {
      name: product.name,
      meta: { ...product },
      vector: encodeProduct(product, context).dataSync()
    }
  })

  _globalCtx = context // guarda contexto globalmente

  // Cria dados de treinamento e treina a rede neural
  const trainData = createTrainingData(context)

  _model = await configureNeuralNetAndTrain(trainData)

  postMessage({ type: workerEvents.progressUpdate, progress: { progress: 100 } });
  postMessage({ type: workerEvents.trainingComplete });
}

// Função que recomenda produtos para um usuário específico
function recommend({ user }) {
  if (!_model) return;
  
  const context = _globalCtx

  // 1 - Converte o usuário em vetor numérico (mesmo formato do treinamento)
  const userVector = encodeUser(user, context).dataSync()

  // 2 - Cria pares: vetor do usuário + vetor de cada produto
  const inputs = context.productVectors.map(({ vector }) => {
    return [...userVector, ...vector]
  })

  // 3 - Converte todos os pares em um único tensor para processamento em lote
  const inputTensor = tf.tensor2d(inputs)

  // 4 - Faz a previsão para todos os produtos de uma vez.
  // O modelo retorna uma pontuação entre 0 e 1 para cada par
  const predictions = _model.predict(inputTensor)

  // 5 - Extrai as pontuações para um array JavaScript
  const scores = predictions.dataSync()

  // 6 - Combina cada produto com sua pontuação
  const recommendations = context.productVectors.map((item, index) => {
    return {
      ...item.meta,
      name: item.name,
      score: scores[index] // pontuação de recomendação
    }
  })

  // 7 - Ordena produtos do mais recomendado para o menos recomendado
  const sortedItems = recommendations
    .sort((a, b) => b.score - a.score)

  // 8 - Envia a lista ordenada para a interface exibir
  postMessage({
    type: workerEvents.recommend,
    user,
    recommendations: sortedItems
  })
}

// Mapeamento de eventos para suas respectivas funções
const handlers = {
  [workerEvents.trainModel]: trainModel,
  [workerEvents.recommend]: recommend,
}

// Escuta mensagens enviadas para este worker
self.onmessage = e => {
  const { action, ...data } = e.data;
  if (handlers[action]) handlers[action](data);
}
