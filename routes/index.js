import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

/**
 * Inject routes with the given express instance
 * @param {Express } api
 */
const loadRoutes = (api) => {
  api.get('/status', AppController.getStatus);
  api.get('/stats', AppController.getStats);
  api.post('/users', UsersController.postNew);
};

export default loadRoutes;
