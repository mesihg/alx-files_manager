import sha1 from 'sha1';
import {
  v4 as uuidv4,
} from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const authToken = req.header('Authorization');
    if (!authToken) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const authTokenDecoded = Buffer.from(authToken.split(' ')[1],
      'base64').toString('utf8');

    const [email, password] = authTokenDecoded.split(':');
    if (!email || !password) {
      res.status(401).send({ error: 'Unauthorized' });
      return;
    }

    const hashedPassword = sha1(password);
    const users = dbClient.db.collection('users');
    users.findOne({
      email,
      password: hashedPassword,
    }, async (err, user) => {
      if (user) {
        const token = uuidv4();
        const key = `auth_${token}`;
        await redisClient.set(key, user._id.toString(), 60 * 60 * 24);
        res.status(200).json({
          token,
        });
      } if (err) {
        res.status(401).json({
          error: 'Unauthorized',
        });
      }
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
