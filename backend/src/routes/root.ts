import express from 'express';
import newDBRouter from './postprocessing/new.js';
import cosineSimRouter from './preprocessing/similarity.js';
import deciderRouter from './postprocessing/decider.js';
import oldCosineSimRouter from './preprocessing/similarityF.js';

const router = express.Router();

router.use('/db', newDBRouter);
router.use('/search', cosineSimRouter, oldCosineSimRouter);
router.use('/reinforcement', deciderRouter);

export default router;