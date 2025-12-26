import express from 'express';
import newDBRouter from './data-fetches/new.js';
import cosineSimRouter from './data-fetches/similarity.js';

const router = express.Router();

router.use('/db', newDBRouter);
router.use('/search', cosineSimRouter);

export default router;