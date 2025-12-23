import express from 'express';
import rootRouter from './routes/root.js';
import http from 'http';


const app = express();
export const server = http.createServer(app);

import "./socket/index.js"; 

app.use(express.json());

app.use('/api/', rootRouter);

server.listen(3000, () => { console.log('App is listening at PORT 3000.') });