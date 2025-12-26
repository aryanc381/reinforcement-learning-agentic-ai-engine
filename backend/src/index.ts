import express from 'express';
import cors from 'cors';
import rootRouter from './routes/root.js';

const app = express();

app.use(express.json());
app.use(cors());

app.use('/v1/api', rootRouter);

app.listen(4000, () => { console.log("APP is running at PORT-4000."); });