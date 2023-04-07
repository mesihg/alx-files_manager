import {
  v4 as uuidv4,
}
  from 'uuid';
import {
  promises as fs,
} from 'fs';
import {
  ObjectId,
} from 'mongodb';
import mime from 'mime-types';
import Queue from 'bull';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');
class FilesController {
  static async getUser(request) {
    const token = request.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (userId) {
      const users = dbClient.db.collection('users');
      const idObject = new ObjectId(userId);
      const user = await users.findOne({
        _id: idObject,
      });
      if (!user) {
        return null;
      }
      return user;
    }
    return null;
  }

  static async postUpload(request, response) {
    const user = await FilesController.getUser(request);
    if (!user) {
      return response.status(401).json({
        error: 'Unauthorized',
      });
    }
    const {
      name,
    } = request.body;
    const {
      type,
    } = request.body;
    const {
      parentId,
    } = request.body;
    const isPublic = request.body.isPublic || false;
    const {
      data,
    } = request.body;
    if (!name) {
      return response.status(400).json({
        error: 'Missing name',
      });
    }
    if (!type) {
      return response.status(400).json({
        error: 'Missing type',
      });
    }
    if (type !== 'folder' && !data) {
      return response.status(400).json({
        error: 'Missing data',
      });
    }
    const files = dbClient.db.collection('files');
    if (parentId) {
      const idObject = new ObjectId(parentId);
      const file = await files.findOne({
        _id: idObject,
        userId: user._id,
      });
      if (!file) {
        return response.status(400).json({
          error: 'Parent not found',
        });
      }
      if (file.type !== 'folder') {
        return response.status(400).json({
          error: 'Parent is not a folder',
        });
      }
    }
    if (type === 'folder') {
      files.insertOne({
        userId: user._id,
        name,
        type,
        parentId: parentId || 0,
        isPublic,
      }).then((result) => response.status(201).json({
        id: result.insertedId,
        userId: user._id,
        name,
        type,
        isPublic,
        parentId: parentId || 0,
      })).catch((error) => {
        console.log(error);
      });
    } else {
      const filePath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const fileName = `${filePath}/${uuidv4()}`;
      const buff = Buffer.from(data, 'base64');
      try {
        try {
          await fs.mkdir(filePath);
        } catch (error) {
          console.log(error);
        }
        await fs.writeFile(fileName, buff, 'utf-8');
      } catch (error) {
        console.log(error);
      }
      files.insertOne({
        userId: user._id,
        name,
        type,
        isPublic,
        parentId: parentId || 0,
        localPath: fileName,
      }).then((result) => {
        response.status(201).json({
          id: result.insertedId,
          userId: user._id,
          name,
          type,
          isPublic,
          parentId: parentId || 0,
        });
        if (type === 'image') {
          fileQueue.add({
            userId: user._id,
            fileId: result.insertedId,
          });
        }
      }).catch((error) => console.log(error));
    }
    return null;
  }

  static async getShow(request, response) {
    const user = await FilesController.getUser(request);
    if (!user) {
      return response.status(401).json({
        error: 'Unauthorized',
      });
    }
    const fileId = request.params.id;
    const files = dbClient.db.collection('files');
    const idObject = new ObjectId(fileId);
    const file = await files.findOne({
      _id: idObject,
      userId: user._id,
    });
    if (!file) {
      return response.status(404).json({
        error: 'Not found',
      });
    }
    return response.status(200).json(file);
  }

