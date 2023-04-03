import { createClient } from 'redis';

/**
 * Represents a Redis client class
 */
class RedisClient {
  constructor () {
    this.client = createClient();
    this.isConnected = true;
    this.client.on('error', (err) => {
      console.error(err);
      this.isConnected = false;
    });

    this.client.on('connect', (err, result) => {
      if (err) {
        this.isConnected = false;
      }
      this.isConnected = true;
    });
  }

  /**
   * Check if the client is connected to redis server
   * @returns {boolean}
   */
  isAlive () {
    return this.isConnected;
  }

  /**
   * Retrieves the value of the given key
   * @param {String} key The key of the item to retrieve
   * @returns {String | Object}
   */
  async get (key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result);
      });
    });
  }

  /**
   * Set a key and its value with its duration
   * @param {String} key the key of the item to be set
   * @param {String | Number | Boolean} value to the item
   * @param {Number} duration of the expire time of the item
   * @returns {Promise<void>}
   */
  async set (key, value, duration) {
    return new Promise((resolve, reject) => {
      this.client.setex(key, duration, value, (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result);
      });
    });
  }

  /**
   * Removes the value of  given a key
   * @param {String} key the key of the item to remove
   * @returns {Promise<void>}
   */
  async del (key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result);
      });
    });
  }
}

export const redisClient = new RedisClient();
export default redisClient;
