import { MongoClient } from 'mongodb';
// eslint-disable-next-line no-unused-vars
import Collection from 'mongodb/lib/collection';

/**
 * Represents a MongoDb client
 * @class DBClient
 * @description Represents a MongoDb client
 */
class DBClient {
  /**
   * Create a new MongoDB instance
   */
  constructor () {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    const uri = `mongodb://${host}:${port}/${database}`;

    this.client = new MongoClient(uri, { useUnifiedTopology: true });
    this.client.connect();
  }

  /**
   * checks if the client is connected
   * @returns {boolean}
   */
  isAlive () {
    // return this.client.topology.isConnected();
    return this.client.isConnected();
  }

  /**
   * Retrieves the number of users
   * @returns {Promise<Number>}
   */
  async nbUsers () {
    const usersCollection = this.client.db().collection('users');
    return usersCollection.countDocuments();
  }

  /**
   * Retrieves the number of files
   * @returns {Promise<Number>}
   */
  async nbFiles () {
    const filesCollection = this.client.db().collection('files');
    return filesCollection.countDocuments();
  }

  /**
   * Retrieves a reference to the users collection
   * @returns {Promise<Collection>}
   */
  async usersCollection () {
    return this.client.db().collection('users');
  }

  /**
   * Retrieves a reference to the files collection
   * @returns {Promise<Collection>}
   */
  async filesCollection () {
    return this.client.db().collection('files');
  }
}

const dbClient = new DBClient();
export default dbClient;