  static async getIndex(request, response) {
    const token = request.header('X-Token') || null;
    if (!token) return response.status(401).send({ error: 'Unauthorized' });

    const redisToken = await redisClient.get(`auth_${token}`);
    if (!redisToken) return response.status(401).send({ error: 'Unauthorized' });

    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(redisToken) });
    if (!user) return response.status(401).send({ error: 'Unauthorized' });

    const parentId = request.query.parentId || 0;

    const pagination = request.query.page || 0;

    const aggregationMatch = { $and: [{ parentId }] };
    let aggregateData = [{ $match: aggregationMatch }, { $skip: pagination * 20 }, { $limit: 20 }];
    if (parentId === 0) aggregateData = [{ $skip: pagination * 20 }, { $limit: 20 }];

    const files = await dbClient.db.collection('files').aggregate(aggregateData);
    const filesArray = [];
    await files.forEach((item) => {
      const fileItem = {
        id: item._id,
        userId: item.userId,
        name: item.name,
        type: item.type,
        isPublic: item.isPublic,
        parentId: item.parentId,
      };
      filesArray.push(fileItem);
    });

    return response.send(filesArray);
  }

  static async putPublish(request, response) {
    const user = await FilesController.getUser(request);
    if (!user) {
      return response.status(401).json({
        error: 'Unauthorized',
      });
    }
    const {
      id,
    } = request.params;
    const files = dbClient.db.collection('files');
    const idObject = new ObjectId(id);
    const newValue = {
      $set: {
        isPublic: true,
      },
    };
    const options = {
      returnOriginal: false,
    };
    files.findOneAndUpdate({
      _id: idObject,
      userId: user._id,
    }, newValue, options, (err, file) => {
      if (!file.lastErrorObject.updatedExisting || err) {
        return response.status(404).json({
          error: 'Not found',
        });
      }
      return response.status(200).json(file.value);
    });
    return null;
  }

  static async putUnpublish(request, response) {
    const user = await FilesController.getUser(request);
    if (!user) {
      return response.status(401).json({
        error: 'Unauthorized',
      });
    }
    const {
      id,
    } = request.params;
    const files = dbClient.db.collection('files');
    const idObject = new ObjectId(id);
    const newValue = {
      $set: {
        isPublic: false,
      },
    };
    const options = {
      returnOriginal: false,
    };
    files.findOneAndUpdate({
      _id: idObject,
      userId: user._id,
    }, newValue, options, (err, file) => {
      if (!file.lastErrorObject.updatedExisting || err) {
        return response.status(404).json({
          error: 'Not found',
        });
      }
      return response.status(200).json(file.value);
    });
    return null;
  }

  static async getFile(request, response) {
    const {
      id,
    } = request.params;
    const files = dbClient.db.collection('files');
    const idObject = new ObjectId(id);
    files.findOne({
      _id: idObject,
    }, async (err, file) => {
      if (!file || err) {
        return response.status(404).json({
          error: 'Not found',
        });
      }
      console.log(file.localPath);
      if (file.isPublic) {
        if (file.type === 'folder') {
          return response.status(400).json({
            error: "A folder doesn't have content",
          });
        }
        try {
          let fileName = file.localPath;
          const size = request.param('size');
          if (size) {
            fileName = `${file.localPath}_${size}`;
          }
          const data = await fs.readFile(fileName);
          const contentType = mime.contentType(file.name);
          return response.header('Content-Type', contentType).status(200).send(data);
        } catch (error) {
          console.log(error);
          return response.status(404).json({
            error: 'Not found',
          });
        }
      } else {
        const user = await FilesController.getUser(request);
        if (!user) {
          return response.status(404).json({
            error: 'Not found',
          });
        }
        if (file.userId.toString() === user._id.toString()) {
          if (file.type === 'folder') {
            return response.status(400).json({
              error: "A folder doesn't have content",
            });
          }
          try {
            let fileName = file.localPath;
            const size = request.param('size');
            if (size) {
              fileName = `${file.localPath}_${size}`;
            }
            const contentType = mime.contentType(file.name);
            return response.header('Content-Type', contentType).status(200).sendFile(fileName);
          } catch (error) {
            console.log(error);
            return response.status(404).json({
              error: 'Not found',
            });
          }
        } else {
          console.log(`Wrong user: file.userId=${file.userId}; userId=${user._id}`);
          return response.status(404).json({
            error: 'Not found',
          });
        }
      }
    });
  }
}
module.exports = FilesController;
