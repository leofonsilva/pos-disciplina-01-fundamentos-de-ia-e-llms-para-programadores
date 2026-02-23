import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
import { workerEvents } from '../events/constants.js';

async function trainModel({ users }) {
  console.log('Training model with users:', users);
  postMessage({ type: workerEvents.progressUpdate, progress: { progress: 1 } });
  postMessage({ type: workerEvents.progressUpdate, progress: { progress: 100 } });
  postMessage({ type: workerEvents.trainingComplete });
}
function recommend({ user }) {

  // postMessage({
  //     type: workerEvents.recommend,
  //     user,
  //     recommendations: sortedItems
  // });

}
const handlers = {
  [workerEvents.trainModel]: trainModel,
  [workerEvents.recommend]: recommend,
};

self.onmessage = e => {
  const { action, ...data } = e.data;
  if (handlers[action]) handlers[action](data);
};
