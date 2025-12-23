import express from 'express';
import v1Router from './beta/v1.js';
const router = express.Router();
router.use('/beta', v1Router);
export default router;
//# sourceMappingURL=root.js.map