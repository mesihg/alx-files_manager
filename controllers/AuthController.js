import sha1 from 'sha1';
import {
  v4 as uuidv4,
} from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const authToken = req.header('Authorization') || null;
    if (!authToken) return res.status(401).json({ error: 'Unauthorized' });

    const buff = Buffer.from(authToken.replace('Basic ', ''), 'base64');
    const credentials = {
      email: buff.toString('utf-8').split(':')[0],
      password: buff.toString('utf-8').split(':')[1],
    };

    if (!credentials.email || !credentials.password) return res.status(401).json({ error: 'Unauthorized' });

    credentials.password = sha1(credentials.password);

    const userExists = await dbClient.db.collection('users').findOne(credentials);
    if (!userExists) return res.status(401).json({ error: 'Unauthorized' });

    const token = uuidv4();
    const key = `auth_${token}`;
    await redisClient.set(key, userExists._id.toString(), 86400);

    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const id = await redisClient.get(key);
    if (id) {
      await redisClient.del(key);
      res.status(204).json({});
    } else {
      res.status(401).json({
        error: 'Unauthorized',
      });
    }
  }
}

module.exports = AuthController;
