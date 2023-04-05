import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export default class AuthController {
  static async getConnect (req, res) {
    const token = req.headers.authorization.split(' ')[1];
    const [email, password] = Buffer.from(token, 'base64').toString().split(':');

    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!password) return res.status(400).json({ error: 'Missing password' });

    const query = { email, password: sha1(password) };
    const user = await (await dbClient.usersCollection()).findOne(query);

    const tokenId = uuidv4();

    await redisClient.set(`auth_${token}`, user._id.toString(), 24 * 60 * 60);
    res.status(200).json({ token: tokenId });
  }

  static async getDisconnect (req, res) {
    let token = req.header('X-Token');
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    token = `auth_${token}`;
    const user = await redisClient.get(token);
    if (user) {
      await redisClient.del(token);
      res.status(204).send();
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
}
