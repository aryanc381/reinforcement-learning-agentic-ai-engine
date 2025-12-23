import express from 'express';
import rootRouter from './routes/root.js';
import http from 'http';
import { initSocket } from './socket/index.js';


const app = express();
export const server = http.createServer(app);

initSocket(server);

app.use(express.json());

app.use('/api/', rootRouter);

server.listen(3000, () => { console.log('App is listening at PORT 3000.') });