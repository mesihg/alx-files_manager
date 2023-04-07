import sha1 from 'sha1';
import {
  v4 as uuidv4,
} from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const authToken = req.header('Authorization');
    const authTokenData = Buffer.from(authToken, 'base64').toString();
    const [email, password] = authTokenData.split(':');

    const userQuery = { email, password: sha1(password) };
    const user = await dbClient.db.collection('users').findOne(userQuery);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const token = uuidv4();
    const key = `auth_${token}`;
    await redisClient.set(key, user._id.toString(), 60 * 60 * 24);
    res.status(200).json({
      token,
    });
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
