import { MongoClient } from 'mongodb';
// eslint-disable-next-line no-unused-vars
import Collection from 'mongodb/lib/collection';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';
const uri = `mongodb://${DB_HOST}:${DB_PORT}}`;

/**
 * @class DBClient
 * @description Represents a MongoDb client
 */
class DBClient {
/**
 * Create a new MongoDB instance
 */
  constructor () {
    MongoClient.connect(uri, (error, client) => {
      if (error) {
        console.log(error.message);
        this.client = false;
        return;
      }
      this.client = client.db(DB_DATABASE);
      this.users = this.db.collection('users');
      this.files = this.db.collection('files');
    });
  }

  /**
 * checks if the client is connected
 * @returns {boolean}
 */
  isAlive () {
    return !!this.client;
  }

  /**
 * Retrieves the number of users
 * @returns {Promise<Number>}
 */
  async nbUsers () {
    return this.users.countDocuments();
  }

  /**
 * Retrieves the number of files
 * @returns {Promise<Number>}
 */
  async nbFiles () {
    return this.files.countDocuments();
  }

  /**
 * Retrieves a reference to the users collection
 * @returns {Promise<Collection>}
 */
  async usersCollection () {
    return this.users;
  }

  /**
 * Retrieves a reference to the files collection
 * @returns {Promise<Collection>}
 */
  async filesCollection () {
    return this.files;
  }
}

const dbClient = new DBClient();
export default dbClient;
