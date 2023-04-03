import { MongoClient } from 'mongodb';

class DBClient {
  constructor () {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    const uri = `mongodb://${host}:${port}/${database}`;

    this.client = new MongoClient(uri);
    this.client.connect();
  }

  async isAlive () {
    return this.client.isConnected();
  }

  async nbUsers () {
    const usersCollection = this.client.db().collection('users');
    return usersCollection.countDocuments();
  }

  async nbFiles () {
    const filesCollection = this.client.db().collection('files');
    return filesCollection.countDocuments();
  }
}

export const dbClient = new DBClient();
export default dbClient;
