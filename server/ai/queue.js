/**
 * Cola de ejecución concurrente para procesos de `agy`.
 * Limita la ejecución simultánea a un máximo de 2 procesos (configurable)
 * y notifica a las solicitudes en espera su posición mediante `onQueued`.
 */
export class AiQueue {
  constructor(maxConcurrent = 2) {
    this.maxConcurrent = Math.max(1, Number(maxConcurrent) || 2);
    this.activeCount = 0;
    this.waiting = [];
  }

  getStats() {
    return {
      active: this.activeCount,
      waiting: this.waiting.length,
      maxConcurrent: this.maxConcurrent,
    };
  }

  /**
   * Encola una tarea asíncrona `taskFn`.
   * @param {() => Promise<any>} taskFn Función que ejecuta el proceso `agy`.
   * @param {object} [options]
   * @param {(info: { position: number, active: number, waiting: number }) => void} [options.onQueued]
   * @param {AbortSignal} [options.signal]
   */
  enqueue(taskFn, { onQueued, signal } = {}) {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        const abortErr = new Error('Solicitud cancelada antes de entrar en cola.');
        abortErr.code = 'ABORTED';
        reject(abortErr);
        return;
      }

      if (this.activeCount < this.maxConcurrent) {
        this._runTask(taskFn, resolve, reject);
        return;
      }

      const entry = {
        taskFn,
        resolve,
        reject,
        onQueued,
        signal,
        abortHandler: null,
      };

      if (signal) {
        entry.abortHandler = () => {
          const idx = this.waiting.indexOf(entry);
          if (idx !== -1) {
            this.waiting.splice(idx, 1);
          }
          const abortErr = new Error('Solicitud cancelada mientras esperaba en cola.');
          abortErr.code = 'ABORTED';
          reject(abortErr);
        };
        signal.addEventListener('abort', entry.abortHandler, { once: true });
      }

      this.waiting.push(entry);
      const position = this.waiting.length;

      if (typeof onQueued === 'function') {
        try {
          onQueued({
            position,
            active: this.activeCount,
            waiting: this.waiting.length,
          });
        } catch {
          // No interrumpir la cola si el callback SSE falla
        }
      }
    });
  }

  _runTask(taskFn, resolve, reject) {
    this.activeCount += 1;
    let taskPromise;
    try {
      taskPromise = Promise.resolve(taskFn());
    } catch (syncErr) {
      this.activeCount -= 1;
      this._drain();
      reject(syncErr);
      return;
    }
    taskPromise.then(
      (result) => {
        this.activeCount -= 1;
        this._drain();
        resolve(result);
      },
      (err) => {
        this.activeCount -= 1;
        this._drain();
        reject(err);
      }
    );
  }

  _drain() {
    while (this.activeCount < this.maxConcurrent && this.waiting.length > 0) {
      const next = this.waiting.shift();
      if (!next) break;
      if (next.signal && next.abortHandler) {
        next.signal.removeEventListener('abort', next.abortHandler);
      }
      if (next.signal?.aborted) {
        const abortErr = new Error('Solicitud cancelada en cola.');
        abortErr.code = 'ABORTED';
        next.reject(abortErr);
        continue;
      }
      this._runTask(next.taskFn, next.resolve, next.reject);
    }
  }
}

export const defaultAiQueue = new AiQueue(2);
export default AiQueue;
