import express from 'express';
import http from 'http';
import { initSocket } from './socket/index2.js';


const app = express();
export const server = http.createServer(app);

initSocket(server);

app.use(express.json());


server.listen(3000, () => { console.log('App is listening at PORT 3000.') });