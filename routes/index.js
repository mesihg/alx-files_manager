import { Express } from 'express';
import AppController from '../controllers/AppController';

/**
 * Inject routes with the given express instance
 * @param {Express } api
 */
const loadRoutes = (api) => {
  api.get('/status', AppController.getStatus);
  api.get('/stats', AppController.getStats);
};

export default loadRoutes;
