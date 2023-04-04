import { createClient } from 'redis';
import { promisify } from 'util';

/**
 * @class RedisClient
 * @description Represents a Redis client class
 */
class RedisClient {
  /**
   * Create a new Redis instance
   */
  constructor () {
    this.client = createClient();
    this.getClient = promisify(this.client.get).bind(this.client);
    this.client.on('error', (err) => {
      console.log(`Redis client not connected: ${err.message}`);
    });
  }

  /**
   * Check if the client is connected to redis server
   * @returns {boolean}
   */
  isAlive () {
    return this.client.connected;
  }

  /**
   * Retrieves the value of the given key
   * @param {String} key The key of the item to retrieve
   * @returns {String | Object}
   */
  async get (key) {
    const value = await this.getClient(key);
    return value;
  }

  /**
   * Set a key and its value with its duration
   * @param {String} key the key of the item to be set
   * @param {String | Number | Boolean} value to the item
   * @param {Number} duration of the expire time of the item
   * @returns {Promise<void>}
   */
  async set (key, value, duration) {
    this.client.setex(key, duration, value);
  }

  /**
   * Removes the value of  given a key
   * @param {String} key the key of the item to remove
   * @returns {Promise<void>}
   */
  async del (key) {
    this.client.del(key);
  }
}

export const redisClient = new RedisClient();
export default redisClient;
