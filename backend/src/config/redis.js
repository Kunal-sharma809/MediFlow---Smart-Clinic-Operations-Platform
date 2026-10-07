const Redis = require('ioredis');
const { Queue, Worker } = require('bullmq');

let redisClient = null;
let isRedisAvailable = false;
let mockQueue = [];

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const initRedis = async () => {
  return new Promise((resolve) => {
    const client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // don't retry continuously if offline
      enableOfflineQueue: false
    });

    client.on('connect', () => {
      console.log('[Redis] Connected to Redis server.');
      isRedisAvailable = true;
      redisClient = client;
      resolve(true);
    });

    client.on('error', (err) => {
      if (!isRedisAvailable) {
        console.warn(`[Redis] Redis connection unavailable (${err.message}). Using event-driven memory queue fallback.`);
      }
      client.disconnect();
      resolve(false);
    });
  });
};

// Queue wrapper supporting BullMQ or Memory Queue
class FlexibleQueue {
  constructor(queueName, processCallback) {
    this.name = queueName;
    this.processCallback = processCallback;
    this.bullQueue = null;
    this.bullWorker = null;

    if (isRedisAvailable && redisClient) {
      try {
        const connection = { host: redisClient.options.host, port: redisClient.options.port };
        this.bullQueue = new Queue(queueName, { connection });
        this.bullWorker = new Worker(queueName, async (job) => {
          return await this.processCallback(job.data);
        }, { connection });

        console.log(`[Queue] BullMQ Queue '${queueName}' initialized with Redis.`);
      } catch (e) {
        console.warn(`[Queue] Failed to initialize BullMQ (${e.message}). Falling back to memory queue.`);
      }
    }
  }

  async add(jobName, data, opts = {}) {
    if (this.bullQueue) {
      return await this.bullQueue.add(jobName, data, opts);
    } else {
      // Memory Queue simulation with optional delay
      const delay = opts.delay || 0;
      console.log(`[Queue:Memory] Enqueued job '${jobName}' in queue '${this.name}' (delay: ${delay}ms).`);
      
      if (delay > 0) {
        setTimeout(async () => {
          try {
            await this.processCallback(data);
          } catch (err) {
            console.error(`[Queue:Memory] Error processing job '${jobName}':`, err);
          }
        }, delay);
      } else {
        setImmediate(async () => {
          try {
            await this.processCallback(data);
          } catch (err) {
            console.error(`[Queue:Memory] Error processing job '${jobName}':`, err);
          }
        });
      }
      return { id: 'mem_' + Date.now(), data };
    }
  }
}

module.exports = { initRedis, FlexibleQueue, getIsRedisAvailable: () => isRedisAvailable };
