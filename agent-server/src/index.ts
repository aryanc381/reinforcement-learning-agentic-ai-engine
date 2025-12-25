import express from 'express';
import cors from 'cors';
import http from 'http';
import { initSocket } from './socket/index.js';

const app = express();
app.use(cors());

const server = http.createServer(app);

initSocket(server);

server.listen(3000, () => { console.log('Server is listening at PORT-3000.'); });