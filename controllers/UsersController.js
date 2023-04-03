import sha1 from 'sha1';
import dbClient from '../utils/db';

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
}
