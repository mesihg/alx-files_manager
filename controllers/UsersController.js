import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class UsersController {
  static async postNew (req, res) {
    const email = req.body ? req.body.email : null;
    const password = req.body ? req.body.password : null;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }

    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }
    const user = await (await dbClient.usersCollection()).findOne({ email });
    if (user) {
      res.status(400).json({ error: 'Already exist' });
      return;
    }
    const userInfo = await (await dbClient.usersCollection()).insertOne({ email, password: sha1(password) });
    const userId = userInfo.insertedId.toString();
    res.status(201).json({ email, id: userId });
  }

  static async getMe (req, res) {
    const authToken = req.header('X-Token');
    if (!authToken) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const token = `auth_${authToken}`;
    const userId = await redisClient.get(token);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const user = await (await dbClient.usersCollection()).findOne({ _id: ObjectId(userId) });

    if (user) {
      res.status(200).json({ email: user.email, id: userId });
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
}
