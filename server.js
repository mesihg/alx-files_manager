import express from 'express';
import loadRoutes from './routes';

const server = express();
const port = process.env.PORT || 5000;
server.use(express.json({ limit: '200mb' }));
loadRoutes(server);
server.listen(port, ()=> {
 console.log(`Server started listening at port:${port}`);
});
export default server;
