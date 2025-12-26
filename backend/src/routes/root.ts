import express from 'express';
import newDBRouter from './database/new.js';

const router = express.Router();

router.use('/db', newDBRouter);
export default router;